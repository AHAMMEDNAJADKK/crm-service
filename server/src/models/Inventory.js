const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'SKU code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: [true, 'Retail unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0
    },
    minStockLevel: {
      type: Number,
      required: [true, 'Minimum stock level is required'],
      default: 5
    },
    supplier: {
      name: { type: String, trim: true },
      mobile: { type: String, trim: true },
      email: { type: String, trim: true }
    },
    location: {
      type: String, // e.g. Shelf A-4
      trim: true
    },
    lastRestocked: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
