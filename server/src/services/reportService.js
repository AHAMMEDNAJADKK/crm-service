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

// 1. TODAY'S & OVERVIEW DASHBOARD METRICS
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

  // Cash Profit = Collection - Expenses
  const todayProfit = Math.round((amountCollected - totalExpenses) * 100) / 100;

  // --- THIS MONTH SUMMARY ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthJobsAgg = await WashJob.aggregate([
    { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalVehicles: { $sum: 1 },
        serviceValue: { $sum: { $ifNull: ['$finalAmount', '$price'] } }
      }
    }
  ]);

  const monthPayAgg = await Payment.aggregate([
    { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
    {
      $group: {
        _id: null,
        collection: { $sum: '$amount' }
      }
    }
  ]);

  const monthExpAgg = await Expense.aggregate([
    { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
    {
      $group: {
        _id: null,
        expenses: { $sum: '$amount' }
      }
    }
  ]);

  const monthCollection = Math.round((monthPayAgg[0]?.collection || 0) * 100) / 100;
  const monthExpenses = Math.round((monthExpAgg[0]?.expenses || 0) * 100) / 100;
  const monthProfit = Math.round((monthCollection - monthExpenses) * 100) / 100;
  const monthServiceValue = Math.round((monthJobsAgg[0]?.serviceValue || 0) * 100) / 100;
  const monthVehicles = monthJobsAgg[0]?.totalVehicles || 0;

  // --- VEHICLES BY TYPE (This Month & Today) ---
  const vehiclesByType = await WashJob.aggregate([
    { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$vehicleType',
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$finalAmount', '$price'] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // --- SERVICES BREAKDOWN ---
  const servicesBreakdown = await WashJob.aggregate([
    { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $ifNull: ['$serviceName', '$washPackage'] },
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$finalAmount', '$price'] } }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);

  // --- PAYMENT BREAKDOWN ---
  const paymentsBreakdown = await Payment.aggregate([
    { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // --- EXPENSE BREAKDOWN ---
  const expensesBreakdown = await Expense.aggregate([
    { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // --- LAST 7 DAYS PERFORMANCE CHART DATA (Income vs Expenses vs Profit) ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyPayments7d = await Payment.aggregate([
    { $match: { date: { $gte: sevenDaysAgo, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        collection: { $sum: '$amount' }
      }
    }
  ]);

  const dailyExpenses7d = await Expense.aggregate([
    { $match: { date: { $gte: sevenDaysAgo, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        expenses: { $sum: '$amount' }
      }
    }
  ]);

  const payMap = {};
  dailyPayments7d.forEach(p => { payMap[p._id] = p.collection; });
  const expMap = {};
  dailyExpenses7d.forEach(e => { expMap[e._id] = e.expenses; });

  const performanceChart7d = [];
  for (let i = 6; i >= 0; i--) {
    const cur = new Date();
    cur.setDate(cur.getDate() - i);
    const dateKey = cur.toISOString().split('T')[0];
    const dayLabel = cur.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const col = payMap[dateKey] || 0;
    const exp = expMap[dateKey] || 0;
    performanceChart7d.push({
      date: dateKey,
      label: dayLabel,
      income: col,
      collection: col,
      expenses: exp,
      profit: Math.round((col - exp) * 100) / 100
    });
  }

  // --- RECENT PAYMENTS (Latest 8) ---
  const recentPayments = await Payment.find({})
    .sort({ date: -1 })
    .limit(8)
    .select('paymentId date vehicleReg serviceName amount paymentMethod customerName notes');

  // --- OUTSTANDING JOBS (Pending collection) ---
  const outstandingJobs = await WashJob.find({
    balance: { $gt: 0 },
    status: { $ne: 'cancelled' }
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .select('tokenNumber vehicleReg vehicleType serviceName finalAmount amountPaid balance createdAt paymentStatus');

  // Today's active service vehicles list
  const todayVehicles = await WashJob.find({ createdAt: { $gte: start, $lte: end } })
    .populate('customerId', 'name nameMalayalam mobile place')
    .sort({ createdAt: -1 });

  return {
    today: {
      totalServices: jobsData.totalServices,
      totalVehicles: jobsData.totalServices,
      completedServices: jobsData.completedServices,
      pendingServices: jobsData.pendingServices,
      cancelledServices: jobsData.cancelledServices,
      totalServiceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      serviceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      amountCollected: Math.round(amountCollected * 100) / 100,
      collection: Math.round(amountCollected * 100) / 100,
      outstanding,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      todayProfit,
      netCashFlow: todayProfit
    },
    month: {
      totalVehicles: monthVehicles,
      serviceValue: monthServiceValue,
      collection: monthCollection,
      expenses: monthExpenses,
      profit: monthProfit
    },
    vehiclesByType: vehiclesByType.map(v => ({
      name: v._id ? v._id.toUpperCase() : 'OTHER',
      count: v.count,
      totalValue: v.totalValue
    })),
    servicesBreakdown: servicesBreakdown.map(s => ({
      name: s._id || 'General Wash',
      count: s.count,
      totalValue: s.totalValue
    })),
    paymentsBreakdown: paymentsBreakdown.map(p => ({
      method: (p._id || 'cash').toUpperCase(),
      total: p.total,
      count: p.count
    })),
    expensesBreakdown: expensesBreakdown.map(e => ({
      category: e._id || 'Miscellaneous',
      total: e.total,
      count: e.count
    })),
    performanceChart7d,
    recentPayments,
    outstandingJobs,
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

  const dailyExpensesTrend = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const wPayMap = {};
  dailyCollectionTrend.forEach(p => { wPayMap[p._id] = p.amount; });
  const wExpMap = {};
  dailyExpensesTrend.forEach(e => { wExpMap[e._id] = e.amount; });

  const performanceChart = [];
  const curDate = new Date(start);
  while (curDate <= end) {
    const key = curDate.toISOString().split('T')[0];
    const lbl = curDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const col = wPayMap[key] || 0;
    const exp = wExpMap[key] || 0;
    performanceChart.push({
      date: key,
      label: lbl,
      income: col,
      collection: col,
      expenses: exp,
      profit: Math.round((col - exp) * 100) / 100
    });
    curDate.setDate(curDate.getDate() + 1);
  }

  return {
    summary: {
      totalJobs: jobsData.totalJobs,
      totalVehicles: jobsData.totalJobs,
      completedJobs: jobsData.completedJobs,
      totalServiceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      serviceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      totalCollection: Math.round(totalCollection * 100) / 100,
      collection: Math.round(totalCollection * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      profit: netCashFlow,
      netCashFlow,
      outstandingAmount: outstanding,
      outstanding
    },
    performanceChart,
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

  const dailyExpensesRaw = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const mPayMap = {};
  dailyTrendsRaw.forEach(p => { mPayMap[p._id] = p.amount; });
  const mExpMap = {};
  dailyExpensesRaw.forEach(e => { mExpMap[e._id] = e.amount; });

  const performanceChart = [];
  const curMDate = new Date(start);
  while (curMDate <= end && curMDate <= now) {
    const key = curMDate.toISOString().split('T')[0];
    const lbl = curMDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const col = mPayMap[key] || 0;
    const exp = mExpMap[key] || 0;
    performanceChart.push({
      date: key,
      label: lbl,
      income: col,
      collection: col,
      expenses: exp,
      profit: Math.round((col - exp) * 100) / 100
    });
    curMDate.setDate(curMDate.getDate() + 1);
  }

  return {
    summary: {
      totalServices: jobsData.totalServices,
      totalVehicles: jobsData.totalServices,
      totalRevenue: Math.round(jobsData.totalServiceValue * 100) / 100,
      serviceValue: Math.round(jobsData.totalServiceValue * 100) / 100,
      totalCollection: Math.round(totalCollection * 100) / 100,
      collection: Math.round(totalCollection * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      profit: netCashFlow,
      netCashFlow,
      outstanding,
      avgServiceValue,
      mostUsedService: serviceDistribution[0]?._id || 'N/A',
      mostServicedVehicleType: vehicleTypeDistribution[0]?._id || 'N/A'
    },
    performanceChart,
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

// 5. GLOBAL SEARCH (Multi-vehicle & Plate Normalization Support)
const globalSearch = async (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return { customers: [], vehicles: [], jobs: [] };
  }

  const clean = searchTerm.trim();
  const normalized = clean.replace(/[\s\-_.]/g, '').toUpperCase();
  
  // Allows matching "KL 01 AB 1234" when searching "KL01AB1234" and vice versa
  const flexPlatePattern = normalized.length >= 3
    ? normalized.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-_.]*')
    : clean;
  const plateRegex = new RegExp(flexPlatePattern, 'i');

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
        { regNumber: { $regex: plateRegex } },
        { regNumberNormalized: { $regex: normalized, $options: 'i' } },
        { vehicleType: { $regex: clean, $options: 'i' } }
      ]
    }).populate('customerId', 'name nameMalayalam mobile').limit(10),

    WashJob.find({
      $or: [
        { tokenNumber: { $regex: clean, $options: 'i' } },
        { vehicleReg: { $regex: plateRegex } },
        { vehicleType: { $regex: clean, $options: 'i' } },
        { serviceName: { $regex: clean, $options: 'i' } },
        { customerMobile: { $regex: clean, $options: 'i' } },
        { notes: { $regex: clean, $options: 'i' } }
      ]
    }).populate('customerId', 'name nameMalayalam mobile').limit(15)
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
