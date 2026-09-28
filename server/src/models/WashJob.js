const mongoose = require('mongoose');
const { Schema } = mongoose;
const { JOB_STATUS_LIST } = require('../constants/jobStatuses');

const washJobSchema = new Schema({
  tokenNumber: {
    type: String,
    unique: true
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
  washPackage: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
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
    enum: JOB_STATUS_LIST,
    default: 'queued'
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
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'pending'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  photos: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Pre-save hook to generate sequential TKN-YYYYMMDD-XXX token number
washJobSchema.pre('save', async function (next) {
  if (this.isNew && !this.tokenNumber) {
    const jobDate = this.createdAt || new Date();
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
        createdAt: { $gte: startOfDay, $lte: endOfDay }
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

module.exports = mongoose.model('WashJob', washJobSchema);
