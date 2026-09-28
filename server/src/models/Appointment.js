const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  vehicleReg: {
    type: String,
    required: [true, 'Vehicle registration number is required'],
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    trim: true
  },
  washPackage: {
    type: String,
    required: [true, 'Wash package is required'],
    trim: true
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  preferredTime: {
    type: String, // e.g., '10:00 AM'
    required: [true, 'Preferred time slot is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['online', 'walk-in', 'phone'],
    default: 'online'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
