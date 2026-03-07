const { Order, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    
    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: 'paid' }
    }) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = await Order.count({
      where: {
        created_at: { [Op.gte]: today }
      }
    });

    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    res.json({
      stats: {
        totalOrders,
        totalCustomers,
        totalRevenue,
        ordersToday
      },
      recentOrders,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: Address,
          as: 'shippingAddress'
        }
      ]
    });

    res.json({
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] }
        },
        {
          model: Address,
          as: 'shippingAddress'
        }
      ]
    });

    if (!order) {
      return res.status(404).json(req.t('admin.error.order_not_found'));
    }

    res.json({ order });
  } catch (error) {
    console.error('Error obteniendo detalle del pedido:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json(req.t('admin.error.order_not_found'));
    }

    const updates = { status };
    
    if (status === 'shipped') {
      updates.shippedAt = new Date();
      if (trackingNumber) updates.trackingNumber = trackingNumber;
    }
    
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }

    await order.update(updates);

    res.json({
      ...req.t('admin.ok.order_updated'),
      order
    });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'customer' };
    if (status) where.status = status;

    const { count, rows: customers } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] }
    });

    res.json({
      customers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] },
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json(req.t('admin.error.user_not_found'));
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo detalles del usuario:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json(req.t('admin.error.invalid_status'));
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json(req.t('admin.error.user_not_found'));
    }

    if (user.role === 'admin') {
      return res.status(403).json(req.t('admin.error.cannot_modify_admin'));
    }

    await user.update({ 
      status,
      statusReason: reason || null
    });

    const { sendEmail } = require('../services/email');
    
    let subject, message;
    if (status === 'banned') {
      subject = req.t('mail.account_status.banned_subject');
      message = req.t('mail.account_status.banned_body');
    } else if (status === 'inactive') {
      subject = req.t('mail.account_status.inactive_subject');
      message = req.t('mail.account_status.inactive_body');
    } else {
      subject = req.t('mail.account_status.active_subject');
      message = req.t('mail.account_status.active_body');
    }

    await sendEmail({
      to: user.email,
      subject,
      html: `
        <h1>${subject}</h1>
        <p>Hola ${user.firstName},</p>
        <p>${message}</p>
        ${status === 'banned' ? '<p>Para más información, contacta con nuestro equipo de soporte.</p>' : ''}
      `
    });

    res.json({
      ...req.t('admin.ok.user_updated'),
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error actualizando estado del usuario:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getRefundRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { refundStatus: 'requested' },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      refunds: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes de devolución:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const approveRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName']
        }
      ]
    });

    if (!order) {
      return res.status(404).json(req.t('admin.error.order_not_found'));
    }

    if (order.refundStatus !== 'requested') {
      return res.status(400).json(req.t('orders.error.refund_pending'));
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: 'requested_by_customer'
    });

    await order.update({
      refundStatus: 'approved',
      refundAmount: order.totalAmount,
      refundedAt: new Date(),
      stripeRefundId: refund.id,
      status: 'refunded'
    });

    const { sendEmail } = require('../services/email');
    await sendEmail({
      to: order.user.email,
      subject: req.t('mail.refund.subject'),
      html: `
        <h1>${req.t('mail.refund.subject')}</h1>
        <p>Hola ${order.user.firstName},</p>
        <p>${req.t('mail.refund.body', { orderId: order.id })}</p>
        <p>${req.t('mail.refund.timeline')}</p>
        <p><strong>${req.t('mail.refund.amount')}</strong> ${order.totalAmount} €</p>
      `
    });

    res.json({
      ...req.t('admin.ok.refund_approved'),
      order: {
        id: order.id,
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount,
        refundedAt: order.refundedAt
      }
    });
  } catch (error) {
    console.error('Error aprobando devolución:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const rejectRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName']
        }
      ]
    });

    if (!order) {
      return res.status(404).json(req.t('admin.error.order_not_found'));
    }

    if (order.refundStatus !== 'requested') {
      return res.status(400).json(req.t('orders.error.refund_pending'));
    }

    await order.update({
      refundStatus: 'rejected',
      refundRejectionReason: reason || req.t('general.no_reason'),
      status: order.status === 'refund_requested' ? 'delivered' : order.status
    });

    const { sendEmail } = require('../services/email');
    await sendEmail({
      to: order.user.email,
      subject: req.t('mail.refund_rejected.subject'),
      html: `
        <h1>${req.t('mail.refund_rejected.subject')}</h1>
        <p>Hola ${order.user.firstName},</p>
        <p>${req.t('mail.refund_rejected.body', { orderId: order.id })}</p>
        ${reason ? `<p><strong>${req.t('mail.refund_rejected.reason')}</strong> ${reason}</p>` : ''}
        <p>${req.t('mail.refund_rejected.contact')}</p>
      `
    });

    res.json({
      ...req.t('admin.ok.refund_rejected'),
      order: {
        id: order.id,
        refundStatus: order.refundStatus,
        refundRejectionReason: order.refundRejectionReason
      }
    });
  } catch (error) {
    console.error('Error rechazando devolución:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllCustomers,
  getUserDetails,
  updateUserStatus,
  getRefundRequests,
  approveRefund,
  rejectRefund
};