const mongoose = require('mongoose');
const { Schema } = mongoose;

const washJobSchema = new Schema({
  tokenNumber: {
    type: String,
    unique: true
  },
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  vehicleReg: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  vehicleType: {
    type: String,
    required: true,
    trim: true
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
  customerMobile: {
    type: String,
    trim: true,
    default: ''
  },
  washPackage: {
    type: String,
    required: false,
    trim: true,
    default: 'general-wash'
  },
  serviceName: {
    type: String,
    trim: true,
    default: ''
  },
  servicePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  price: {
    type: Number, // Backward compatibility alias for servicePrice
    default: 0
  },
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  additionalCharge: {
    type: Number,
    min: 0,
    default: 0
  },
  finalAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  amountPaid: {
    type: Number,
    min: 0,
    default: 0
  },
  balance: {
    type: Number,
    min: 0,
    default: 0
  },
  bayNumber: {
    type: Number,
    default: null
  },
  assignedStaff: {
    type: String,
    default: 'Unassigned'
  },
  status: {
    type: String,
    enum: [
      'waiting', 'in-service', 'completed', 'cancelled',
      'queued', 'in-bay', 'washing', 'drying', 'ready', 'delivered'
    ],
    default: 'waiting'
  },
  serviceStatus: {
    type: String,
    enum: ['waiting', 'in-service', 'completed', 'cancelled'],
    default: 'waiting'
  },
  waterUsedLitres: {
    type: Number,
    default: 0,
    min: 0
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank-transfer', 'card', 'other', 'pending'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  photos: {
    type: [String],
    default: []
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook: Safe server-side financial calculations & token generation
washJobSchema.pre('save', async function (next) {
  // Sync price and servicePrice
  if (this.servicePrice === undefined || this.servicePrice === null) {
    this.servicePrice = this.price || 0;
  }
  if (this.price === undefined || this.price === null) {
    this.price = this.servicePrice || 0;
  }

  const basePrice = Math.max(0, Number(this.servicePrice || 0));
  const addCharge = Math.max(0, Number(this.additionalCharge || 0));
  const disc = Math.max(0, Number(this.discount || 0));
  
  // Final amount cannot be negative
  this.finalAmount = Math.max(0, Math.round((basePrice + addCharge - disc) * 100) / 100);
  
  const paid = Math.max(0, Number(this.amountPaid || 0));
  this.amountPaid = paid;
  this.balance = Math.max(0, Math.round((this.finalAmount - paid) * 100) / 100);

  // Sync paymentStatus
  if (this.amountPaid >= this.finalAmount && this.finalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }

  // Normalize service status
  if (['delivered', 'completed'].includes(this.status)) {
    this.serviceStatus = 'completed';
    if (!this.completedDate) this.completedDate = new Date();
  } else if (['in-bay', 'washing', 'drying', 'in-service'].includes(this.status)) {
    this.serviceStatus = 'in-service';
  } else if (this.status === 'cancelled') {
    this.serviceStatus = 'cancelled';
  } else {
    this.serviceStatus = 'waiting';
  }

  // Generate sequential token if new
  if (this.isNew && !this.tokenNumber) {
    const jobDate = this.serviceDate || this.createdAt || new Date();
    const yyyy = jobDate.getFullYear();
    const mm = String(jobDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jobDate.getDate()).padStart(2, '0');
    const datePrefix = `TKN-${yyyy}${mm}${dd}`;

    try {
      const startOfDay = new Date(jobDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(jobDate);
      endOfDay.setHours(23, 59, 59, 999);

      const countToday = await mongoose.model('WashJob').countDocuments({
        serviceDate: { $gte: startOfDay, $lte: endOfDay }
      });

      const sequence = String(countToday + 1).padStart(3, '0');
      this.tokenNumber = `${datePrefix}-${sequence}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

washJobSchema.index({ serviceDate: -1 });
washJobSchema.index({ serviceDate: -1, status: 1 });
washJobSchema.index({ serviceDate: -1, paymentStatus: 1 });
washJobSchema.index({ vehicleReg: 1, serviceDate: -1 });
washJobSchema.index({ createdAt: -1 });
washJobSchema.index({ customerId: 1 });

module.exports = mongoose.model('WashJob', washJobSchema);
