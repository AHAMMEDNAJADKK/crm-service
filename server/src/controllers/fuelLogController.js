const FuelLog = require('../models/FuelLog');

// Get list of fuel logs
const getFuelLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'date';
    const order = req.query.order === 'asc' ? 1 : -1;

    const total = await FuelLog.countDocuments({});
    const logs = await FuelLog.find({})
      .populate('vehicleId', 'regNumber make model')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs,
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

// Create a fuel log
const createFuelLog = async (req, res) => {
  try {
    const { vehicleId, date, liters, costPerLiter, odometerReading, notes } = req.body;

    if (!vehicleId || !liters || !costPerLiter) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle ID, liters, and cost per liter are required',
        code: 400
      });
    }

    const totalCost = parseFloat((liters * costPerLiter).toFixed(2));

    const log = await FuelLog.create({
      vehicleId,
      date: date || new Date(),
      liters,
      costPerLiter,
      totalCost,
      odometerReading,
      notes
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete a fuel log
const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Fuel log not found', code: 404 });
    }
    await FuelLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Fuel log deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getFuelLogs,
  createFuelLog,
  deleteFuelLog
};
