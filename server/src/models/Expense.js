const mongoose = require('mongoose');
const { Schema } = mongoose;

const expenseSchema = new Schema({
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  category: {
    type: String,
    enum: [
      'water-supply',
      'electricity',
      'wages',
      'cleaning-chemicals',
      'equipment-repair',
      'fuel-generator',
      'marketing',
      'rent',
      'other'
    ],
    required: [true, 'Expense category is required']
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'credit'],
    required: [true, 'Payment method is required']
  },
  vendor: {
    type: String,
    trim: true
  },
  receipt: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
