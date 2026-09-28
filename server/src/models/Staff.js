const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: String, // e.g. "09:00 AM"
    default: null
  },
  checkOut: {
    type: String, // e.g. "06:00 PM"
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    default: 'present'
  }
});

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['mechanic', 'receptionist', 'supervisor'],
      required: [true, 'Staff role is required']
    },
    skills: {
      type: [String],
      default: []
    },
    salary: {
      type: Number,
      required: [true, 'Staff salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    attendance: [attendanceSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    commissionRate: {
      type: Number,
      default: 0, // Commission percentage per completed job card assigned
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Staff', staffSchema);
