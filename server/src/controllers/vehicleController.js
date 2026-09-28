const Vehicle = require('../models/Vehicle');
const WashJob = require('../models/WashJob');

// List vehicles with pagination, search by regNumber and populates customer details
const getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (search) {
      query = { regNumber: { $regex: search, $options: 'i' } };
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('customerId', 'name mobile')
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
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('customerId', 'name mobile email address');
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found', code: 404 });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create a vehicle
const createVehicle = async (req, res) => {
  try {
    const { customerId, regNumber, make, model, year, fuelType, colour, engineCC, notes } = req.body;

    if (!customerId || !regNumber || !make || !model || !year || !fuelType || !engineCC) {
      return res.status(400).json({
        success: false,
        error: 'Missing required vehicle fields',
        code: 400
      });
    }

    // Check if regNumber already exists
    const existing = await Vehicle.findOne({ regNumber: regNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A vehicle with this registration number already exists',
        code: 400
      });
    }

    const vehicle = await Vehicle.create({
      customerId,
      regNumber: regNumber.toUpperCase().trim(),
      make,
      model,
      year,
      fuelType,
      colour,
      engineCC,
      notes
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update vehicle details
const updateVehicle = async (req, res) => {
  try {
    const { regNumber, make, model, year, fuelType, colour, engineCC, notes } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found', code: 404 });
    }

    if (regNumber && regNumber.toUpperCase().trim() !== vehicle.regNumber) {
      const existing = await Vehicle.findOne({ regNumber: regNumber.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A vehicle with this registration number already exists',
          code: 400
        });
      }
      vehicle.regNumber = regNumber.toUpperCase().trim();
    }

    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (fuelType) vehicle.fuelType = fuelType;
    if (colour !== undefined) vehicle.colour = colour;
    if (engineCC) vehicle.engineCC = engineCC;
    if (notes !== undefined) vehicle.notes = notes;

    await vehicle.save();
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found', code: 404 });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Vehicle Page Info (Service history, current open job card if any)
const getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('customerId', 'name mobile email');
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found', code: 404 });
    }

    // Service history (sorted by newest job card)
    const history = await WashJob.find({ vehicleReg: vehicle.regNumber })
      .sort({ createdAt: -1 });

    // Current open job card
    const openJobCard = await WashJob.findOne({
      vehicleReg: vehicle.regNumber,
      status: { $nin: ['delivered', 'cancelled'] }
    });

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        history,
        openJobCard
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDetails
};
