/**
 * MontarAI Backend - API REST
 * Copyright (C) 2026
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const User = require('./User');
const Address = require('./Address');
const Order = require('./Order');

// Relaciones
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Address.hasMany(Order, { foreignKey: 'shippingAddressId', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'shippingAddressId', as: 'shippingAddress' });

module.exports = {
  User,
  Address,
  Order
};
