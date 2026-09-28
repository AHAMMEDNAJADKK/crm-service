const mongoose = require('mongoose');
const WashJob = require('../models/WashJob');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const WashPackagePrice = require('../models/WashPackagePrice');
const ServicePackage = require('../models/ServicePackage');
const VehicleType = require('../models/VehicleType');
const { assignBayOrQueue, autoAdvanceQueue, getQueueStatus } = require('../services/queueService');
const { sendSMS } = require('../config/twilio');

// Helper to broadcast queue updates to Socket.io
const broadcastQueueUpdate = async (req) => {
  const io = req.app.get('io');
  if (io) {
    const queueStatus = await getQueueStatus();
    io.to('queue').emit('queue:update', queueStatus);
  }
};

// Helper: Normalize vehicle registration plate
const normalizeReg = (str) => {
  if (!str) return '';
  return str.replace(/[\s\-_.]/g, '').toUpperCase();
};

// 1. Calculate price preview endpoint
exports.calculatePrice = async (req, res, next) => {
  try {
    const { vehicleType, washPackage, discount = 0, additionalCharge = 0 } = req.body;
    if (!vehicleType || !washPackage) {
      return res.status(400).json({ success: false, error: 'vehicleType and washPackage are required' });
    }

    const priceDoc = await WashPackagePrice.findOne({
      vehicleType: vehicleType.toLowerCase(),
      washPackage: washPackage.toLowerCase()
    });

    let basePrice = 0;
    let isNA = false;
    if (priceDoc) {
      basePrice = priceDoc.price !== null ? priceDoc.price : 0;
      isNA = !!priceDoc.isNA;
    } else {
      // Fallback: check basePrice on ServicePackage
      const svc = await ServicePackage.findOne({ code: washPackage.toLowerCase() });
      if (svc) basePrice = svc.basePrice || 0;
    }

    const cleanBase = Math.max(0, parseFloat(basePrice) || 0);
    const cleanAdd = Math.max(0, parseFloat(additionalCharge) || 0);
    const cleanDisc = Math.max(0, parseFloat(discount) || 0);
    const finalAmount = Math.max(0, Math.round((cleanBase + cleanAdd - cleanDisc) * 100) / 100);

    res.status(200).json({
      success: true,
      data: {
        servicePrice: cleanBase,
        additionalCharge: cleanAdd,
        discount: cleanDisc,
        finalAmount,
        isNA
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Create Service Job / Wash Entry
exports.createWashJob = async (req, res, next) => {
  try {
    const {
      vehicleReg,
      vehicleType,
      washPackage,
      customerName,
      customerMalayalam,
      customerMobile,
      assignedStaff,
      notes,
      priceOverride,
      discount = 0,
      additionalCharge = 0,
      initialPayment = 0,
      paymentMethod = 'cash'
    } = req.body;

    if (!vehicleReg || !vehicleType || !washPackage) {
      return res.status(400).json({ success: false, error: 'Vehicle registration, vehicle type, and service are required' });
    }

    const regUpper = vehicleReg.trim().toUpperCase();
    const regNormalized = normalizeReg(regUpper);

    // 1. Find or create customer
    let customerId = null;
    let resolvedCustomerName = customerName || '';
    if (customerMobile && customerMobile.trim()) {
      const cleanMobile = customerMobile.trim();
      let cust = await Customer.findOne({ mobile: cleanMobile });
      if (!cust) {
        cust = await Customer.create({
          name: customerName || 'Walk-in Customer',
          nameMalayalam: customerMalayalam || '',
          mobile: cleanMobile
        });
      } else if (customerMalayalam && !cust.nameMalayalam) {
        cust.nameMalayalam = customerMalayalam;
        await cust.save();
      }
      customerId = cust._id;
      resolvedCustomerName = cust.name;
    }

    // 2. Find or create vehicle
    let veh = await Vehicle.findOne({
      $or: [
        { regNumber: regUpper },
        { regNumberNormalized: regNormalized }
      ]
    });
    if (!veh) {
      veh = await Vehicle.create({
        regNumber: regUpper,
        regNumberNormalized: regNormalized,
        vehicleType: vehicleType.toLowerCase(),
        customerId
      });
    } else {
      if (customerId && !veh.customerId) {
        veh.customerId = customerId;
        await veh.save();
      }
    }

    // 3. Determine Service Price
    let basePrice = 0;
    const priceDoc = await WashPackagePrice.findOne({
      vehicleType: vehicleType.toLowerCase(),
      washPackage: washPackage.toLowerCase()
    });

    if (priceDoc && priceDoc.price !== null) {
      basePrice = priceDoc.price;
    } else {
      const svc = await ServicePackage.findOne({ code: washPackage.toLowerCase() });
      if (svc) basePrice = svc.basePrice || 0;
    }

    // Custom override if provided
    if (priceOverride !== undefined && priceOverride !== null && priceOverride !== '') {
      basePrice = Math.max(0, parseFloat(priceOverride));
    }

    // Get Service Name for display
    let serviceName = washPackage;
    const svcDoc = await ServicePackage.findOne({ code: washPackage.toLowerCase() });
    if (svcDoc) {
      serviceName = svcDoc.name;
    }

    const cleanBase = Math.max(0, parseFloat(basePrice) || 0);
    const cleanAdd = Math.max(0, parseFloat(additionalCharge) || 0);
    const cleanDisc = Math.max(0, parseFloat(discount) || 0);
    const finalAmount = Math.max(0, Math.round((cleanBase + cleanAdd - cleanDisc) * 100) / 100);

    const paidAmount = Math.min(finalAmount, Math.max(0, parseFloat(initialPayment) || 0));
    const balance = Math.max(0, Math.round((finalAmount - paidAmount) * 100) / 100);

    let paymentStatus = 'unpaid';
    if (paidAmount >= finalAmount && finalAmount > 0) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    const newJob = new WashJob({
      vehicleId: veh._id,
      vehicleReg: regUpper,
      vehicleType: vehicleType.toLowerCase(),
      customerId,
      customerName: resolvedCustomerName,
      customerMobile: customerMobile || '',
      washPackage: washPackage.toLowerCase(),
      serviceName,
      servicePrice: cleanBase,
      price: cleanBase,
      additionalCharge: cleanAdd,
      discount: cleanDisc,
      finalAmount,
      amountPaid: paidAmount,
      balance,
      paymentStatus,
      paymentMethod: paidAmount > 0 ? paymentMethod : 'pending',
      assignedStaff: assignedStaff || 'Unassigned',
      status: 'waiting',
      serviceStatus: 'waiting',
      notes: notes || '',
      createdBy: req.user?._id || null
    });

    // Allocate bay / queue
    await assignBayOrQueue(newJob);
    await newJob.save();

    // Link job to vehicle wash history
    if (veh) {
      veh.washHistory = veh.washHistory || [];
      veh.washHistory.push(newJob._id);
      await veh.save();
    }

    // Link job to customer count
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalWashes: 1 }
      });
    }

    // If upfront payment was made, record payment and invoice
    if (paidAmount > 0) {
      const paymentDoc = await Payment.create({
        jobId: newJob._id,
        customerId,
        customerName: resolvedCustomerName,
        vehicleReg: regUpper,
        serviceName,
        amount: paidAmount,
        paymentMethod,
        date: new Date(),
        notes: 'Initial service deposit / payment',
        createdBy: req.user?._id || null,
        staffName: req.user?.name || 'Admin'
      });

      const invoice = await Invoice.create({
        washJobId: newJob._id,
        customerId,
        vehicleReg: regUpper,
        vehicleType,
        washPackage,
        amount: cleanBase,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: finalAmount,
        paymentStatus,
        paymentMethod,
        payments: [{
          amount: paidAmount,
          method: paymentMethod,
          note: 'Initial deposit',
          date: new Date()
        }],
        paidAt: paymentStatus === 'paid' ? new Date() : null
      });

      paymentDoc.invoiceId = invoice._id;
      await paymentDoc.save();

      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalSpend: paidAmount }
        });
      }
    }

    // Broadcast queue update via Socket.io
    await broadcastQueueUpdate(req);

    const io = req.app.get('io');
    if (io) {
      io.to('queue').emit('job:statusChange', {
        tokenNumber: newJob.tokenNumber,
        vehicleReg: newJob.vehicleReg,
        status: newJob.status,
        message: `New wash logged for vehicle ${newJob.vehicleReg}. Assigned Token: ${newJob.tokenNumber}.`
      });
    }

    // Send SMS confirmation template if customer mobile is present
    const settings = await Settings.findOne() || {};
    if (customerMobile && settings.smsTemplates?.appointmentConfirmed) {
      let smsText = settings.smsTemplates.appointmentConfirmed
        .replace('{customerName}', resolvedCustomerName || 'Valued Customer')
        .replace('{vehicleReg}', regUpper)
        .replace('{date}', new Date().toLocaleDateString('en-IN'))
        .replace('{time}', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      sendSMS(customerMobile, smsText).catch(() => {});
    }

    let warning = null;
    if (priceDoc && priceDoc.isNA) {
      warning = "Selected service is marked as Not Applicable for this vehicle type.";
    }

    res.status(201).json({
      success: true,
      message: 'Service job registered successfully',
      data: newJob,
      warning
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get Today's Vehicles / Active Jobs
exports.getTodayJobs = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const jobs = await WashJob.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    })
      .populate('customerId', 'name nameMalayalam mobile place')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

// 4. Get Wash Jobs (paginated, filtered, searchable)
exports.getWashJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status, paymentStatus, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      if (['waiting', 'in-service', 'completed', 'cancelled'].includes(status)) {
        filter.serviceStatus = status;
      } else {
        filter.status = status;
      }
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      const normalizedSearch = normalizeReg(search);
      filter.$or = [
        { vehicleReg: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } }
      ];
      if (normalizedSearch) {
        filter.$or.push({ vehicleReg: { $regex: normalizedSearch, $options: 'i' } });
      }
    }

    const total = await WashJob.countDocuments(filter);
    const jobs = await WashJob.find(filter)
      .populate('customerId', 'name nameMalayalam mobile place')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// 5. Get Single Wash Job by ID
