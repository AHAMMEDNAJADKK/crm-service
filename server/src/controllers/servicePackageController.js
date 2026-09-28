const ServicePackage = require('../models/ServicePackage');
const WashPackagePrice = require('../models/WashPackagePrice');
const VehicleType = require('../models/VehicleType');

// Get all service packages (admin)
const getServicePackages = async (req, res, next) => {
  try {
    const services = await ServicePackage.find().sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

// Get active services (for dropdowns / operations)
const getActiveServicePackages = async (req, res, next) => {
  try {
    const services = await ServicePackage.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

// Create new service package
const createServicePackage = async (req, res, next) => {
  try {
    const { name, shortName, description, basePrice, estimatedDuration, displayOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Service name is required' });
    }

    const code = req.body.code
      ? req.body.code.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const existing = await ServicePackage.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A service with this code already exists' });
    }

    const service = await ServicePackage.create({
      name,
      shortName: shortName || name,
      code,
      description: description || '',
      basePrice: parseFloat(basePrice) || 0,
      estimatedDuration: parseInt(estimatedDuration) || 30,
      displayOrder: parseInt(displayOrder) || 0
    });

    // Automatically create pricing matrix entries for all active vehicle types
    const vehicleTypes = await VehicleType.find();
    const newPriceSlots = vehicleTypes.map(vt => ({
      vehicleType: vt.code,
      washPackage: service.code,
      price: service.basePrice || 0,
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

    res.status(201).json({ success: true, data: service, message: 'Service package created successfully' });
  } catch (error) {
    next(error);
  }
};

// Update service package
const updateServicePackage = async (req, res, next) => {
  try {
    const { name, shortName, description, basePrice, estimatedDuration, displayOrder, isActive } = req.body;
    const service = await ServicePackage.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service package not found' });
    }

    if (name !== undefined) service.name = name;
    if (shortName !== undefined) service.shortName = shortName;
    if (description !== undefined) service.description = description;
    if (basePrice !== undefined) service.basePrice = parseFloat(basePrice) || 0;
    if (estimatedDuration !== undefined) service.estimatedDuration = parseInt(estimatedDuration) || 30;
    if (displayOrder !== undefined) service.displayOrder = parseInt(displayOrder) || 0;
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    await service.save();
    res.status(200).json({ success: true, data: service, message: 'Service package updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle active status
const toggleServicePackageStatus = async (req, res, next) => {
  try {
    const service = await ServicePackage.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service package not found' });
    }
    service.isActive = !service.isActive;
    await service.save();
    res.status(200).json({
      success: true,
      data: service,
      message: `Service package ${service.isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Delete service package
const deleteServicePackage = async (req, res, next) => {
  try {
    const service = await ServicePackage.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service package not found' });
    }

    // Also remove pricing slots
    await WashPackagePrice.deleteMany({ washPackage: service.code });
    await service.deleteOne();

    res.status(200).json({ success: true, message: 'Service package removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServicePackages,
  getActiveServicePackages,
  createServicePackage,
  updateServicePackage,
  toggleServicePackageStatus,
  deleteServicePackage
};
