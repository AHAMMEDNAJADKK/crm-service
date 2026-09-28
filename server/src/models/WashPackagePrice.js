const mongoose = require('mongoose');
const { Schema } = mongoose;

const washPackagePriceSchema = new Schema({
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
  price: {
    type: Number,
    default: null
  },
  isNA: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a compound unique index so each combination is distinct
washPackagePriceSchema.index({ vehicleType: 1, washPackage: 1 }, { unique: true });

module.exports = mongoose.model('WashPackagePrice', washPackagePriceSchema);
