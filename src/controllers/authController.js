const { User } = require('../models');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const { generateToken: generateVerificationToken } = require('../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');


const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json(req.t('auth.error.email_already_exists'));
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      verificationToken
    });

    await sendVerificationEmail(email, verificationToken, req.lang, { firstName });

    res.status(201).json({
      ...req.t('auth.ok.account_created'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json(req.t('auth.error.invalid_credentials'));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(req.t('auth.error.invalid_credentials'));
    }

    if (!user.isVerified) {
      return res.status(401).json(req.t('auth.error.account_not_verified'));
    }

    if (user.status === 'inactive') {
      return res.status(403).json(req.t('auth.error.account_inactive'));
    }

    if (user.status === 'banned') {
      return res.status(403).json(req.t('auth.error.account_banned'));
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      ...req.t('auth.ok.login_success'),
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] }
    });

    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json(req.t('auth.error.token_invalid'));
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json(req.t('auth.ok.email_verified'));
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const changePassword = async (req, res) => {
  try {

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(req.t('auth.error.password_incorrect'));
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json(req.t('auth.ok.password_changed'));
  } catch (error) {
    console.error('Error cambiando password:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const updateProfile = async (req, res) => {
  try {

    const { firstName, lastName, phone } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone !== undefined ? phone : user.phone
    });

    res.json({
      ...req.t('auth.ok.profile_updated'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const requestEmailChange = async (req, res) => {
  try {

    const { newEmail, password } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(req.t('auth.error.password_incorrect'));
    }

    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json(req.t('auth.error.email_already_exists'));
    }

    const verificationToken = generateVerificationToken();
    user.pendingEmail = newEmail;
    user.verificationToken = verificationToken;
    await user.save();

    // Enviar email de verificación al nuevo email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-new-email?token=${verificationToken}`;
    const { sendEmail } = require('../services/email');
    const { translate } = require('../utils/translator');
    
    await sendEmail({
      to: newEmail,
      subject: translate('mail.verify_email.subject', req.lang),
      html: `
        <h1>${translate('mail.verify_email.salute', req.lang)}</h1>
        <p>${translate('mail.verify_email.body', req.lang)}</p>
        <a href="${verificationUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">${translate('mail.verify_email.button', req.lang)}</a>
        <p>${translate('mail.verify_email.fallback', req.lang)}</p>
        <p>${verificationUrl}</p>
      `
    });

    res.json(req.t('auth.ok.email_change_requested'));
  } catch (error) {
    console.error('Error solicitando cambio de email:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user || !user.pendingEmail) {
      return res.status(400).json(req.t('auth.error.token_invalid'));
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.verificationToken = null;
    await user.save();

    res.json(req.t('auth.ok.email_changed'));
  } catch (error) {
    console.error('Error verificando cambio de email:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(req.t('auth.error.password_incorrect'));
    }

    user.status = 'inactive';
    await user.save();

    res.json(req.t('auth.ok.account_deactivated'));
  } catch (error) {
    console.error('Error desactivando cuenta:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json(req.t('auth.ok.password_reset_sent'));
    }

    const resetToken = generateVerificationToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    await sendPasswordResetEmail(email, resetToken, req.lang, user);

    res.json(req.t('auth.ok.password_reset_sent'));
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const resetPassword = async (req, res) => {
  try {

    const { token, password } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json(req.t('auth.error.token_invalid'));
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json(req.t('auth.ok.password_reset_success'));
  } catch (error) {
    console.error('Error reseteando password:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  changePassword,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  deactivateAccount,
  forgotPassword,
  resetPassword
};
