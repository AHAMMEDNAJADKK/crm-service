const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'credit'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  }
});

const invoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  washJobId: {
    type: Schema.Types.ObjectId,
    ref: 'WashJob',
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  vehicleReg: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    trim: true
  },
  washPackage: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'pending'],
    default: 'pending'
  },
  payments: [paymentSchema],
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to generate sequential INV-YYYYMMDD-XXX invoice number
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const invDate = this.createdAt || new Date();
    const yyyy = invDate.getFullYear();
    const mm = String(invDate.getMonth() + 1).padStart(2, '0');
    const dd = String(invDate.getDate()).padStart(2, '0');
    const datePrefix = `INV-${yyyy}${mm}${dd}`;

    try {
      const startOfDay = new Date(invDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(invDate);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await mongoose.model('Invoice').countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const sequence = String(count + 1).padStart(3, '0');
      this.invoiceNumber = `${datePrefix}-${sequence}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
