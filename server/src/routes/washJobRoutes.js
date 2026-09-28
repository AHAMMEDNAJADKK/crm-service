const express = require('express');
const router = express.Router();
const washJobController = require('../controllers/washJobController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Enforce JWT authentication on all active job controls
router.use(protect);

router.post('/calculate-price', washJobController.calculatePrice);
router.get('/today', washJobController.getTodayJobs);
router.post('/', washJobController.createWashJob);
router.get('/', washJobController.getWashJobs);
router.get('/:id', washJobController.getWashJobById);
router.put('/:id', washJobController.updateWashJob);
router.patch('/:id/status', washJobController.quickUpdateStatus);
router.delete('/:id', washJobController.deleteWashJob);

router.post('/:id/photos', upload.array('photos', 5), washJobController.addPhotos);

module.exports = router;
