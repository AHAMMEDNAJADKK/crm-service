const express = require('express');
const router = express.Router();
const washJobController = require('../controllers/washJobController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Enforce JWT authentication on all active job controls
router.use(protect);

router.post('/', washJobController.createWashJob);
router.get('/', washJobController.getWashJobs);
router.get('/:id', washJobController.getWashJobById);
router.put('/:id', washJobController.updateWashJob);
router.delete('/:id', washJobController.deleteWashJob);

router.post('/:id/photos', upload.array('photos', 5), washJobController.addPhotos);

module.exports = router;
