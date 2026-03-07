const cron = require('node-cron');
const { User } = require('../models');
const { Op } = require('sequelize');

const CLEANUP_ENABLED = process.env.CLEANUP_UNVERIFIED_ENABLED === 'true';
const CLEANUP_HOURS = parseInt(process.env.CLEANUP_UNVERIFIED_HOURS) || 48;

const cleanupUnverifiedUsers = async () => {
  if (!CLEANUP_ENABLED) {
    console.log('⏭️  Limpieza de usuarios no verificados: Desactivada');
    return;
  }

  try {
    const cutoffDate = new Date(Date.now() - CLEANUP_HOURS * 60 * 60 * 1000);
    
    console.log(`🧹 Iniciando limpieza de usuarios no verificados (más antiguos que ${CLEANUP_HOURS} horas)`);
    console.log(`📅 Fecha límite: ${cutoffDate.toISOString()}`);

    const usersToDelete = await User.findAll({
      where: {
        isVerified: false,
        created_at: {
          [Op.lt]: cutoffDate
        }
      },
      attributes: ['id', 'email', 'created_at']
    });

    if (usersToDelete.length === 0) {
      console.log('✅ No hay usuarios no verificados para eliminar');
      return;
    }

    console.log(`🗑️  Encontrados ${usersToDelete.length} usuarios para eliminar:`);
    usersToDelete.forEach(user => {
      console.log(`   - ${user.email} (creado: ${user.created_at})`);
    });

    const deletedCount = await User.destroy({
      where: {
        isVerified: false,
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    console.log(`✅ Eliminados ${deletedCount} usuarios no verificados`);
  } catch (error) {
    console.error('❌ Error en limpieza de usuarios no verificados:', error);
  }
};

const startCleanupJob = () => {
  if (!CLEANUP_ENABLED) {
    console.log('⏭️  Cron job de limpieza: No iniciado (desactivado)');
    return;
  }

  console.log(`🕐 Iniciando cron job de limpieza (cada hora, elimina usuarios > ${CLEANUP_HOURS}h)`);
  
  cron.schedule('0 * * * *', cleanupUnverifiedUsers);
  
  cleanupUnverifiedUsers();
};

module.exports = {
  startCleanupJob,
  cleanupUnverifiedUsers
};