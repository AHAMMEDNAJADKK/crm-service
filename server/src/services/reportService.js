const WashJob = require('../models/WashJob');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Invoice = require('../models/Invoice');
const ServicePackage = require('../models/ServicePackage');
const VehicleType = require('../models/VehicleType');

// Helper to get start and end of day in Date objects
const getDayBounds = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// 1. TODAY'S DASHBOARD METRICS
const getTodayDashboard = async () => {
  const { start, end } = getDayBounds();

  // Wash jobs created today
  const jobsAgg = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalServices: { $sum: 1 },
        completedServices: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
        },
        pendingServices: {
          $sum: { $cond: [{ $not: [{ $in: ['$status', ['completed', 'delivered', 'cancelled']] }] }, 1, 0] }
        },
        cancelledServices: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalServiceValue: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$finalAmount', '$price'] },
              0
            ]
          }
        },
        totalAmountPaidForJobs: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$amountPaid', 0] },
              0
            ]
          }
        }
      }
    }
  ]);

  const jobsData = jobsAgg[0] || {
    totalServices: 0,
    completedServices: 0,
    pendingServices: 0,
    cancelledServices: 0,
    totalServiceValue: 0,
    totalAmountPaidForJobs: 0
  };

  // Actual payments collected TODAY
  const paymentsAgg = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        amountCollected: { $sum: '$amount' }
      }
    }
  ]);
  const amountCollected = paymentsAgg[0]?.amountCollected || 0;

  // Actual expenses incurred TODAY
  const expensesAgg = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);
  const totalExpenses = expensesAgg[0]?.totalExpenses || 0;

  // Outstanding = valid service value - actual money paid on those services
  const outstanding = Math.max(0, Math.round((jobsData.totalServiceValue - jobsData.totalAmountPaidForJobs) * 100) / 100);

  // Net Cash Flow = actual money collected - expenses
  const netCashFlow = Math.round((amountCollected - totalExpenses) * 100) / 100;

  // Today's active service vehicles list
  const todayVehicles = await WashJob.find({ createdAt: { $gte: start, $lte: end } })
    .populate('customerId', 'name nameMalayalam mobile place')
    .sort({ createdAt: -1 });

  return {
    today: {
      totalServices: jobsData.totalServices,
      completedServices: jobsData.completedServices,
      pendingServices: jobsData.pendingServices,
      cancelledServices: jobsData.cancelledServices,
      totalServiceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      amountCollected: Math.round(amountCollected * 100) / 100,
      outstanding,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netCashFlow
    },
    todayVehicles
  };
};

// 2. WEEKLY DASHBOARD METRICS
const getWeeklyDashboard = async (startDate, endDate) => {
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    // Current week (starting Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  // Jobs aggregation
  const jobsAgg = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
        },
        totalServiceValue: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$finalAmount', '$price'] },
              0
            ]
          }
        },
        totalAmountPaidForJobs: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$amountPaid', 0] },
              0
            ]
          }
        }
      }
    }
  ]);

  const jobsData = jobsAgg[0] || {
    totalJobs: 0,
    completedJobs: 0,
    totalServiceValue: 0,
    totalAmountPaidForJobs: 0
  };

  // Payments collected in range
  const payAgg = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalCollection: { $sum: '$amount' }
      }
    }
  ]);
  const totalCollection = payAgg[0]?.totalCollection || 0;

  // Expenses in range
  const expAgg = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);
  const totalExpenses = expAgg[0]?.totalExpenses || 0;

  const outstanding = Math.max(0, Math.round((jobsData.totalServiceValue - jobsData.totalAmountPaidForJobs) * 100) / 100);
  const netCashFlow = Math.round((totalCollection - totalExpenses) * 100) / 100;

  // Daily collection trend in week
  const dailyCollectionTrend = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    summary: {
      totalJobs: jobsData.totalJobs,
      completedJobs: jobsData.completedJobs,
      totalServiceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      totalCollection: Math.round(totalCollection * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netCashFlow,
      outstandingAmount: outstanding
    },
    dailyCollectionTrend: dailyCollectionTrend.map(d => ({ date: d._id, collection: d.amount })),
    dateRange: { start, end }
  };
};

