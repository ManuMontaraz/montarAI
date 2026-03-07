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
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json(req.t('addresses.error.not_found'));
    }

    res.json({ address });
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    res.status(500).json(req.t('general.error.server_error'));
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
      ...req.t('addresses.ok.created'),
      address
    });
  } catch (error) {
    console.error('Error creando dirección:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const updateAddress = async (req, res) => {
  try {

    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json(req.t('addresses.error.not_found'));
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
      ...req.t('addresses.ok.updated'),
      address
    });
  } catch (error) {
    console.error('Error actualizando dirección:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json(req.t('addresses.error.not_found'));
    }

    await address.destroy();
    res.json(req.t('addresses.ok.deleted'));
  } catch (error) {
    console.error('Error eliminando dirección:', error);
    res.status(500).json(req.t('general.error.server_error'));
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!address) {
      return res.status(404).json(req.t('addresses.error.not_found'));
    }

    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.userId } }
    );

    await address.update({ isDefault: true });

    res.json({
      ...req.t('addresses.ok.default_set'),
      address
    });
  } catch (error) {
    console.error('Error estableciendo dirección por defecto:', error);
    res.status(500).json(req.t('general.error.server_error'));
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