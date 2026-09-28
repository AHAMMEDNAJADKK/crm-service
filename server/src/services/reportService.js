const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const WashJob = require('../models/WashJob');
const Customer = require('../models/Customer');
const WaterLog = require('../models/WaterLog');
const mongoose = require('mongoose');

// Helper to parse date ranges
const getDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// 1. Revenue Report (with vehicle type and wash package breakdowns)
const getRevenueReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  const invoices = await Invoice.find({
    createdAt: { $gte: start, $lte: end }
  }).populate('customerId', 'name mobile');

  const statsAgg = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$grandTotal' },
        totalCollected: { $sum: { $sum: '$payments.amount' } },
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = statsAgg[0] || { totalBilled: 0, totalCollected: 0, count: 0 };
  const totalPending = Math.max(0, stats.totalBilled - stats.totalCollected);

  // Group by vehicle type
  const vTypeAgg = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$vehicleType',
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Group by wash package
  const pkgAgg = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$washPackage',
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Daily trends
  const dailyTrends = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        amount: { $sum: '$grandTotal' },
        collected: { $sum: { $sum: '$payments.amount' } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    summary: {
      totalRevenue: stats.totalBilled,
      totalCollected: stats.totalCollected,
      totalPending,
      invoiceCount: stats.count
    },
    vehicleTypeBreakdown: vTypeAgg.map(v => ({ vehicleType: v._id, total: v.total, count: v.count })),
    packageBreakdown: pkgAgg.map(p => ({ washPackage: p._id, total: p.total, count: p.count })),
    dailyTrends: dailyTrends.map(d => ({ date: d._id, amount: d.amount, collected: d.collected })),
    invoices
  };
};

// 2. Expense Report
const getExpenseReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  const expenses = await Expense.find({
    date: { $gte: start, $lte: end }
  });

  const aggregates = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);

  const categoryBreakdown = aggregates.map(a => ({
    category: a._id,
    amount: a.total
  }));

  const totalExpenses = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const dailyTrends = await Expense.aggregate([
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
      totalExpenses,
      expenseCount: expenses.length
    },
    categoryBreakdown,
    dailyTrends: dailyTrends.map(d => ({ date: d._id, amount: d.amount })),
    expenses
  };
};

// 3. Profit & Loss Report
const getPLReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  const revenueData = await getRevenueReport(start, end);
  const expenseData = await getExpenseReport(start, end);

  const totalRevenue = revenueData.summary.totalRevenue;
  const totalExpenses = expenseData.summary.totalExpenses;
  const netProfit = totalRevenue - totalExpenses;

  const trendMap = {};
  revenueData.dailyTrends.forEach(r => {
    trendMap[r.date] = { date: r.date, revenue: r.amount, expenses: 0, profit: r.amount };
  });

  expenseData.dailyTrends.forEach(e => {
    if (trendMap[e.date]) {
      trendMap[e.date].expenses = e.amount;
      trendMap[e.date].profit = trendMap[e.date].revenue - e.amount;
    } else {
      trendMap[e.date] = { date: e.date, revenue: 0, expenses: e.amount, profit: -e.amount };
    }
  });

  const PLTrends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    },
    trends: PLTrends
  };
};

// 4. Wash Volume / Job Card TAT Report
const getJobCardReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  const totalJobs = await WashJob.countDocuments({ createdAt: { $gte: start, $lte: end } });

  const statusStats = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Turnaround Time (TAT) in hours for completed jobs
  const completedJobs = await WashJob.find({
    status: 'delivered',
    endTime: { $ne: null },
    createdAt: { $gte: start, $lte: end }
  });

  let totalTATHours = 0;
  completedJobs.forEach(job => {
    const diffMs = new Date(job.endTime) - new Date(job.createdAt);
    totalTATHours += diffMs / (1000 * 60 * 60);
  });
  const avgTurnaroundHours = completedJobs.length > 0 ? totalTATHours / completedJobs.length : 0;

  // Staff workload performance
  const staffPerformance = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$assignedStaff',
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        revenueGenerated: { $sum: '$price' }
      }
    }
  ]);

  const packagePopularity = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$washPackage', count: { $sum: 1 } } }
  ]);

  // Peak Hour analysis
  const peakHours = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    summary: {
      totalJobs,
      completedJobsCount: completedJobs.length,
      avgTurnaroundHours
    },
    statusBreakdown: statusStats.map(s => ({ status: s._id, count: s.count })),
    packageBreakdown: packagePopularity.map(p => ({ washPackage: p._id, count: p.count })),
    staffPerformance: staffPerformance.map(sp => ({
      name: sp._id || 'Unassigned',
      totalJobs: sp.totalJobs,
      completedJobs: sp.completedJobs,
      revenueGenerated: sp.revenueGenerated
    })),
    peakHours: peakHours.map(ph => ({ hour: ph._id, count: ph.count }))
  };
};

