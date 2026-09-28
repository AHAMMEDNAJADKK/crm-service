const express = require('express');
const {
  getServicePackages,
  getActiveServicePackages,
  createServicePackage,
  updateServicePackage,
  toggleServicePackageStatus,
  deleteServicePackage
} = require('../controllers/servicePackageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public / Quick read for active services
router.get('/active', getActiveServicePackages);

// Protected Admin Routes
router.use(protect);
router.get('/', getServicePackages);
router.post('/', createServicePackage);
router.put('/:id', updateServicePackage);
router.patch('/:id/toggle', toggleServicePackageStatus);
router.delete('/:id', deleteServicePackage);

module.exports = router;
