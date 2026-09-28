const express = require('express');
const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  markAttendance,
  getMechanicWorkload,
  generateSalarySlip,
  deleteStaff
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all staff routes

router.get('/', getStaff);
router.post('/', createStaff);
router.get('/workload', getMechanicWorkload);
router.get('/:id', getStaffById);
router.put('/:id', updateStaff);
router.post('/:id/attendance', markAttendance);
router.get('/:id/slip', generateSalarySlip);
router.delete('/:id', deleteStaff);

module.exports = router;
