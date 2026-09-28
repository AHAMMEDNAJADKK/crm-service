const mongoose = require('mongoose');

const stockAdjustmentLogSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    previousQty: {
      type: Number,
      required: true
    },
    newQty: {
      type: Number,
      required: true
    },
    adjustedBy: {
      type: String, // 'owner' or other staff role
      required: true,
      default: 'owner'
    },
    reason: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StockAdjustmentLog', stockAdjustmentLogSchema);
