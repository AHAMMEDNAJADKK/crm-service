const express = require('express');
const {
  getLedger,
  getLedgerDayDetails,
  exportLedgerCSV,
  addManualRevenue,
  addManualExpense
} = require('../controllers/ledgerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all ledger routes

router.get('/', getLedger);
router.get('/day/:date', getLedgerDayDetails);
router.get('/export', exportLedgerCSV);
router.post('/revenue', addManualRevenue);
router.post('/expense', addManualExpense);

module.exports = router;
