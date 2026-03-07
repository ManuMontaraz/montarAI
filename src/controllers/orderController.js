const { Order, User, Address } = require('../models');

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.userId },
      include: [
        {
          model: Address,
          as: 'shippingAddress',
          attributes: ['street', 'city', 'postalCode', 'province']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      },
      include: [
        {
          model: Address,
          as: 'shippingAddress'
        }
      ]
    });

    if (!order) {
      return res.status(404).json(req.t('orders.error.not_found'));
    }

    res.json({ order });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      }
    });

    if (!order) {
      return res.status(404).json(req.t('orders.error.not_found'));
    }

    if (order.status !== 'paid' && order.status !== 'delivered') {
      return res.status(400).json(req.t('orders.error.cannot_refund'));
    }

    if (order.refundStatus === 'requested') {
      return res.status(400).json(req.t('orders.error.refund_pending'));
    }

    if (order.refundStatus === 'approved') {
      return res.status(400).json(req.t('orders.error.already_refunded'));
    }

    await order.update({
      refundStatus: 'requested',
      refundReason: reason || req.t('general.no_reason'),
      status: 'refund_requested'
    });

    res.json({
      ...req.t('orders.ok.refund_requested'),
      order: {
        id: order.id,
        status: order.status,
        refundStatus: order.refundStatus,
        refundReason: order.refundReason
      }
    });
  } catch (error) {
    console.error('Error solicitando devolución:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  requestRefund
};