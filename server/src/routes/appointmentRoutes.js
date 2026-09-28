const express = require('express');
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  convertToJobCard,
  deleteAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all admin appointment routes

router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.post('/:id/convert', convertToJobCard);
router.delete('/:id', deleteAppointment);

module.exports = router;
