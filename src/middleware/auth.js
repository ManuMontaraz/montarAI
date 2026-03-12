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

/**
 * Middleware de autenticación opcional
 * Si hay token válido, añade req.user
 * Si no hay token o es inválido, continúa sin error
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') {
      return next();
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    // Token inválido o expirado, continuar sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
  requireAdmin
};
