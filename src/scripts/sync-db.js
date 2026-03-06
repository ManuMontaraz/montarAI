require('dotenv').config();
const sequelize = require('../config/database');
const { User, Address, Order } = require('../models');

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada correctamente');
    console.log('📊 Tablas creadas: users, addresses, orders');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error);
    process.exit(1);
  }
};

syncDatabase();
