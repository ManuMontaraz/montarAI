const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashPassword, comparePassword } = require('../utils/auth');
const { generateToken: generateVerificationToken } = require('../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const { Op } = require('sequelize');

// Helper para escapar HTML y prevenir inyección de código
const escapeHtml = (unsafe) => {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validar formato del token (debe ser string hexadecimal de 64 caracteres)
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  // Token debe ser exactamente 64 caracteres hexadecimales
  return /^[a-f0-9]{64}$/i.test(token);
};


const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json(req.t('auth.error.email_already_exists'));
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      verificationToken,
      verificationTokenExpires: tokenExpires
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
      // Generar nuevo token y reenviar email de verificación
      const newVerificationToken = generateVerificationToken();
      user.verificationToken = newVerificationToken;
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      await user.save();

      await sendVerificationEmail(user.email, newVerificationToken, req.lang, { 
        firstName: user.firstName 
      });

      return res.status(401).json({
        ...req.t('auth.error.account_not_verified'),
        resent: true
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json(req.t('auth.error.account_inactive'));
    }

    if (user.status === 'banned') {
      return res.status(403).json(req.t('auth.error.account_banned'));
    }

    // Generar tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion
    });

    // Guardar refresh token en DB
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    await user.save();

    res.json({
      ...req.t('auth.ok.login_success'),
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
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

const generateVerifyEmailHtml = (title, message, isSuccess, closeMessage) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; margin-bottom: 30px; }
        .close-hint {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon ${isSuccess ? 'success' : 'error'}">${isSuccess ? '✓' : '✗'}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <p class="close-hint">${closeMessage}</p>
    </div>
</body>
</html>`;
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      const html = generateVerifyEmailHtml(
        req.t('auth.verify_email_page.error_title').message,
        req.t('auth.error.token_invalid').message,
        false,
        req.t('auth.verify_email_page.close_message').message
      );
      return res.status(400).send(html);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    const html = generateVerifyEmailHtml(
      req.t('auth.verify_email_page.success_title').message,
      req.t('auth.ok.email_verified').message,
      true,
      req.t('auth.verify_email_page.close_message').message
    );
    res.send(html);
  } catch (error) {
    console.error('Error verificando email:', error);
    const html = generateVerifyEmailHtml(
      req.t('auth.verify_email_page.error_title').message,
      req.t('general.error.server_error').message,
      false,
      req.t('auth.verify_email_page.close_message').message
    );
    res.status(500).send(html);
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

    console.log('[Forgot Password] Solicitud recibida para email:', email);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('[Forgot Password] Usuario no encontrado, respondiendo genéricamente');
      return res.status(200).json(req.t('auth.ok.password_reset_sent'));
    }

    const resetToken = generateVerificationToken();
    console.log('[Forgot Password] Token generado:', resetToken.substring(0, 10) + '...');
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    console.log('[Forgot Password] Token guardado. Expira:', user.resetPasswordExpires);

    await sendPasswordResetEmail(email, resetToken, req.lang, user);

    res.json(req.t('auth.ok.password_reset_sent'));
  } catch (error) {
    console.error('[Forgot Password] Error en forgot password:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const resetPassword = async (req, res) => {
  try {

    const { token, password } = req.body;

    // Debug: log del token recibido
    console.log('[Reset Password POST] Token recibido:', token ? `${token.substring(0, 10)}...` : 'NO_TOKEN');
    console.log('[Reset Password POST] Body:', { ...req.body, password: '***' });

    // Validar formato del token
    if (!isValidTokenFormat(token)) {
      console.log('[Reset Password POST] Error: Formato de token inválido');
      return res.status(400).json(req.t('auth.error.token_invalid'));
    }

    const now = new Date();
    console.log('[Reset Password POST] Buscando usuario. Fecha actual:', now);

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: now }
      }
    });

    if (!user) {
      console.log('[Reset Password POST] Error: Token no encontrado o expirado');
      // Verificar si el token existe pero está expirado
      const expiredUser = await User.findOne({
        where: { resetPasswordToken: token }
      });
      if (expiredUser) {
        console.log('[Reset Password POST] Token existe pero expiró. Expira:', expiredUser.resetPasswordExpires);
      }
      return res.status(400).json(req.t('auth.error.token_invalid'));
    }

    console.log('[Reset Password POST] Usuario encontrado:', user.email);

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('[Reset Password POST] Contraseña actualizada exitosamente');

    res.json(req.t('auth.ok.password_reset_success'));
  } catch (error) {
    console.error('[Reset Password POST] Error reseteando password:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const showResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.query;
    
    // Debug: log del token recibido
    console.log('[Password Reset] Token recibido:', token ? `${token.substring(0, 10)}...` : 'NO_TOKEN');
    console.log('[Password Reset] Query params:', req.query);
    console.log('[Password Reset] Raw URL:', req.originalUrl);

    // Validar que el token existe
    if (!token) {
      console.log('[Password Reset] Error: Token no proporcionado');
      const html = generateResetPasswordErrorHtml(
        req.t('auth.reset_password_page.error_title').message,
        req.t('auth.reset_password_page.error_invalid_token').message,
        req.t('auth.reset_password_page.close_message').message
      );
      return res.status(400).send(html);
    }

    // Validar formato del token
    if (!isValidTokenFormat(token)) {
      console.log('[Password Reset] Error: Formato de token inválido');
      const html = generateResetPasswordErrorHtml(
        req.t('auth.reset_password_page.error_title').message,
        req.t('auth.reset_password_page.error_invalid_token').message,
        req.t('auth.reset_password_page.close_message').message
      );
      return res.status(400).send(html);
    }

    // Verificar que el token existe y no ha expirado
    const now = new Date();
    console.log('[Password Reset] Buscando usuario con token. Fecha actual:', now);
    
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: now }
      }
    });

    if (!user) {
      console.log('[Password Reset] Error: Token no encontrado o expirado');
      // Verificar si el token existe pero está expirado
      const expiredUser = await User.findOne({
        where: { resetPasswordToken: token }
      });
      if (expiredUser) {
        console.log('[Password Reset] Token existe pero expiró. Expira:', expiredUser.resetPasswordExpires);
      }
      
      // Token inválido o expirado - mostrar página de error
      const html = generateResetPasswordErrorHtml(
        req.t('auth.reset_password_page.error_title').message,
        req.t('auth.reset_password_page.error_invalid_token').message,
        req.t('auth.reset_password_page.close_message').message
      );
      return res.status(400).send(html);
    }

    console.log('[Password Reset] Token válido para usuario:', user.email);

    // Token válido - mostrar formulario
    const html = generateResetPasswordFormHtml(
      token,
      req.t('auth.reset_password_page.title').message,
      req.t('auth.reset_password_page.form_title').message,
      req.t('auth.reset_password_page.new_password_label').message,
      req.t('auth.reset_password_page.confirm_password_label').message,
      req.t('auth.reset_password_page.submit_button').message,
      req.t('auth.reset_password_page.password_mismatch').message,
      req.t('auth.reset_password_page.password_too_short').message,
      req.t('auth.reset_password_page.success_title').message,
      req.t('auth.reset_password_page.success_message').message,
      req.t('auth.reset_password_page.go_to_login').message,
      req.t('auth.reset_password_page.error_generic').message
    );
    res.send(html);
  } catch (error) {
    console.error('[Password Reset] Error mostrando página de reset:', error);
    const html = generateResetPasswordErrorHtml(
      req.t('auth.reset_password_page.error_title').message,
      req.t('general.error.server_error').message,
      req.t('auth.reset_password_page.close_message').message
    );
    res.status(500).send(html);
  }
};

const generateResetPasswordFormHtml = (rawToken, title, formTitle, newPasswordLabel, confirmPasswordLabel, submitButton, passwordMismatchMsg, passwordTooShortMsg, successTitle, successMessage, goToLoginMsg, errorGenericMsg) => {
  // Escapar el token para seguridad HTML (solo para mostrar en el HTML como texto)
  const safeToken = escapeHtml(rawToken);
  // Escapar para JavaScript: solo caracteres que rompen strings
  // Esto es seguro porque el token solo contiene caracteres hexadecimales [a-f0-9]
  const jsSafeToken = rawToken ? rawToken.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') : '';
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            width: 100%;
            max-width: 400px;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 24px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #007bff;
        }
        button {
            width: 100%;
            padding: 14px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .error {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        .message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }
        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .hidden { display: none !important; }
        .login-link {
            text-align: center;
            margin-top: 20px;
        }
        .login-link a {
            color: #007bff;
            text-decoration: none;
        }
        .login-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${formTitle}</h1>
        
        <div id="successMessage" class="message success">
            <strong>${successTitle}</strong><br>
            ${successMessage}
        </div>
        
        <div id="errorMessage" class="message error"></div>
        
        <form id="resetForm">
            <input type="hidden" id="resetToken" name="token" value="${jsSafeToken}">
            
            <div class="form-group">
                <label for="password">${newPasswordLabel}</label>
                <input type="password" id="password" name="password" required minlength="6">
                <div id="passwordError" class="error">${passwordTooShortMsg}</div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">${confirmPasswordLabel}</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
                <div id="confirmError" class="error">${passwordMismatchMsg}</div>
            </div>
            
            <button type="submit" id="submitBtn">${submitButton}</button>
        </form>
        
        <div id="loginLink" class="login-link hidden">
            <p style="color: #28a745; font-weight: 500;">✓ ${goToLoginMsg}</p>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Puedes cerrar esta ventana</p>
        </div>
    </div>

    <script>
        const form = document.getElementById('resetForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const passwordError = document.getElementById('passwordError');
        const confirmError = document.getElementById('confirmError');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');
        const submitBtn = document.getElementById('submitBtn');
        const loginLink = document.getElementById('loginLink');
        const tokenInput = document.getElementById('resetToken');
        const token = tokenInput ? tokenInput.value : '';
        
        // Validación del token en cliente
        if (!token || token.length !== 64) {
            console.error('Token inválido o no proporcionado. Longitud:', token ? token.length : 0);
            errorMessage.textContent = 'Token inválido. Por favor, solicita un nuevo enlace.';
            errorMessage.style.display = 'block';
            form.style.display = 'none';
        }

        function showError(element, show) {
            element.style.display = show ? 'block' : 'none';
        }

        function validateForm() {
            let isValid = true;
            
            // Validar longitud mínima
            if (password.value.length < 6) {
                showError(passwordError, true);
                isValid = false;
            } else {
                showError(passwordError, false);
            }
            
            // Validar que coincidan
            if (password.value !== confirmPassword.value) {
                showError(confirmError, true);
                isValid = false;
            } else {
                showError(confirmError, false);
            }
            
            return isValid;
        }

        password.addEventListener('input', () => showError(passwordError, false));
        confirmPassword.addEventListener('input', () => showError(confirmError, false));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';
            
            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        password: password.value
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    form.classList.add('hidden');
                    successMessage.style.display = 'block';
                    loginLink.classList.remove('hidden');
                } else {
                    errorMessage.textContent = data.message || '${errorGenericMsg}';
                    errorMessage.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '${submitButton}';
                }
            } catch (error) {
                errorMessage.textContent = '${errorGenericMsg}';
                errorMessage.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = '${submitButton}';
            }
        });
    </script>
</body>
</html>`;
};

const generateResetPasswordErrorHtml = (title, message, closeMessage) => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
            color: #dc3545;
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; margin-bottom: 30px; }
        .close-hint {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✗</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <p class="close-hint">${closeMessage}</p>
    </div>
</body>
</html>`;
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(req.t('auth.error.invalid_refresh_token'));
    }

    // Verificar el refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json(req.t('auth.error.invalid_refresh_token'));
    }

    // Verificar que el token coincide con el guardado en DB
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json(req.t('auth.error.invalid_refresh_token'));
    }

    // Verificar que no ha expirado
    if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
      return res.status(401).json(req.t('auth.error.refresh_token_expired'));
    }

    // Verificar tokenVersion (logout global)
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json(req.t('auth.error.session_invalidated'));
    }

    // Generar NUEVOS tokens (rotación)
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion
    });

    // Actualizar en DB
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    });
  } catch (error) {
    console.error('Error en refresh token:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(req.t('auth.error.refresh_token_expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(req.t('auth.error.invalid_refresh_token'));
    }
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (user) {
      // Invalidar refresh token
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      await user.save();
    }

    res.json(req.t('auth.ok.logout_success'));
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json(req.t('auth.error.account_not_found'));
    }

    // Incrementar tokenVersion invalida TODOS los refresh tokens
    user.tokenVersion += 1;
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    await user.save();

    res.json(req.t('auth.ok.logout_all_success'));
  } catch (error) {
    console.error('Error en logout all devices:', error);
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
  resetPassword,
  showResetPasswordPage,
  refreshToken,
  logout,
  logoutAllDevices
};
