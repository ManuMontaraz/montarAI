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
        createdAt: { [Op.gte]: today }
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
    res.status(500).json({ message: 'Error en el servidor' });
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
    res.status(500).json({ message: 'Error en el servidor' });
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
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error obteniendo detalle del pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
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
      message: 'Estado del pedido actualizado',
      order
    });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
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
    res.status(500).json({ message: 'Error en el servidor' });
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
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo detalles del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido. Use: active, inactive, banned' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'No se puede modificar el estado de un administrador' });
    }

    await user.update({ 
      status,
      statusReason: reason || null
    });

    // Enviar email al usuario sobre el cambio de estado
    const { sendEmail } = require('../services/email');
    
    let subject, message;
    if (status === 'banned') {
      subject = 'Tu cuenta ha sido suspendida';
      message = `Tu cuenta ha sido suspendida${reason ? ` por la siguiente razón: ${reason}` : '.'} Si crees que esto es un error, contacta con soporte.`;
    } else if (status === 'inactive') {
      subject = 'Tu cuenta ha sido desactivada';
      message = `Tu cuenta ha sido desactivada${reason ? ` por la siguiente razón: ${reason}` : '.'}`;
    } else {
      subject = 'Tu cuenta ha sido reactivada';
      message = 'Tu cuenta ha sido reactivada. Ya puedes iniciar sesión nuevamente.';
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
      message: `Estado del usuario actualizado a: ${status}`,
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error actualizando estado del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
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
    res.status(500).json({ message: 'Error en el servidor' });
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
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (order.refundStatus !== 'requested') {
      return res.status(400).json({ message: 'No hay una solicitud de devolución pendiente para este pedido' });
    }

    // Procesar reembolso en Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: 'requested_by_customer'
    });

    // Actualizar orden
    await order.update({
      refundStatus: 'approved',
      refundAmount: order.totalAmount,
      refundedAt: new Date(),
      stripeRefundId: refund.id,
      status: 'refunded'
    });

    // Enviar email al cliente
    const { sendEmail } = require('../services/email');
    await sendEmail({
      to: order.user.email,
      subject: 'Proceso de devolución iniciado',
      html: `
        <h1>Proceso de devolución iniciado</h1>
        <p>Hola ${order.user.firstName},</p>
        <p>Se ha iniciado el proceso de devolución para tu pedido #${order.id}.</p>
        <p>El reembolso se procesará en los próximos 5-10 días hábiles.</p>
        <p><strong>Importe reembolsado:</strong> ${order.totalAmount} €</p>
      `
    });

    res.json({
      message: 'Devolución aprobada y procesada correctamente',
      order: {
        id: order.id,
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount,
        refundedAt: order.refundedAt
      }
    });
  } catch (error) {
    console.error('Error aprobando devolución:', error);
    res.status(500).json({ message: 'Error procesando la devolución' });
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
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (order.refundStatus !== 'requested') {
      return res.status(400).json({ message: 'No hay una solicitud de devolución pendiente para este pedido' });
    }

    // Actualizar orden
    await order.update({
      refundStatus: 'rejected',
      refundRejectionReason: reason || 'No especificado',
      status: order.status === 'refund_requested' ? 'delivered' : order.status
    });

    // Enviar email al cliente
    const { sendEmail } = require('../services/email');
    await sendEmail({
      to: order.user.email,
      subject: 'Solicitud de devolución rechazada',
      html: `
        <h1>Solicitud de devolución rechazada</h1>
        <p>Hola ${order.user.firstName},</p>
        <p>Tu solicitud de devolución para el pedido #${order.id} ha sido rechazada.</p>
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        <p>Si tienes alguna duda, contacta con nuestro equipo de soporte.</p>
      `
    });

    res.json({
      message: 'Solicitud de devolución rechazada',
      order: {
        id: order.id,
        refundStatus: order.refundStatus,
        refundRejectionReason: order.refundRejectionReason
      }
    });
  } catch (error) {
    console.error('Error rechazando devolución:', error);
    res.status(500).json({ message: 'Error en el servidor' });
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
