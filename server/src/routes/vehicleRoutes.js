const express = require('express');
const {
  getVehicles,
  findByReg,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleProfile
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all vehicle routes

router.get('/', getVehicles);
router.get('/by-reg/:reg', findByReg);
router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.get('/:id/profile', getVehicleProfile);

module.exports = router;
