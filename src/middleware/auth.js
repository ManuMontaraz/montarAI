const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(req.t('auth.error.token_not_provided'));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar estado de la cuenta
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json(req.t('auth.error.user_not_found'));
    }

    if (user.status === 'inactive') {
      return res.status(403).json(req.t('auth.error.account_inactive'));
    }

    if (user.status === 'banned') {
      return res.status(403).json(req.t('auth.error.account_banned'));
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(req.t('auth.error.token_expired'));
    }
    return res.status(401).json(req.t('auth.error.token_invalid'));
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json(req.t('auth.error.access_denied'));
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
