const express = require('express');
const { getFuelLogs, createFuelLog, deleteFuelLog } = require('../controllers/fuelLogController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all fuel log routes

router.get('/', getFuelLogs);
router.post('/', createFuelLog);
router.delete('/:id', deleteFuelLog);

module.exports = router;
