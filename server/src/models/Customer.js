const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    nameMalayalam: {
      type: String,
      trim: true,
      default: ''
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true
    },
    alternateMobile: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    place: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    totalSpend: {
      type: Number,
      default: 0
    },
    totalWashes: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast search
customerSchema.index({ mobile: 1 });
customerSchema.index({ name: 'text', nameMalayalam: 'text', place: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
