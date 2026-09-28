const express = require('express');
const {
  getPayments,
  recordJobPayment,
  getJobPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getPayments);
router.post('/jobs/:jobId', recordJobPayment);
router.get('/jobs/:jobId', getJobPayments);

module.exports = router;
