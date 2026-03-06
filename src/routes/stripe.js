const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authenticate } = require('../middleware/auth');

router.get('/products', stripeController.listProducts);
router.get('/products/:id', stripeController.getProduct);
router.post('/checkout/payment-intent', authenticate, stripeController.createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

module.exports = router;
