const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  forgotPasswordValidation, 
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
  changeEmailValidation,
  handleValidationErrors
} = require('../middleware/validation');

router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword);

// Nuevas rutas de gestión de perfil
router.post('/change-password', authenticate, changePasswordValidation, handleValidationErrors, authController.changePassword);
router.put('/profile', authenticate, updateProfileValidation, handleValidationErrors, authController.updateProfile);
router.post('/change-email', authenticate, changeEmailValidation, handleValidationErrors, authController.requestEmailChange);
router.get('/verify-new-email', authController.verifyEmailChange);
router.post('/deactivate', authenticate, authController.deactivateAccount);

module.exports = router;
