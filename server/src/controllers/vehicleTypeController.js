const VehicleType = require('../models/VehicleType');
const WashPackagePrice = require('../models/WashPackagePrice');
const ServicePackage = require('../models/ServicePackage');

// Get all vehicle types
const getVehicleTypes = async (req, res, next) => {
  try {
    const vehicleTypes = await VehicleType.find().sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: vehicleTypes });
  } catch (error) {
    next(error);
  }
};

// Get active vehicle types
const getActiveVehicleTypes = async (req, res, next) => {
  try {
    const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: vehicleTypes });
  } catch (error) {
    next(error);
  }
};

// Create vehicle type
const createVehicleType = async (req, res, next) => {
  try {
    const { name, category, icon, displayOrder, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Vehicle type name is required' });
    }

    const code = req.body.code
      ? req.body.code.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const existing = await VehicleType.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A vehicle category with this code already exists' });
    }

    const vehicleType = await VehicleType.create({
      name,
      code,
      category: category || 'medium',
      icon: icon || 'Car',
      displayOrder: parseInt(displayOrder) || 0,
      description: description || ''
    });

    // Automatically create pricing matrix entries for all active service packages
    const servicePackages = await ServicePackage.find();
    const newPriceSlots = servicePackages.map(sp => ({
      vehicleType: vehicleType.code,
      washPackage: sp.code,
      price: sp.basePrice || 0,
      isNA: false
    }));

    if (newPriceSlots.length > 0) {
      for (const slot of newPriceSlots) {
        await WashPackagePrice.findOneAndUpdate(
          { vehicleType: slot.vehicleType, washPackage: slot.washPackage },
          slot,
          { upsert: true }
        );
      }
    }

    res.status(201).json({ success: true, data: vehicleType, message: 'Vehicle type created successfully' });
  } catch (error) {
    next(error);
  }
};

// Update vehicle type
const updateVehicleType = async (req, res, next) => {
  try {
    const { name, category, icon, displayOrder, description, isActive } = req.body;
    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) {
      return res.status(404).json({ success: false, error: 'Vehicle type not found' });
    }

    if (name !== undefined) vehicleType.name = name;
    if (category !== undefined) vehicleType.category = category;
    if (icon !== undefined) vehicleType.icon = icon;
    if (displayOrder !== undefined) vehicleType.displayOrder = parseInt(displayOrder) || 0;
    if (description !== undefined) vehicleType.description = description;
    if (isActive !== undefined) vehicleType.isActive = Boolean(isActive);

    await vehicleType.save();
    res.status(200).json({ success: true, data: vehicleType, message: 'Vehicle type updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle vehicle type status
const toggleVehicleTypeStatus = async (req, res, next) => {
  try {
    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) {
      return res.status(404).json({ success: false, error: 'Vehicle type not found' });
    }
    vehicleType.isActive = !vehicleType.isActive;
    await vehicleType.save();
    res.status(200).json({
      success: true,
      data: vehicleType,
      message: `Vehicle type ${vehicleType.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Delete vehicle type
const deleteVehicleType = async (req, res, next) => {
  try {
    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) {
      return res.status(404).json({ success: false, error: 'Vehicle type not found' });
    }

    await WashPackagePrice.deleteMany({ vehicleType: vehicleType.code });
    await vehicleType.deleteOne();

    res.status(200).json({ success: true, message: 'Vehicle type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicleTypes,
  getActiveVehicleTypes,
  createVehicleType,
  updateVehicleType,
  toggleVehicleTypeStatus,
  deleteVehicleType
};
