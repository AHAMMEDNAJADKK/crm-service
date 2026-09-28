const WashJob = require('../models/WashJob');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Invoice = require('../models/Invoice');
const Settings = require('../models/Settings');
const WashPackagePrice = require('../models/WashPackagePrice');
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

// 1. Create Wash Job (walk-in optimization)
exports.createWashJob = async (req, res, next) => {
  try {
    const {
      vehicleReg,
      vehicleType,
      washPackage,
      customerName,
      customerMobile,
      assignedStaff,
      notes,
      priceOverride
    } = req.body;

    if (!vehicleReg || !vehicleType || !washPackage) {
      return res.status(400).json({ success: false, error: 'vehicleReg, vehicleType, and washPackage are required' });
    }

    const regUpper = vehicleReg.toUpperCase().trim();

    // Find or create customer if mobile is provided
    let customerId = null;
    if (customerMobile) {
      let cust = await Customer.findOne({ mobile: customerMobile });
      if (!cust) {
        cust = await Customer.create({
          name: customerName || 'Walk-in Customer',
          mobile: customerMobile
        });
      }
      customerId = cust._id;
    }

    // Find or create vehicle
    let veh = await Vehicle.findOne({ regNumber: regUpper });
    if (!veh) {
      veh = await Vehicle.create({
        regNumber: regUpper,
        vehicleType,
        customerId
      });
    } else if (customerId && !veh.customerId) {
      // Link owner if not already linked
      veh.customerId = customerId;
      await veh.save();
    }

    // Determine price: check 2D pricing matrix in DB, fallback to default seed
    let finalPrice = 150; // Generic fallback
    const priceDoc = await WashPackagePrice.findOne({ vehicleType, washPackage });
    if (priceDoc) {
      finalPrice = priceDoc.price;
    }
    // Allow custom override
    if (priceOverride !== undefined && priceOverride !== null) {
      finalPrice = parseFloat(priceOverride);
    }

    const newJob = new WashJob({
      vehicleReg: regUpper,
      vehicleType,
      customerId,
      washPackage,
      price: finalPrice,
      assignedStaff: assignedStaff || 'Unassigned',
      notes
    });

    // Invoke Queue Service to allocate free bay or insert into FIFO queue
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

    // Broadcast queue updates to connected screens
    await broadcastQueueUpdate(req);

    // Broadcast status change message
    const io = req.app.get('io');
    if (io) {
      io.to('queue').emit('job:statusChange', {
        tokenNumber: newJob.tokenNumber,
        vehicleReg: newJob.vehicleReg,
        status: newJob.status,
        message: `New wash logged for vehicle ${newJob.vehicleReg}. Assigned Token: ${newJob.tokenNumber}.`
      });
    }

    // Send SMS confirmation template
    const settings = await Settings.findOne() || {};
    if (customerMobile && settings.smsTemplates?.appointmentConfirmed) {
      let smsText = settings.smsTemplates.appointmentConfirmed
        .replace('{customerName}', customerName || 'Valued Customer')
        .replace('{vehicleReg}', regUpper)
        .replace('{date}', new Date().toLocaleDateString('en-IN'))
        .replace('{time}', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      await sendSMS(customerMobile, smsText);
    }

    let warning = null;
    if (priceDoc && priceDoc.isNA) {
      warning = "Selected wash package is marked as Not Applicable for this vehicle type.";
    }

    res.status(201).json({
      success: true,
      message: 'Wash Job created successfully',
      data: newJob,
      warning
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get Wash Jobs (paginated, filtered, searchable)
exports.getWashJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { vehicleReg: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await WashJob.find(filter)
      .populate('customerId', 'name mobile')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await WashJob.countDocuments(filter);

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

// 3. Get Single Wash Job by ID
exports.getWashJobById = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id).populate('customerId', 'name mobile email address');
    if (!job) {
      return res.status(404).json({ success: false, error: 'Wash Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// 4. Update Wash Job status / details
exports.updateWashJob = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id).populate('customerId', 'name mobile');
    if (!job) {
      return res.status(404).json({ success: false, error: 'Wash Job not found' });
    }

    const oldStatus = job.status;
    const oldBay = job.bayNumber;

    const {
      status,
      assignedStaff,
      waterUsedLitres,
      bayNumber,
      notes,
      paymentStatus,
      paymentMethod
    } = req.body;

    if (status !== undefined) job.status = status;
    if (assignedStaff !== undefined) job.assignedStaff = assignedStaff;
    if (waterUsedLitres !== undefined) job.waterUsedLitres = parseFloat(waterUsedLitres) || 0;
    if (bayNumber !== undefined) job.bayNumber = bayNumber ? parseInt(bayNumber) : null;
    if (notes !== undefined) job.notes = notes;
    if (paymentStatus !== undefined) job.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) job.paymentMethod = paymentMethod;

    // Track status transitions timestamps
    if (status === 'washing' && oldStatus !== 'washing') {
      job.startTime = new Date();
    }
    if (status === 'delivered' && oldStatus !== 'delivered') {
      job.endTime = new Date();
    }

    await job.save();

    // Trigger auto-advance queue and broadcasts if bay is freed
    const io = req.app.get('io');
    const isFreed = ['ready', 'delivered', 'cancelled'].includes(status) && !['ready', 'delivered', 'cancelled'].includes(oldStatus);
    
    if (isFreed && oldBay) {
      // Vacate bay and pull next queued car
      await autoAdvanceQueue(oldBay, io);
    }

    // Broadcast status change updates
    await broadcastQueueUpdate(req);

    if (io) {
      io.to('queue').emit('job:statusChange', {
        tokenNumber: job.tokenNumber,
        vehicleReg: job.vehicleReg,
        status: job.status,
        message: `Vehicle ${job.vehicleReg} status changed from ${oldStatus} to ${job.status}.`
      });
    }

    // Twilio SMS alert on ready status
    const settings = await Settings.findOne() || {};
    if (status === 'ready' && oldStatus !== 'ready' && job.customerId?.mobile) {
      if (settings.smsTemplates?.washReady) {
        let smsText = settings.smsTemplates.washReady
          .replace('{vehicleReg}', job.vehicleReg)
          .replace('{tokenNumber}', job.tokenNumber)
          .replace('{amount}', job.price);
        await sendSMS(job.customerId.mobile, smsText);
      }
    }

    // Auto-create/update invoice if payment is updated to paid
    if (paymentStatus === 'paid' && job.paymentStatus === 'paid') {
      // Find or create invoice
      let invoice = await Invoice.findOne({ washJobId: job._id });
      if (!invoice) {
        const taxRate = settings.gstRate || 0;
        const taxAmount = parseFloat(((job.price * taxRate) / 100).toFixed(2));
        const grandTotal = parseFloat((job.price + taxAmount).toFixed(2));

        invoice = await Invoice.create({
          washJobId: job._id,
          customerId: job.customerId?._id || null,
          vehicleReg: job.vehicleReg,
          vehicleType: job.vehicleType,
          washPackage: job.washPackage,
          amount: job.price,
          taxRate,
          taxAmount,
          grandTotal,
          paymentStatus: 'paid',
          paymentMethod: paymentMethod || 'cash',
          paidAt: new Date()
        });

        // Add payment logs
        invoice.payments.push({
          amount: grandTotal,
          method: paymentMethod || 'cash',
          note: 'Automatic wash completion settlement'
        });
        await invoice.save();

        // Increment customer total spends
        if (job.customerId?._id) {
          await Customer.findByIdAndUpdate(job.customerId._id, {
            $inc: { totalSpend: grandTotal }
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Wash Job updated successfully',
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// 5. Add photo attachments
exports.addPhotos = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Wash Job not found' });
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

// 6. Delete Wash Job
exports.deleteWashJob = async (req, res, next) => {
  try {
    const job = await WashJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Wash Job not found' });
    }

    const bay = job.bayNumber;
    await job.deleteOne();

    // Auto advance if we deleted an active bay job
    const io = req.app.get('io');
    if (['in-bay', 'washing', 'drying'].includes(job.status) && bay) {
      await autoAdvanceQueue(bay, io);
    }

    await broadcastQueueUpdate(req);

    res.status(200).json({
      success: true,
      message: 'Wash Job deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
