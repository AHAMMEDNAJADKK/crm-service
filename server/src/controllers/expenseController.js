const Expense = require('../models/Expense');

// Get expenses list with pagination, filters, and searches
const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = req.query.sortBy || 'date';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single expense
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found', code: 404 });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create expense
const createExpense = async (req, res) => {
  try {
    const { date, category, description, amount, paymentMethod, vendor, notes } = req.body;

    if (!category || !description || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Category, description, amount, and payment method are required',
        code: 400
      });
    }

    const expense = await Expense.create({
      date: date || new Date(),
      category,
      description,
      amount,
      paymentMethod,
      vendor,
      notes,
      receipt: null
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { date, category, description, amount, paymentMethod, vendor, notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found', code: 404 });
    }

    if (date) expense.date = date;
    if (category) expense.category = category;
    if (description) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (vendor !== undefined) expense.vendor = vendor;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Upload receipt image/PDF
const uploadExpenseReceipt = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found', code: 404 });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No receipt file uploaded', code: 400 });
    }

    expense.receipt = `/uploads/${req.file.filename}`;
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: expense.receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Monthly expense summary grouped by category
const getExpenseSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const aggregates = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ success: true, data: aggregates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found', code: 404 });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  uploadExpenseReceipt,
  getExpenseSummary,
  deleteExpense
};
