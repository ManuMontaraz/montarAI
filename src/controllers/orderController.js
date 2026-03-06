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
    res.status(500).json({ message: 'Error en el servidor' });
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
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
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
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificar que el pedido esté pagado
    if (order.status !== 'paid' && order.status !== 'delivered') {
      return res.status(400).json({ message: 'Solo se pueden solicitar devoluciones de pedidos pagados o entregados' });
    }

    // Verificar que no haya una solicitud pendiente
    if (order.refundStatus === 'requested') {
      return res.status(400).json({ message: 'Ya existe una solicitud de devolución pendiente para este pedido' });
    }

    // Verificar que no esté ya reembolsado
    if (order.refundStatus === 'approved') {
      return res.status(400).json({ message: 'Este pedido ya ha sido reembolsado' });
    }

    await order.update({
      refundStatus: 'requested',
      refundReason: reason || 'No especificado',
      status: 'refund_requested'
    });

    res.json({
      message: 'Solicitud de devolución enviada correctamente',
      order: {
        id: order.id,
        status: order.status,
        refundStatus: order.refundStatus,
        refundReason: order.refundReason
      }
    });
  } catch (error) {
    console.error('Error solicitando devolución:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  requestRefund
};
