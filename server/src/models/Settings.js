const mongoose = require('mongoose');
const { Schema } = mongoose;

const settingsSchema = new Schema({
  stationName: {
    type: String,
    required: true,
    default: 'AquaClean Vehicle Service'
  },
  address: {
    type: String,
    default: 'Plot 42, Bypass Road, Ernakulam, Kerala - 682024'
  },
  mobile: {
    type: String,
    default: '9539691738'
  },
  email: {
    type: String,
    default: 'support@aquaclean.com'
  },
  gstNumber: {
    type: String,
    default: '32AAAAA0000A1Z2'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  logoPath: {
    type: String,
    default: ''
  },
  googleMapsLink: {
    type: String,
    default: 'https://maps.google.com/?q=Kochi,Kerala'
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
  workingHours: {
    opensAt: { type: String, default: '08:00 AM' },
    closesAt: { type: String, default: '08:00 PM' },
    daysOpen: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
  },
  smsTemplates: {
    appointmentConfirmed: {
      type: String,
      default: 'Hi {customerName}, your wash appointment for vehicle {vehicleReg} is confirmed for {date} at {time}. - AquaClean'
    },
    washReady: {
      type: String,
      default: 'Hi, your vehicle {vehicleReg} is ready! Token: {tokenNumber}. Total bill: Rs. {amount}. - AquaClean'
    },
    receiptSent: {
      type: String,
      default: 'Hi {customerName}, your payment of Rs. {amount} has been received for Invoice {invoiceNumber}. - AquaClean'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
