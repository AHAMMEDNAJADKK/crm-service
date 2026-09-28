const express = require('express');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDetails
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all vehicle routes

router.get('/', getVehicles);
router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.get('/:id/details', getVehicleDetails);

module.exports = router;
