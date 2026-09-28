const express = require('express');
const {
  getVehicleTypes,
  getActiveVehicleTypes,
  createVehicleType,
  updateVehicleType,
  toggleVehicleTypeStatus,
  deleteVehicleType
} = require('../controllers/vehicleTypeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public / Quick read for active vehicle types
router.get('/active', getActiveVehicleTypes);

// Protected Admin Routes
router.use(protect);
router.get('/', getVehicleTypes);
router.post('/', createVehicleType);
router.put('/:id', updateVehicleType);
router.patch('/:id/toggle', toggleVehicleTypeStatus);
router.delete('/:id', deleteVehicleType);

module.exports = router;
