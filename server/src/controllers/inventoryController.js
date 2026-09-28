const Inventory = require('../models/Inventory');
const StockAdjustmentLog = require('../models/StockAdjustmentLog');
const Settings = require('../models/Settings');
const { generatePurchaseOrderPDF } = require('../services/pdfService');

// Get inventory items
const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Inventory.countDocuments(query);
    const items = await Inventory.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single item
const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found', code: 404 });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create item
const createInventoryItem = async (req, res) => {
  try {
    const { name, sku, category, brand, unitPrice, costPrice, quantity, minStockLevel, supplier, location } = req.body;

    if (!name || !sku || !category || !unitPrice || !costPrice || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, SKU, category, prices, and quantity are required',
        code: 400
      });
    }

    const existing = await Inventory.findOne({ sku: sku.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An item with this SKU code already exists',
        code: 400
      });
    }

    const item = await Inventory.create({
      name,
      sku: sku.toUpperCase().trim(),
      category,
      brand,
      unitPrice,
      costPrice,
      quantity,
      minStockLevel: minStockLevel || 5,
      supplier,
      location,
      lastRestocked: new Date()
    });

    // Log initial stock creation
    await StockAdjustmentLog.create({
      inventoryId: item._id,
      previousQty: 0,
      newQty: quantity,
      reason: 'Initial stock creation'
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update item (and log adjustments if qty changes)
const updateInventoryItem = async (req, res) => {
  try {
    const { name, sku, category, brand, unitPrice, costPrice, quantity, minStockLevel, supplier, location } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found', code: 404 });
    }

    if (sku && sku.toUpperCase().trim() !== item.sku) {
      const existing = await Inventory.findOne({ sku: sku.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'An item with this SKU code already exists',
          code: 400
        });
      }
      item.sku = sku.toUpperCase().trim();
    }

    if (name) item.name = name;
    if (category) item.category = category;
    if (brand !== undefined) item.brand = brand;
    if (unitPrice !== undefined) item.unitPrice = unitPrice;
    if (costPrice !== undefined) item.costPrice = costPrice;
    if (minStockLevel !== undefined) item.minStockLevel = minStockLevel;
    if (supplier) item.supplier = supplier;
    if (location !== undefined) item.location = location;

    // Handle quantity modification with audit log
    if (quantity !== undefined && quantity !== item.quantity) {
      const previousQty = item.quantity;
      item.quantity = quantity;
      item.lastRestocked = new Date();
      await item.save();

      await StockAdjustmentLog.create({
        inventoryId: item._id,
        previousQty,
        newQty: quantity,
        reason: 'Manual edit update'
      });
    } else {
      await item.save();
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Restock / Manual Adjustments
const adjustStockManual = async (req, res) => {
  try {
    const { adjustmentQty, reason } = req.body; // e.g. adjustmentQty: +10 or -2

    if (adjustmentQty === undefined || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Adjustment quantity and reason are required',
        code: 400
      });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found', code: 404 });
    }

    const previousQty = item.quantity;
    const newQty = previousQty + parseInt(adjustmentQty);

    if (newQty < 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot adjust quantity below zero. Current quantity is ${previousQty}`,
        code: 400
      });
    }

    item.quantity = newQty;
    if (parseInt(adjustmentQty) > 0) {
      item.lastRestocked = new Date();
    }
    await item.save();

    await StockAdjustmentLog.create({
      inventoryId: item._id,
      previousQty,
      newQty,
      reason
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get adjustment history logs
const getStockAdjustmentLogs = async (req, res) => {
  try {
    const logs = await StockAdjustmentLog.find({ inventoryId: req.params.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Generate Restock PO PDF
const generateRestockPO = async (req, res) => {
  try {
    // Fetch all items below threshold
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });

    if (lowStockItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No low stock items found to generate Purchase Order',
        code: 400
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const pdfBuffer = await generatePurchaseOrderPDF(lowStockItems, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=restock_purchase_order.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete item
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found', code: 404 });
    }

    // In production, we might want to prevent deletion if referenced in job cards
    await Inventory.findByIdAndDelete(req.params.id);
    // Delete logs associated
    await StockAdjustmentLog.deleteMany({ inventoryId: req.params.id });

    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  adjustStockManual,
  getStockAdjustmentLogs,
  getLowStockItems,
  generateRestockPO,
  deleteInventoryItem
};
