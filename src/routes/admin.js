const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/orders', authenticate, requireAdmin, adminController.getAllOrders);
router.get('/orders/:id', authenticate, requireAdmin, adminController.getOrderDetails);
router.put('/orders/:id', authenticate, requireAdmin, adminController.updateOrderStatus);
router.get('/customers', authenticate, requireAdmin, adminController.getAllCustomers);
router.get('/customers/:id', authenticate, requireAdmin, adminController.getUserDetails);
router.put('/customers/:id/status', authenticate, requireAdmin, adminController.updateUserStatus);

// Rutas de devoluciones
router.get('/refunds', authenticate, requireAdmin, adminController.getRefundRequests);
router.post('/refunds/:orderId/approve', authenticate, requireAdmin, adminController.approveRefund);
router.post('/refunds/:orderId/reject', authenticate, requireAdmin, adminController.rejectRefund);

module.exports = router;
