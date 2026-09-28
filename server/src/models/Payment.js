const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  paymentId: {
    type: String,
    unique: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'WashJob',
    required: true
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerName: {
    type: String,
    trim: true,
    default: ''
  },
  vehicleReg: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  serviceName: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than zero']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank-transfer', 'card', 'other'],
    required: [true, 'Payment method is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  staffName: {
    type: String,
    trim: true,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Pre-save hook to generate sequential PAY-YYYYMMDD-XXX
paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    const payDate = this.date || new Date();
    const yyyy = payDate.getFullYear();
    const mm = String(payDate.getMonth() + 1).padStart(2, '0');
    const dd = String(payDate.getDate()).padStart(2, '0');
    const datePrefix = `PAY-${yyyy}${mm}${dd}`;

    try {
      const startOfDay = new Date(payDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(payDate);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await mongoose.model('Payment').countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const sequence = String(count + 1).padStart(3, '0');
      this.paymentId = `${datePrefix}-${sequence}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

paymentSchema.index({ jobId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
