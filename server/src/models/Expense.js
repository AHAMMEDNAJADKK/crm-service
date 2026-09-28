const mongoose = require('mongoose');
const { Schema } = mongoose;

const expenseSchema = new Schema({
  expenseId: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    trim: true,
    default: 'cleaning-materials'
  },
  title: {
    type: String,
    trim: true,
    default: ''
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
    enum: ['cash', 'upi', 'bank-transfer', 'card', 'credit', 'other'],
    required: [true, 'Payment method is required'],
    default: 'cash'
  },
  vendor: {
    type: String,
    trim: true,
    default: ''
  },
  receipt: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  addedByName: {
    type: String,
    trim: true,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Pre-save hook to generate sequential EXP-YYYYMMDD-XXX
expenseSchema.pre('save', async function (next) {
  if (!this.title && this.description) {
    this.title = this.description;
  }
  if (!this.description && this.title) {
    this.description = this.title;
  }

  if (this.isNew && !this.expenseId) {
    const expDate = this.date || new Date();
    const yyyy = expDate.getFullYear();
    const mm = String(expDate.getMonth() + 1).padStart(2, '0');
    const dd = String(expDate.getDate()).padStart(2, '0');
    const datePrefix = `EXP-${yyyy}${mm}${dd}`;

    try {
      const startOfDay = new Date(expDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(expDate);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await mongoose.model('Expense').countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const sequence = String(count + 1).padStart(3, '0');
      this.expenseId = `${datePrefix}-${sequence}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
