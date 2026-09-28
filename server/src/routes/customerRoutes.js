const express = require('express');
const {
  getCustomers,
  findByMobile,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProfile
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all customer routes

router.get('/', getCustomers);
router.get('/by-mobile/:mobile', findByMobile);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/profile', getCustomerProfile);

module.exports = router;
