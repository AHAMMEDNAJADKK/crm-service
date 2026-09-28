const mongoose = require('mongoose');
const { Schema } = mongoose;

const vehicleSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  regNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  regNumberNormalized: {
    type: String,
    trim: true,
    uppercase: true,
    index: true
  },
  vehicleType: {
    type: String,
    required: true,
    trim: true,
    default: 'car'
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  make: {
    type: String,
    trim: true,
    default: ''
  },
  model: {
    type: String,
    trim: true,
    default: ''
  },
  variant: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  fuelType: {
    type: String,
    default: 'other'
  },
  colour: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  washHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'WashJob'
  }]
}, {
  timestamps: true
});

// Normalize registration number (removes spaces, hyphens, dots)
vehicleSchema.pre('save', function (next) {
  if (this.regNumber) {
    this.regNumberNormalized = this.regNumber.replace(/[\s\-_.]/g, '').toUpperCase();
  }
  if (!this.brand && this.make) {
    this.brand = this.make;
  }
  if (!this.make && this.brand) {
    this.make = this.brand;
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
