const express = require('express');
const {
  getInvoices,
  getInvoiceById,
  createManualInvoice,
  updateInvoiceLineItems,
  recordInvoicePayment,
  downloadInvoicePDF,
  emailInvoicePDF
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all invoice routes

router.get('/', getInvoices);
router.post('/manual', createManualInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id/line-items', updateInvoiceLineItems);
router.post('/:id/payments', recordInvoicePayment);
router.get('/:id/pdf', downloadInvoicePDF);
router.post('/:id/email', emailInvoicePDF);

module.exports = router;
