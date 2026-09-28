const reportService = require('../services/reportService');

const handleCSVDownload = (res, filename, headers, rows) => {
  const csv = reportService.exportToCSV(headers, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send(csv);
};

// 1. Revenue Report Endpoint
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const reportData = await reportService.getRevenueReport(startDate, endDate);

    if (format === 'csv') {
      const headers = ['Invoice Number', 'Vehicle Reg', 'Vehicle Type', 'Package', 'Grand Total', 'Status', 'Date'];
      const rows = reportData.invoices.map(inv => [
        inv.invoiceNumber,
        inv.vehicleReg,
        inv.vehicleType,
        inv.washPackage,
        inv.grandTotal,
        inv.paymentStatus,
        new Date(inv.createdAt).toLocaleDateString('en-IN')
      ]);
      return handleCSVDownload(res, 'revenue_report.csv', headers, rows);
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 2. Expense Report Endpoint
const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const reportData = await reportService.getExpenseReport(startDate, endDate);

    if (format === 'csv') {
      const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Vendor'];
      const rows = reportData.expenses.map(exp => [
        new Date(exp.date).toLocaleDateString('en-IN'),
        exp.category,
        exp.description,
        exp.amount,
        exp.paymentMethod,
        exp.vendor || 'N/A'
      ]);
      return handleCSVDownload(res, 'expense_report.csv', headers, rows);
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 3. P&L Report Endpoint
const getPLReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const reportData = await reportService.getPLReport(startDate, endDate);

    if (format === 'csv') {
      const headers = ['Date', 'Revenue', 'Expenses', 'Profit/Loss'];
      const rows = reportData.trends.map(t => [
        t.date,
        t.revenue,
        t.expenses,
        t.profit
      ]);
      return handleCSVDownload(res, 'profit_and_loss_report.csv', headers, rows);
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 4. Wash Volume / TAT Report Endpoint
const getJobCardReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const reportData = await reportService.getJobCardReport(startDate, endDate);
    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 5. Water Usage Report Endpoint
const getWaterUsageReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const reportData = await reportService.getWaterUsageReport(startDate, endDate);

    if (format === 'csv') {
      const headers = ['Vehicle Type', 'Total Litres Consumed', 'Average Litres Per Wash', 'Wash Count'];
      const rows = reportData.vehicleTypeWater.map(item => [
        item.vehicleType,
        item.totalLitres,
        item.avgLitres,
        item.count
      ]);
      return handleCSVDownload(res, 'water_usage_report.csv', headers, rows);
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

// 6. Customer Spenders Report Endpoint
const getCustomerReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const reportData = await reportService.getCustomerReport(startDate, endDate);

    if (format === 'csv') {
      const headers = ['Customer Name', 'Mobile', 'Email', 'Total Spend', 'Invoices Paid'];
      const rows = reportData.topSpenders.map(s => [
        s.name,
        s.mobile,
        s.email || 'N/A',
        s.totalSpend,
        s.invoicesCount
      ]);
      return handleCSVDownload(res, 'top_customers_report.csv', headers, rows);
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevenueReport,
  getExpenseReport,
  getPLReport,
  getJobCardReport,
  getWaterUsageReport,
  getCustomerReport
};
