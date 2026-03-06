const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');
const { addressValidation } = require('../middleware/addressValidation');
const { handleValidationErrors } = require('../middleware/validation');

router.get('/', authenticate, addressController.getAddresses);
router.get('/:id', authenticate, addressController.getAddressById);
router.post('/', authenticate, addressValidation, handleValidationErrors, addressController.createAddress);
router.put('/:id', authenticate, addressValidation, handleValidationErrors, addressController.updateAddress);
router.delete('/:id', authenticate, addressController.deleteAddress);
router.patch('/:id/default', authenticate, addressController.setDefaultAddress);

module.exports = router;
