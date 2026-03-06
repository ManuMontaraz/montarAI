const { Address } = require('../models');

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.userId },
      order: [['isDefault', 'DESC'], ['created_at', 'DESC']]
    });
    res.json({ addresses });
  } catch (error) {
    console.error('Error obteniendo direcciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const createAddress = async (req, res) => {
  try {

    const { street, number, floor, door, city, postalCode, province, country, isDefault } = req.body;

    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.userId } }
      );
    }

    const address = await Address.create({
      userId: req.user.userId,
      street,
      number,
      floor,
      door,
      city,
      postalCode,
      province,
      country: country || 'España',
      isDefault: isDefault || false
    });

    res.status(201).json({
      message: 'Dirección creada correctamente',
      address
    });
  } catch (error) {
    console.error('Error creando dirección:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateAddress = async (req, res) => {
  try {

    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }

    const { street, number, floor, door, city, postalCode, province, country, isDefault } = req.body;

    if (isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.userId } }
      );
    }

    await address.update({
      street: street || address.street,
      number: number !== undefined ? number : address.number,
      floor: floor !== undefined ? floor : address.floor,
      door: door !== undefined ? door : address.door,
      city: city || address.city,
      postalCode: postalCode || address.postalCode,
      province: province || address.province,
      country: country || address.country,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault
    });

    res.json({
      message: 'Dirección actualizada correctamente',
      address
    });
  } catch (error) {
    console.error('Error actualizando dirección:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }

    await address.destroy();
    res.json({ message: 'Dirección eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando dirección:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }

    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.userId } }
    );

    await address.update({ isDefault: true });

    res.json({
      message: 'Dirección por defecto actualizada',
      address
    });
  } catch (error) {
    console.error('Error estableciendo dirección por defecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
