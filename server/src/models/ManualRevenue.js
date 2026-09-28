const mongoose = require('mongoose');
const { Schema } = mongoose;

const manualRevenueSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true,
    default: null
  },
  washPackage: {
    type: String,
    trim: true,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['upi', 'cash', 'card', 'credit'],
    default: 'upi'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    default: 'manual'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ManualRevenue', manualRevenueSchema);
