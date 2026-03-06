const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'stripe_payment_intent_id',
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'refund_requested'),
    defaultValue: 'pending',
    allowNull: false
  },
  refundStatus: {
    type: DataTypes.ENUM('none', 'requested', 'approved', 'rejected'),
    defaultValue: 'none',
    allowNull: false,
    field: 'refund_status'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'refund_amount'
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'refunded_at'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refund_reason'
  },
  refundRejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refund_rejection_reason'
  },
  stripeRefundId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'stripe_refund_id'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  shippingAddressId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'shipping_address_id',
    references: {
      model: 'addresses',
      key: 'id'
    }
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'tracking_number'
  },
  shippedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'shipped_at'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;
