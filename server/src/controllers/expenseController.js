const Expense = require('../models/Expense');

// Get expenses list with pagination, filters, and searches
const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const paymentMethod = (req.query.paymentMethod || '').trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = req.query.sortBy || 'date';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { expenseId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    // Sum matching expenses
    const sumAgg = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);
    const totalSpent = sumAgg[0]?.totalSpent || 0;

    res.status(200).json({
      success: true,
      data: expenses,
      summary: {
        totalSpent
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single expense
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// Create expense
const createExpense = async (req, res, next) => {
  try {
    const { date, category, title, description, amount, paymentMethod, vendor, notes } = req.body;

    if (!category || !amount || (!title && !description)) {
      return res.status(400).json({
        success: false,
        error: 'Category, title/description, and amount are required'
      });
    }

    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than zero' });
    }

    const descText = (description || title || '').trim();
    const titleText = (title || description || '').trim();

    const expense = await Expense.create({
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      title: titleText,
      description: descText,
      amount: cleanAmount,
      paymentMethod: (paymentMethod || 'cash').toLowerCase(),
      vendor: (vendor || '').trim(),
      notes: (notes || '').trim(),
      addedBy: req.user?._id || null,
      addedByName: req.user?.name || 'Admin',
      receipt: null
    });

    res.status(201).json({ success: true, data: expense, message: 'Expense recorded successfully' });
  } catch (error) {
    next(error);
  }
};

// Update expense
const updateExpense = async (req, res, next) => {
  try {
    const { date, category, title, description, amount, paymentMethod, vendor, notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (date) expense.date = new Date(date);
    if (category) expense.category = category.trim();
    if (title) expense.title = title.trim();
    if (description) expense.description = description.trim();
    if (amount !== undefined) {
      const clean = parseFloat(amount);
      if (clean > 0) expense.amount = clean;
    }
    if (paymentMethod) expense.paymentMethod = paymentMethod.toLowerCase();
    if (vendor !== undefined) expense.vendor = vendor.trim();
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();
    res.status(200).json({ success: true, data: expense, message: 'Expense updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete expense
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload Receipt for expense
const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    expense.receipt = `/uploads/${req.file.filename}`;
    await expense.save();

    res.status(200).json({ success: true, data: expense, message: 'Receipt attached successfully' });
  } catch (error) {
    next(error);
  }
};

// Get Expense summary & category breakdown
const getExpenseSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const breakdown = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalSpent = breakdown.reduce((sum, b) => sum + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalSpent,
        breakdown: breakdown.map(b => ({ category: b._id, totalAmount: b.totalAmount, count: b.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
  getExpenseSummary
};
