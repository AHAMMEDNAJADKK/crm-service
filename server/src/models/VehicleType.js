const mongoose = require('mongoose');
const { Schema } = mongoose;

const vehicleTypeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Vehicle type name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Vehicle type code is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['light', 'medium', 'heavy', 'special', 'other'],
    default: 'medium'
  },
  icon: {
    type: String,
    default: 'Car'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VehicleType', vehicleTypeSchema);