// 3. MONTHLY DASHBOARD METRICS
const getMonthlyDashboard = async (year, month) => {
  const now = new Date();
  const targetYear = year ? parseInt(year) : now.getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();

  const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
  const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Jobs aggregation
  const jobsAgg = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalServices: { $sum: 1 },
        completedServices: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
        },
        totalServiceValue: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$finalAmount', '$price'] },
              0
            ]
          }
        },
        totalAmountPaidForJobs: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'cancelled'] },
              { $ifNull: ['$amountPaid', 0] },
              0
            ]
          }
        }
      }
    }
  ]);

  const jobsData = jobsAgg[0] || {
    totalServices: 0,
    completedServices: 0,
    totalServiceValue: 0,
    totalAmountPaidForJobs: 0
  };

  // Payments collected in month
  const payAgg = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalCollection: { $sum: '$amount' }
      }
    }
  ]);
  const totalCollection = payAgg[0]?.totalCollection || 0;

  // Expenses in month
  const expAgg = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);
  const totalExpenses = expAgg[0]?.totalExpenses || 0;

  const outstanding = Math.max(0, Math.round((jobsData.totalServiceValue - jobsData.totalAmountPaidForJobs) * 100) / 100);
  const netCashFlow = Math.round((totalCollection - totalExpenses) * 100) / 100;
  const avgServiceValue = jobsData.totalServices > 0
    ? Math.round((jobsData.totalServiceValue / jobsData.totalServices) * 100) / 100
    : 0;

  // Service distribution
  const serviceDistribution = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $ifNull: ['$serviceName', '$washPackage'] },
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$finalAmount', '$price'] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Vehicle type distribution
  const vehicleTypeDistribution = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$vehicleType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Payment method distribution
  const paymentMethodDistribution = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // Expense category distribution
  const expenseCategoryDistribution = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // Daily collection trend: Day 1 to Day 30/31
  const dailyTrendsRaw = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    summary: {
      totalServices: jobsData.totalServices,
      totalRevenue: Math.round(jobsData.totalServiceValue * 100) / 100,
      totalCollection: Math.round(totalCollection * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netCashFlow,
      outstanding,
      avgServiceValue,
      mostUsedService: serviceDistribution[0]?._id || 'N/A',
      mostServicedVehicleType: vehicleTypeDistribution[0]?._id || 'N/A'
    },
    serviceDistribution: serviceDistribution.map(s => ({ name: s._id, count: s.count, totalValue: s.totalValue })),
    vehicleTypeDistribution: vehicleTypeDistribution.map(v => ({ name: v._id.toUpperCase(), count: v.count })),
    paymentMethodDistribution: paymentMethodDistribution.map(p => ({ method: p._id.toUpperCase(), total: p.total, count: p.count })),
    expenseCategoryDistribution: expenseCategoryDistribution.map(e => ({ category: e._id, total: e.total, count: e.count })),
    dailyCollectionTrend: dailyTrendsRaw.map(d => ({ date: d._id, collection: d.amount })),
    dateRange: { start, end }
  };
};

// 4. DAILY CLOSING / CASH SUMMARY
const getDailyClosing = async (dateStr) => {
  const { start, end } = getDayBounds(dateStr);

  // Payments grouped by method
  const methodAgg = await Payment.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const methodTotals = {
    cash: 0,
    upi: 0,
    card: 0,
    bankTransfer: 0,
    other: 0
  };

  let totalCollected = 0;
  methodAgg.forEach(m => {
    const key = (m._id || '').toLowerCase();
    totalCollected += m.total;
    if (key === 'cash') methodTotals.cash += m.total;
    else if (key === 'upi') methodTotals.upi += m.total;
    else if (key === 'card') methodTotals.card += m.total;
    else if (key === 'bank-transfer' || key === 'bank transfer') methodTotals.bankTransfer += m.total;
    else methodTotals.other += m.total;
  });

  // Total expenses today
  const expAgg = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        cashExpenses: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amount', 0] }
        }
      }
    }
  ]);

  const totalExpenses = expAgg[0]?.total || 0;
  const cashExpenses = expAgg[0]?.cashExpenses || 0;

  // Expected Physical Cash In Hand = Cash Collections - Cash Expenses
  const expectedCash = Math.max(0, methodTotals.cash - cashExpenses);

  return {
    date: start,
    cashCollections: methodTotals.cash,
    upiCollections: methodTotals.upi,
    cardCollections: methodTotals.card,
    bankCollections: methodTotals.bankTransfer,
    otherCollections: methodTotals.other,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    cashExpenses: Math.round(cashExpenses * 100) / 100,
    expectedCash: Math.round(expectedCash * 100) / 100
  };
};

// 5. GLOBAL SEARCH (Requirement 20)
const globalSearch = async (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return { customers: [], vehicles: [], jobs: [] };
  }

  const clean = searchTerm.trim();
  const normalized = clean.replace(/[\s\-_.]/g, '').toUpperCase();

  const [customers, vehicles, jobs] = await Promise.all([
    Customer.find({
      $or: [
        { name: { $regex: clean, $options: 'i' } },
        { nameMalayalam: { $regex: clean, $options: 'i' } },
        { mobile: { $regex: clean, $options: 'i' } },
        { alternateMobile: { $regex: clean, $options: 'i' } },
        { place: { $regex: clean, $options: 'i' } }
      ]
    }).limit(10),

    Vehicle.find({
      $or: [
        { regNumber: { $regex: clean, $options: 'i' } },
        { regNumberNormalized: { $regex: normalized, $options: 'i' } }
      ]
    }).populate('customerId', 'name nameMalayalam mobile').limit(10),

    WashJob.find({
      $or: [
        { tokenNumber: { $regex: clean, $options: 'i' } },
        { vehicleReg: { $regex: clean, $options: 'i' } },
        { customerMobile: { $regex: clean, $options: 'i' } }
      ]
    }).populate('customerId', 'name nameMalayalam mobile').limit(10)
  ]);

  return { customers, vehicles, jobs };
};

// CSV Export helper
const exportToCSV = (headers, rows) => {
  const csvRows = [headers.join(',')];
  rows.forEach(row => {
    const escaped = row.map(val => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    csvRows.push(escaped.join(','));
  });
  return csvRows.join('\n');
};

module.exports = {
  getTodayDashboard,
  getWeeklyDashboard,
  getMonthlyDashboard,
  getDailyClosing,
  globalSearch,
  exportToCSV
};
