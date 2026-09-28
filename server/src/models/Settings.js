const mongoose = require('mongoose');
const { Schema } = mongoose;

const settingsSchema = new Schema({
  stationName: {
    type: String,
    required: true,
    default: 'AHAMMED SONS WATER SERVICE'
  },
  tagline: {
    type: String,
    default: 'Vehicle Washing, Cleaning & Underbody/Undercoating Services'
  },
  address: {
    type: String,
    default: 'Kozhikode, Kerala'
  },
  mobile: {
    type: String,
    default: '9539691738'
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: 'contact@ahammedsons.com'
  },
  gstNumber: {
    type: String,
    default: ''
  },
  receiptFooter: {
    type: String,
    default: 'Thank you for choosing AHAMMED SONS WATER SERVICE! Visit us again.'
  },
  logoUrl: {
    type: String,
    default: '/uploads/logo/station-logo.jpg'
  },
  logoPath: {
    type: String,
    default: 'uploads/logo/station-logo.jpg'
  },
  googleMapsLink: {
    type: String,
    default: 'https://maps.google.com/?q=Kozhikode,Kerala'
  },
  activeBaysCount: {
    type: Number,
    default: 3
  },
  gstRate: {
    type: Number,
    default: 0
  },
  waterRatePerLitre: {
    type: Number,
    default: 0.15
  },
  dailyCapacityPerSlot: {
    type: Number,
    default: 5
  },
  expenseCategories: {
    type: [String],
    default: [
      'Cleaning Materials',
      'Foam Liquid',
      'Shampoo',
      'Undercoating Materials',
      'Water Expenses',
      'Electricity',
      'Salary / Wages',
      'Vehicle Maintenance',
      'Equipment Maintenance',
      'Rent',
      'Transport',
      'Miscellaneous',
      'Other'
    ]
  },
  paymentMethods: {
    type: [String],
    default: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other']
  },
  workingHours: {
    opensAt: { type: String, default: '08:00 AM' },
    closesAt: { type: String, default: '08:00 PM' },
    daysOpen: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
  },
  smsTemplates: {
    appointmentConfirmed: {
      type: String,
      default: 'Hi {customerName}, your service appointment for vehicle {vehicleReg} is confirmed at AHAMMED SONS WATER SERVICE.'
    },
    washReady: {
      type: String,
      default: 'Hi, your vehicle {vehicleReg} is ready! Token: {tokenNumber}. Total bill: Rs. {amount}. - AHAMMED SONS WATER SERVICE'
    },
    receiptSent: {
      type: String,
      default: 'Hi {customerName}, your payment of Rs. {amount} has been received. Thank you - AHAMMED SONS WATER SERVICE.'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
