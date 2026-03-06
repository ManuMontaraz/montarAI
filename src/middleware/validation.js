/**
 * MontarAI Backend - API REST
 * Copyright (C) 2024
 *
 * Middleware de validación con soporte i18n
 */

const { body, validationResult } = require('express-validator');
const { translate } = require('../utils/translator');

/**
 * Crea una validación de email traducible
 */
const emailValidation = (field = 'email', required = true) => {
  let validation = body(field);
  
  if (required) {
    validation = validation.notEmpty();
  } else {
    validation = validation.optional();
  }
  
  return validation
    .isEmail()
    .normalizeEmail()
    .withMessage((value, { req }) => req.t('validation.error.invalid_email').message);
};

/**
 * Crea una validación de contraseña traducible
 */
const passwordValidation = (field = 'password', minLength = 6) => {
  return body(field)
    .isLength({ min: minLength })
    .withMessage((value, { req }) => 
      req.t('validation.error.min_length', { min: minLength }).message
    );
};

/**
 * Crea una validación de campo requerido traducible
 */
const requiredValidation = (field, key = 'validation.error.required') => {
  return body(field)
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t(key).message);
};

/**
 * Crea una validación de campo opcional traducible
 */
const optionalNotEmptyValidation = (field, key = 'validation.error.required') => {
  return body(field)
    .optional()
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t(key).message);
};

// Validaciones específicas usando funciones dinámicas
const registerValidation = [
  emailValidation('email'),
  passwordValidation('password', 6),
  requiredValidation('firstName', 'validation.error.required'),
  requiredValidation('lastName', 'validation.error.required')
];

const loginValidation = [
  emailValidation('email'),
  requiredValidation('password', 'validation.error.required')
];

const forgotPasswordValidation = [
  emailValidation('email')
];

const resetPasswordValidation = [
  requiredValidation('token', 'validation.error.required'),
  passwordValidation('password', 6)
];

const changePasswordValidation = [
  requiredValidation('currentPassword', 'validation.error.required'),
  passwordValidation('newPassword', 6)
];

const updateProfileValidation = [
  optionalNotEmptyValidation('firstName'),
  optionalNotEmptyValidation('lastName'),
  body('phone').optional().trim()
];

const changeEmailValidation = [
  emailValidation('newEmail'),
  requiredValidation('password', 'validation.error.required')
];

/**
 * Middleware para manejar errores de validación con traducción
 * Formatea los errores usando el sistema i18n
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  // Traducir cada error usando el sistema i18n
  const translatedErrors = errors.array().map(error => {
    // Si el error ya fue traducido por el withMessage dinámico, usarlo
    if (error.msg && typeof error.msg === 'string') {
      return {
        field: error.path || error.param,
        message: error.msg,
        key: `validation.error.${error.path || error.param}`
      };
    }
    
    // Fallback: traducir usando el sistema i18n
    const translated = req.t('validation.error.invalid_format');
    return {
      field: error.path || error.param,
      message: translated.message,
      key: translated.key
    };
  });
  
  return res.status(400).json({
    key: 'validation.error.invalid_format',
    message: req.t('validation.error.invalid_format').message,
    lang: req.lang,
    errors: translatedErrors
  });
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
  changeEmailValidation,
  handleValidationErrors
};
