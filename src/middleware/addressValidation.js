/**
 * MontarAI Backend - API REST
 * Copyright (C) 2024
 *
 * Validaciones de direcciones con soporte i18n
 */

const { body } = require('express-validator');

const addressValidation = [
  body('street')
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t('validation.error.required').message),
  body('city')
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t('validation.error.required').message),
  body('postalCode')
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t('validation.error.required').message),
  body('province')
    .notEmpty()
    .trim()
    .withMessage((value, { req }) => req.t('validation.error.required').message)
];

module.exports = {
  addressValidation
};