// 5. Water Usage Report
const getWaterUsageReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  // Sum up litres logged in wash jobs
  const jobWater = await WashJob.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$vehicleType',
        totalLitres: { $sum: '$waterUsedLitres' },
        avgLitres: { $avg: '$waterUsedLitres' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Fetch overhead daily logs
  const logs = await WaterLog.find({
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  const totalLogsLitres = logs.reduce((sum, l) => sum + l.litresUsed, 0);
  const totalJobLitres = jobWater.reduce((sum, j) => sum + j.totalLitres, 0);

  return {
    summary: {
      totalWaterUsed: totalJobLitres + totalLogsLitres,
      jobConsumption: totalJobLitres,
      overheadConsumption: totalLogsLitres
    },
    vehicleTypeWater: jobWater.map(j => ({
      vehicleType: j._id,
      totalLitres: j.totalLitres,
      avgLitres: parseFloat(j.avgLitres.toFixed(1)),
      count: j.count
    })),
    dailyLogs: logs
  };
};

// 6. Customer spenders
const getCustomerReport = async (startDate, endDate) => {
  const { start, end } = getDateRange(startDate, endDate);

  const totalCustomers = await Customer.countDocuments({});
  const newCustomersCount = await Customer.countDocuments({ createdAt: { $gte: start, $lte: end } });

  // Top spenders
  const topSpenders = await Invoice.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$customerId',
        totalSpend: { $sum: '$grandTotal' },
        invoicesCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpend: -1 } },
    { $limit: 10 }
  ]);

  const topSpendersList = [];
  for (const spender of topSpenders) {
    if (spender._id) {
      const cust = await Customer.findById(spender._id).select('name mobile email');
      if (cust) {
        topSpendersList.push({
          customerId: spender._id,
          name: cust.name,
          mobile: cust.mobile,
          email: cust.email,
          totalSpend: spender.totalSpend,
          invoicesCount: spender.invoicesCount
        });
      }
    }
  }

  // Repeat customers count
  const customerInvoices = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$customerId',
        invoiceCount: { $sum: 1 }
      }
    }
  ]);

  const repeatCustomersCount = customerInvoices.filter(ci => ci.invoiceCount > 1 && ci._id !== null).length;
  const singleCustomersCount = customerInvoices.filter(ci => ci.invoiceCount === 1 && ci._id !== null).length;

  return {
    summary: {
      totalCustomers,
      newCustomersCount,
      repeatCustomersCount,
      repeatRatio: customerInvoices.length > 0 ? (repeatCustomersCount / customerInvoices.length) * 100 : 0
    },
    topSpenders: topSpendersList,
    customerPurchaseDistribution: [
      { name: 'Single Purchase', value: singleCustomersCount },
      { name: 'Repeat Customer', value: repeatCustomersCount }
    ]
  };
};

const exportToCSV = (headers, rows) => {
  const headerLine = headers.join(',');
  const rowLines = rows.map(row =>
    row.map(cell => {
      const stringified = cell === null || cell === undefined ? '' : String(cell);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    }).join(',')
  );
  return [headerLine, ...rowLines].join('\n');
};

module.exports = {
  getRevenueReport,
  getExpenseReport,
  getPLReport,
  getJobCardReport,
  getWaterUsageReport,
  getCustomerReport,
  exportToCSV
};
