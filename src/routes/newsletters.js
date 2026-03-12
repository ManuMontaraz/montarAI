/**
 * Newsletter Routes
 * Handles newsletter subscription and sending
 */

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticate, authenticateOptional, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validaciones
const sendNewsletterValidation = [
  body('subject')
    .notEmpty()
    .trim()
    .withMessage('Subject is required'),
  body('content')
    .notEmpty()
    .trim()
    .withMessage('Content is required')
];

const subscribeValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format')
];

const unsubscribeValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format')
];

// Routes
router.post('/subscribe', 
  authenticateOptional, 
  subscribeValidation, 
  handleValidationErrors, 
  newsletterController.subscribe
);

router.post('/unsubscribe', 
  authenticateOptional, 
  unsubscribeValidation, 
  handleValidationErrors, 
  newsletterController.unsubscribe
);

router.post('/send', 
  authenticate, 
  requireAdmin, 
  sendNewsletterValidation, 
  handleValidationErrors, 
  newsletterController.sendNewsletter
);

module.exports = router;
