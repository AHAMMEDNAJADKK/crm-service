const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const ManualRevenue = require('../models/ManualRevenue');

// Helper to compute ledger data
const getLedgerDataHelper = async (mode, period) => {
  let start, end;
  let summary = { revenue: 0, expenses: 0, net: 0, washCount: 0 };
  let rows = [];
  let chartData = [];

  if (mode === 'day') {
    // period format: YYYY-MM
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      throw new Error('Period in YYYY-MM format is required for day mode');
    }
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    start = new Date(year, month, 1, 0, 0, 0, 0);
    end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const numDays = end.getDate();

    // Fetch all for the month
    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid'
    });
    const manualRevs = await ManualRevenue.find({
      date: { $gte: start, $lte: end }
    });
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    // Populate rows
    for (let d = 1; d <= numDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateLabel = `${period}-${dayStr}`;
      
      const dayStart = new Date(year, month, d, 0, 0, 0, 0);
      const dayEnd = new Date(year, month, d, 23, 59, 59, 999);

      // Filter in-memory
      const dayInvoices = invoices.filter(i => i.createdAt >= dayStart && i.createdAt <= dayEnd);
      const dayManualRevs = manualRevs.filter(m => m.date >= dayStart && m.date <= dayEnd);
      const dayExpenses = expenses.filter(e => e.date >= dayStart && e.date <= dayEnd);

      const revSum = dayInvoices.reduce((sum, i) => sum + i.grandTotal, 0) +
                     dayManualRevs.reduce((sum, m) => sum + m.amount, 0);
      const expSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const washCount = dayInvoices.length;

      rows.push({
        date: dateLabel,
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum,
        washCount
      });

      chartData.push({
        label: `${d}`,
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum
      });

      summary.revenue += revSum;
      summary.expenses += expSum;
      summary.washCount += washCount;
    }
    summary.net = summary.revenue - summary.expenses;

  } else if (mode === 'month') {
    // period format: YYYY
    if (!period || !/^\d{4}$/.test(period)) {
      throw new Error('Period in YYYY format is required for month mode');
    }
    const year = parseInt(period);

    start = new Date(year, 0, 1, 0, 0, 0, 0);
    end = new Date(year, 11, 31, 23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid'
    });
    const manualRevs = await ManualRevenue.find({
      date: { $gte: start, $lte: end }
    });
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999);

      const mInvoices = invoices.filter(i => i.createdAt >= monthStart && i.createdAt <= monthEnd);
      const mManualRevs = manualRevs.filter(mr => mr.date >= monthStart && mr.date <= monthEnd);
      const mExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);

      const revSum = mInvoices.reduce((sum, i) => sum + i.grandTotal, 0) +
                     mManualRevs.reduce((sum, mr) => sum + mr.amount, 0);
      const expSum = mExpenses.reduce((sum, e) => sum + e.amount, 0);
      const washCount = mInvoices.length;

      const monthVal = String(m + 1).padStart(2, '0');
      rows.push({
        month: `${period}-${monthVal}`,
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum,
        washCount
      });

      chartData.push({
        label: monthNames[m],
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum
      });

      summary.revenue += revSum;
      summary.expenses += expSum;
      summary.washCount += washCount;
    }
    summary.net = summary.revenue - summary.expenses;

  } else if (mode === 'year') {
    // All years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4; // last 5 years

    for (let y = startYear; y <= currentYear; y++) {
      const yStart = new Date(y, 0, 1, 0, 0, 0, 0);
      const yEnd = new Date(y, 11, 31, 23, 59, 59, 999);

      const invoices = await Invoice.find({
        createdAt: { $gte: yStart, $lte: yEnd },
        paymentStatus: 'paid'
      });
      const manualRevs = await ManualRevenue.find({
        date: { $gte: yStart, $lte: yEnd }
      });
      const expenses = await Expense.find({
        date: { $gte: yStart, $lte: yEnd }
      });

      const revSum = invoices.reduce((sum, i) => sum + i.grandTotal, 0) +
                     manualRevs.reduce((sum, mr) => sum + mr.amount, 0);
      const expSum = expenses.reduce((sum, e) => sum + e.amount, 0);
      const washCount = invoices.length;

      rows.push({
        year: String(y),
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum,
        washCount
      });

      chartData.push({
        label: String(y),
        revenue: revSum,
        expenses: expSum,
        net: revSum - expSum
      });

      summary.revenue += revSum;
      summary.expenses += expSum;
      summary.washCount += washCount;
    }
    summary.net = summary.revenue - summary.expenses;
  }

  return { summary, rows, chartData };
};

// GET /api/v1/admin/ledger
const getLedger = async (req, res, next) => {
  try {
    const { mode = 'day', period } = req.query;
    const data = await getLedgerDataHelper(mode, period);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/ledger/day/:date
const getLedgerDayDetails = async (req, res, next) => {
  try {
    const { date } = req.params; // format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Expected YYYY-MM-DD' });
    }
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'paid'
    }).populate('customerId', 'name');

    const manualRevenues = await ManualRevenue.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const expenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.status(200).json({
      success: true,
      data: {
        invoices,
        manualRevenues,
        expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/ledger/export
const exportLedgerCSV = async (req, res, next) => {
  try {
    const { mode = 'month', period } = req.query;
    const data = await getLedgerDataHelper(mode, period);

    let csv = 'Date/Period,Revenue (INR),Expenses (INR),Net Profit (INR),Wash Count\r\n';
    data.rows.forEach(r => {
      const label = r.date || r.month || r.year;
      csv += `${label},${r.revenue},${r.expenses},${r.net},${r.washCount}\r\n`;
    });
    // Add total row
    csv += `TOTAL,${data.summary.revenue},${data.summary.expenses},${data.summary.net},${data.summary.washCount}\r\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ledger-${period || 'history'}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/ledger/revenue
const addManualRevenue = async (req, res, next) => {
  try {
    const { date, description, vehicleType, washPackage, amount, paymentMethod, notes } = req.body;
    
    if (!date || !description || amount === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'date, description, amount, and paymentMethod are required' });
    }

    const manualRev = await ManualRevenue.create({
      date: new Date(date),
      description,
      vehicleType: vehicleType || null,
      washPackage: washPackage || null,
      amount: parseFloat(amount),
      paymentMethod,
      notes: notes || '',
      source: 'manual'
    });

    res.status(201).json({
      success: true,
      message: 'Manual revenue entry created successfully',
      data: manualRev
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/ledger/expense
const addManualExpense = async (req, res, next) => {
  try {
    const { date, category, description, amount, vendor, notes, paymentMethod } = req.body;

    if (!date || !category || !description || amount === undefined) {
      return res.status(400).json({ success: false, error: 'date, category, description, and amount are required' });
    }

    const expense = await Expense.create({
      date: new Date(date),
      category,
      description,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'upi',
      vendor: vendor || '',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Manual expense entry created successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLedger,
  getLedgerDayDetails,
  exportLedgerCSV,
  addManualRevenue,
  addManualExpense
};