exports.getWashJobById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    const job = await WashJob.findById(req.params.id)
      .populate('customerId', 'name nameMalayalam mobile email address place')
      .populate('createdBy', 'name');

    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    // Get any payment transactions on this job
    const payments = await Payment.find({ jobId: job._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        job,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
};

// 6. Update Wash Job details / status / payments
exports.updateWashJob = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id).populate('customerId', 'name mobile');
    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    const oldStatus = job.status;
    const oldBay = job.bayNumber;

    const {
      status,
      assignedStaff,
      waterUsedLitres,
      bayNumber,
      notes,
      discount,
      additionalCharge,
      amountPaid
    } = req.body;

    if (status !== undefined) job.status = status;
    if (assignedStaff !== undefined) job.assignedStaff = assignedStaff;
    if (waterUsedLitres !== undefined) job.waterUsedLitres = parseFloat(waterUsedLitres) || 0;
    if (bayNumber !== undefined) job.bayNumber = bayNumber ? parseInt(bayNumber) : null;
    if (notes !== undefined) job.notes = notes;

    if (discount !== undefined) job.discount = Math.max(0, parseFloat(discount) || 0);
    if (additionalCharge !== undefined) job.additionalCharge = Math.max(0, parseFloat(additionalCharge) || 0);
    if (amountPaid !== undefined) job.amountPaid = Math.max(0, parseFloat(amountPaid) || 0);

    // Timestamps
    if (status === 'washing' && oldStatus !== 'washing') {
      job.startTime = new Date();
    }
    if (['delivered', 'completed'].includes(status) && !['delivered', 'completed'].includes(oldStatus)) {
      job.endTime = new Date();
      job.completedDate = new Date();
    }

    await job.save(); // Pre-save recalculates finalAmount, balance, paymentStatus, and serviceStatus safely

    // Queue auto-advance when bay freed
    const io = req.app.get('io');
    const isFreed = ['ready', 'delivered', 'completed', 'cancelled'].includes(job.status) &&
                    !['ready', 'delivered', 'completed', 'cancelled'].includes(oldStatus);

    if (isFreed && oldBay) {
      await autoAdvanceQueue(oldBay, io);
    }

    await broadcastQueueUpdate(req);

    if (io) {
      io.to('queue').emit('job:statusChange', {
        tokenNumber: job.tokenNumber,
        vehicleReg: job.vehicleReg,
        status: job.status,
        message: `Vehicle ${job.vehicleReg} status changed from ${oldStatus} to ${job.status}.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service Job updated successfully',
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// 7. Quick Status Update (Mark Complete, In-Service, Cancelled)
exports.quickUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const job = await WashJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    const oldStatus = job.status;
    const oldBay = job.bayNumber;

    job.status = status;
    if (['completed', 'delivered'].includes(status)) {
      job.endTime = new Date();
      job.completedDate = new Date();
    } else if (['in-service', 'washing'].includes(status) && !job.startTime) {
      job.startTime = new Date();
    }

    await job.save();

    const isFreed = ['ready', 'delivered', 'completed', 'cancelled'].includes(status) &&
                    !['ready', 'delivered', 'completed', 'cancelled'].includes(oldStatus);
    const io = req.app.get('io');
    if (isFreed && oldBay) {
      await autoAdvanceQueue(oldBay, io);
    }
    await broadcastQueueUpdate(req);

    res.status(200).json({
      success: true,
      message: `Job status updated to ${job.serviceStatus || status}`,
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// 8. Add photos
exports.addPhotos = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
    job.photos = job.photos.concat(fileUrls);
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// 9. Delete Wash Job
exports.deleteWashJob = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Service Job not found' });
    }

    const bay = job.bayNumber;
    await job.deleteOne();

    const io = req.app.get('io');
    if (['in-bay', 'washing', 'drying', 'in-service'].includes(job.status) && bay) {
      await autoAdvanceQueue(bay, io);
    }

    await broadcastQueueUpdate(req);

    res.status(200).json({
      success: true,
      message: 'Service Job deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
