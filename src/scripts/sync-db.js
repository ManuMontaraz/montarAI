require('dotenv').config();
const sequelize = require('../config/database');
const { User, Address, Order } = require('../models');

const syncDatabase = async () => {
  try {
    // Usar alter: true para actualizar tablas sin borrar datos
    await sequelize.sync({ alter: true });
    console.log('✅ Base de datos sincronizada correctamente');
    console.log('📊 Tablas actualizadas: users, addresses, orders');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error);
    process.exit(1);
  }
};

syncDatabase();
