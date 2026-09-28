const Vehicle = require('../models/Vehicle');
const WashJob = require('../models/WashJob');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

// Helper to normalize registration plate
const normalizeReg = (str) => {
  if (!str) return '';
  return str.replace(/[\s\-_.]/g, '').toUpperCase();
};

// List vehicles with pagination, search by regNumber and populates customer details
const getVehicles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (search) {
      const normalizedSearch = normalizeReg(search);
      query = {
        $or: [
          { regNumber: { $regex: search, $options: 'i' } },
          { regNumberNormalized: { $regex: normalizedSearch, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { make: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('customerId', 'name nameMalayalam mobile place')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Find vehicle by registration plate (fuzzy/normalized match)
const findByReg = async (req, res, next) => {
  try {
    const rawReg = (req.params.reg || '').trim();
    if (!rawReg) {
      return res.status(400).json({ success: false, error: 'Registration number is required' });
    }

    const normalized = normalizeReg(rawReg);

    let vehicle = await Vehicle.findOne({
      $or: [
        { regNumber: rawReg.toUpperCase() },
        { regNumberNormalized: normalized }
      ]
    }).populate('customerId', 'name nameMalayalam mobile place');

    if (!vehicle) {
      return res.status(200).json({ success: true, data: null, message: 'Vehicle not found' });
    }

    // Get last service for this vehicle
    const lastJob = await WashJob.findOne({ vehicleReg: vehicle.regNumber }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        customer: vehicle.customerId,
        lastJob
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single vehicle by ID
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('customerId', 'name nameMalayalam mobile email address place');
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// Create a vehicle
const createVehicle = async (req, res, next) => {
  try {
    const {
      customerId,
      regNumber,
      vehicleType,
      brand,
      make,
      model,
      variant,
      year,
      fuelType,
      colour,
      notes
    } = req.body;

    if (!regNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle registration number and vehicle type are required'
      });
    }

    const cleanReg = regNumber.trim().toUpperCase();
    const normalizedReg = normalizeReg(cleanReg);

    // Check if vehicle already exists by normalized registration
    const existing = await Vehicle.findOne({
      $or: [
        { regNumber: cleanReg },
        { regNumberNormalized: normalizedReg }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A vehicle with this registration number already exists',
        data: existing
      });
    }

    const vehicle = await Vehicle.create({
      customerId: customerId || null,
      regNumber: cleanReg,
      regNumberNormalized: normalizedReg,
      vehicleType: vehicleType.toLowerCase().trim(),
      brand: (brand || make || '').trim(),
      make: (make || brand || '').trim(),
      model: (model || '').trim(),
      variant: (variant || '').trim(),
      year: year ? parseInt(year) : new Date().getFullYear(),
      fuelType: fuelType || 'other',
      colour: (colour || '').trim(),
      notes: (notes || '').trim()
    });

    res.status(201).json({ success: true, data: vehicle, message: 'Vehicle created successfully' });
  } catch (error) {
    next(error);
  }
};

// Update vehicle details
const updateVehicle = async (req, res, next) => {
  try {
    const {
      customerId,
      regNumber,
      vehicleType,
      brand,
      make,
      model,
      variant,
      year,
      fuelType,
      colour,
      notes
    } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    if (regNumber && regNumber.trim().toUpperCase() !== vehicle.regNumber) {
      const cleanReg = regNumber.trim().toUpperCase();
      const normalizedReg = normalizeReg(cleanReg);
      const existing = await Vehicle.findOne({
        _id: { $ne: vehicle._id },
        $or: [{ regNumber: cleanReg }, { regNumberNormalized: normalizedReg }]
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Another vehicle already has this registration number'
        });
      }
      vehicle.regNumber = cleanReg;
      vehicle.regNumberNormalized = normalizedReg;
    }

    if (customerId !== undefined) vehicle.customerId = customerId || null;
    if (vehicleType !== undefined) vehicle.vehicleType = vehicleType.toLowerCase().trim();
    if (brand !== undefined) vehicle.brand = brand.trim();
    if (make !== undefined) vehicle.make = make.trim();
    if (model !== undefined) vehicle.model = model.trim();
    if (variant !== undefined) vehicle.variant = variant.trim();
    if (year !== undefined) vehicle.year = parseInt(year) || vehicle.year;
    if (fuelType !== undefined) vehicle.fuelType = fuelType;
    if (colour !== undefined) vehicle.colour = colour.trim();
    if (notes !== undefined) vehicle.notes = notes.trim();

    await vehicle.save();
    res.status(200).json({ success: true, data: vehicle, message: 'Vehicle updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete vehicle
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Vehicle Profile with full statistics and service history
const getVehicleProfile = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('customerId', 'name nameMalayalam mobile address place');
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    // Find all service jobs for this vehicle
    const normalizedReg = vehicle.regNumberNormalized || normalizeReg(vehicle.regNumber);
    const jobs = await WashJob.find({
      $or: [
        { vehicleId: vehicle._id },
        { vehicleReg: vehicle.regNumber }
      ]
    }).sort({ createdAt: -1 });

    let totalVisits = 0;
    let totalServiceValue = 0;
    let totalPaid = 0;
    let outstanding = 0;

    jobs.forEach(job => {
      if (job.status !== 'cancelled') {
        totalVisits += 1;
        const val = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
        const paid = job.amountPaid || 0;
        totalServiceValue += val;
        totalPaid += paid;
        outstanding += Math.max(0, val - paid);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        stats: {
          totalVisits,
          totalServiceValue,
          totalPaid,
          outstanding
        },
        serviceHistory: jobs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  findByReg,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleProfile
};
