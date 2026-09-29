const express = require('express');
const {
  getTodayStats,
  getCalendarMonthStats,
  getWeeklyStats,
  getMonthlyStats,
  getDailyClosing,
  searchGlobal,
  getOutstandingReport,
  getRevenueReport,
  getExpenseReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all reports routes

router.get('/today', getTodayStats);
router.get('/calendar', getCalendarMonthStats);
router.get('/weekly', getWeeklyStats);
router.get('/monthly', getMonthlyStats);
router.get('/daily-closing', getDailyClosing);
router.get('/search', searchGlobal);
router.get('/outstanding', getOutstandingReport);
router.get('/revenue', getRevenueReport);
router.get('/expense', getExpenseReport);

module.exports = router;
