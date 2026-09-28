const express = require('express');
const {
  getSettings,
  updateSettings,
  getPricingMatrix,
  updatePricingMatrix,
  resetPricingMatrix,
  uploadStationLogo,
  deleteStationLogo,
  changeOwnerPIN
} = require('../controllers/settingsController');
const { logWaterUsage, getWaterLogs } = require('../controllers/waterLogController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // Secure all settings routes

router.get('/', getSettings);
router.put('/', updateSettings);

// Pricing Matrix Sub-routes
router.get('/pricing', getPricingMatrix);
router.put('/pricing', updatePricingMatrix);
router.put('/pricing/reset', resetPricingMatrix);

// Logo Sub-routes
router.post('/logo', upload.single('logo'), uploadStationLogo);
router.delete('/logo', deleteStationLogo);

router.post('/pin', changeOwnerPIN);

// Water log entries
router.post('/water-logs', logWaterUsage);
router.get('/water-logs', getWaterLogs);

module.exports = router;
