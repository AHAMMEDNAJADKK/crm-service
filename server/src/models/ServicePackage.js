const mongoose = require('mongoose');
const { Schema } = mongoose;

const servicePackageSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true
  },
  shortName: {
    type: String,
    trim: true,
    default: ''
  },
  code: {
    type: String,
    required: [true, 'Service code is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  basePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 30
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
