const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Fuel log date is required'],
      default: Date.now
    },
    liters: {
      type: Number,
      required: [true, 'Liters filled is required'],
      min: [0.01, 'Liters must be positive']
    },
    costPerLiter: {
      type: Number,
      required: [true, 'Cost per liter is required'],
      min: [0, 'Cost per liter cannot be negative']
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative']
    },
    odometerReading: {
      type: Number,
      min: [0, 'Odometer reading cannot be negative']
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FuelLog', fuelLogSchema);
