const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password/PIN hash is required']
    },
    role: {
      type: String,
      enum: ['owner'],
      default: 'owner'
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Method to verify if PIN matches
userSchema.methods.comparePIN = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.passwordHash);
};

// Hook to hash PIN before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
