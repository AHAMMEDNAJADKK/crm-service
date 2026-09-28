const express = require('express');
const {
  getRevenueReport,
  getExpenseReport,
  getPLReport,
  getJobCardReport,
  getWaterUsageReport,
  getCustomerReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all reports routes

router.get('/revenue', getRevenueReport);
router.get('/expense', getExpenseReport);
router.get('/pl', getPLReport);
router.get('/jobcard', getJobCardReport);
router.get('/water-usage', getWaterUsageReport);
router.get('/customer', getCustomerReport);

module.exports = router;
