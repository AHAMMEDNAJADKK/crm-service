const reportService = require('../services/reportService');
const WashJob = require('../models/WashJob');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');

const handleCSVDownload = (res, filename, headers, rows) => {
  const csv = reportService.exportToCSV(headers, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send(csv);
};

// 1. Today's Dashboard Stats & Active Vehicles (Supports custom date & period filter)
const getTodayStats = async (req, res, next) => {
  try {
    const { date, filter } = req.query;
    const data = await reportService.getTodayDashboard(date || filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 1.1 Calendar Monthly Overview Stats
const getCalendarMonthStats = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await reportService.getCalendarMonthData(year, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 2. Weekly Dashboard Stats
const getWeeklyStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getWeeklyDashboard(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 3. Monthly Dashboard Stats
const getMonthlyStats = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await reportService.getMonthlyDashboard(year, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 4. Daily Closing / Cash Summary
const getDailyClosing = async (req, res, next) => {
  try {
    const { date } = req.query;
    const data = await reportService.getDailyClosing(date);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 5. Global Search (Customer, Vehicle, Reg, Job ID)
const searchGlobal = async (req, res, next) => {
  try {
    const { q } = req.query;
    const data = await reportService.globalSearch(q);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 6. Outstanding Receivables Report
const getOutstandingReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const jobs = await WashJob.find({
      balance: { $gt: 0 },
      status: { $ne: 'cancelled' }
    })
      .populate('customerId', 'name nameMalayalam mobile place')
      .sort({ createdAt: -1 });

    const totalOutstanding = jobs.reduce((sum, j) => sum + (j.balance || 0), 0);

    if (format === 'csv') {
      const headers = ['Token', 'Vehicle Reg', 'Customer', 'Mobile', 'Service', 'Final Amount', 'Paid', 'Outstanding Balance', 'Date'];
      const rows = jobs.map(j => [
        j.tokenNumber,
        j.vehicleReg,
        j.customerName || j.customerId?.name || 'Walk-in',
        j.customerMobile || j.customerId?.mobile || '',
        j.serviceName || j.washPackage,
        j.finalAmount || j.price,
        j.amountPaid || 0,
        j.balance || 0,
        new Date(j.createdAt).toLocaleDateString('en-IN')
      ]);
      return handleCSVDownload(res, 'outstanding_report.csv', headers, rows);
    }

    res.status(200).json({
      success: true,
      data: {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        count: jobs.length,
        jobs
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. General Revenue / Income Report
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }

    const payments = await Payment.find(query).sort({ date: -1 });
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    if (format === 'csv') {
      const headers = ['Payment ID', 'Date', 'Customer', 'Vehicle Reg', 'Service', 'Amount', 'Method', 'Staff'];
      const rows = payments.map(p => [
        p.paymentId,
        new Date(p.date).toLocaleDateString('en-IN'),
        p.customerName,
        p.vehicleReg,
        p.serviceName,
        p.amount,
        p.paymentMethod,
        p.staffName
      ]);
      return handleCSVDownload(res, 'income_report.csv', headers, rows);
    }

    res.status(200).json({
      success: true,
      data: {
        totalCollected: Math.round(totalCollected * 100) / 100,
        count: payments.length,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Expense Report
const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    if (format === 'csv') {
      const headers = ['Expense ID', 'Date', 'Category', 'Title/Description', 'Amount', 'Payment Method', 'Vendor'];
      const rows = expenses.map(e => [
        e.expenseId,
        new Date(e.date).toLocaleDateString('en-IN'),
        e.category,
        e.title || e.description,
        e.amount,
        e.paymentMethod,
        e.vendor || ''
      ]);
      return handleCSVDownload(res, 'expense_report.csv', headers, rows);
    }

    res.status(200).json({
      success: true,
      data: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        count: expenses.length,
        expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayStats,
  getCalendarMonthStats,
  getWeeklyStats,
  getMonthlyStats,
  getDailyClosing,
  searchGlobal,
  getOutstandingReport,
  getRevenueReport,
  getExpenseReport
};
