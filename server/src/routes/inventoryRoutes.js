const express = require('express');
const {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  adjustStockManual,
  getStockAdjustmentLogs,
  getLowStockItems,
  generateRestockPO,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all inventory routes

router.get('/', getInventory);
router.post('/', createInventoryItem);
router.get('/low-stock', getLowStockItems);
router.get('/po', generateRestockPO);
router.get('/:id', getInventoryById);
router.put('/:id', updateInventoryItem);
router.post('/:id/adjust', adjustStockManual);
router.get('/:id/logs', getStockAdjustmentLogs);
router.delete('/:id', deleteInventoryItem);

module.exports = router;
