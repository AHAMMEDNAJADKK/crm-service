const express = require('express');
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  uploadExpenseReceipt,
  getExpenseSummary,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // Secure all expense routes

router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/summary', getExpenseSummary);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.post('/:id/receipt', upload.single('receipt'), uploadExpenseReceipt);
router.delete('/:id', deleteExpense);

module.exports = router;
