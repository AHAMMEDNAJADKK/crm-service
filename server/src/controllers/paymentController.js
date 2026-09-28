const Payment = require('../models/Payment');
const WashJob = require('../models/WashJob');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// Get all payments / income transactions
const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search = '', paymentMethod = '', startDate = '', endDate = '' } = req.query;

    const query = {};

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
        { paymentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { vehicleReg: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('jobId', 'tokenNumber vehicleReg washPackage serviceName finalAmount amountPaid balance status')
      .populate('customerId', 'name mobile')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate sum of payments matching the current filter
    const totalAgg = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]);
    const totalCollected = totalAgg[0]?.totalCollected || 0;

    res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalCollected
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

// Record payment for a wash job
const recordJobPayment = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' });
    }

    const job = await WashJob.findById(jobId).populate('customerId');
    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    const currentBalance = job.balance !== undefined ? job.balance : (job.finalAmount - job.amountPaid);
    if (currentBalance <= 0) {
      return res.status(400).json({ success: false, error: 'This service job is already fully paid' });
    }

    // Guard against overpayment
    const safeAmount = Math.min(payAmount, currentBalance);

    // Create payment entry
    const payment = await Payment.create({
      jobId: job._id,
      customerId: job.customerId?._id || null,
      customerName: job.customerName || job.customerId?.name || 'Walk-in Customer',
      vehicleReg: job.vehicleReg,
      serviceName: job.serviceName || job.washPackage,
      amount: safeAmount,
      paymentMethod: paymentMethod || 'cash',
      date: new Date(),
      notes: notes || '',
      createdBy: req.user?._id || null,
      staffName: req.user?.name || 'Admin'
    });

    // Update job numbers
    job.amountPaid = Math.round(((job.amountPaid || 0) + safeAmount) * 100) / 100;
    job.balance = Math.max(0, Math.round((job.finalAmount - job.amountPaid) * 100) / 100);
    job.paymentMethod = paymentMethod || job.paymentMethod || 'cash';
    job.paymentStatus = job.balance <= 0 ? 'paid' : 'partial';
    await job.save();

    // Sync corresponding Invoice if exists, or create one
    let invoice = await Invoice.findOne({ washJobId: job._id });
    if (!invoice) {
      invoice = await Invoice.create({
        washJobId: job._id,
        customerId: job.customerId?._id || null,
        vehicleReg: job.vehicleReg,
        vehicleType: job.vehicleType,
        washPackage: job.washPackage,
        amount: job.servicePrice || job.price,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: job.finalAmount,
        paymentStatus: job.paymentStatus,
        paymentMethod: paymentMethod || 'cash',
        payments: [{
          amount: safeAmount,
          method: paymentMethod || 'cash',
          note: notes || 'Service payment',
          date: new Date()
        }],
        paidAt: job.paymentStatus === 'paid' ? new Date() : null
      });
    } else {
      invoice.payments.push({
        amount: safeAmount,
        method: paymentMethod || 'cash',
        note: notes || 'Service payment',
        date: new Date()
      });
      invoice.paymentStatus = job.paymentStatus;
      if (job.paymentStatus === 'paid') {
        invoice.paidAt = new Date();
      }
      await invoice.save();
    }

    // Update payment with invoiceId
    payment.invoiceId = invoice._id;
    await payment.save();

    // Increment customer total spend
    if (job.customerId?._id) {
      await Customer.findByIdAndUpdate(job.customerId._id, {
        $inc: { totalSpend: safeAmount }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        job
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get payments for a specific job
const getJobPayments = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const payments = await Payment.find({ jobId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  recordJobPayment,
  getJobPayments
};
