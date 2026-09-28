const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const WashJob = require('../models/WashJob');
const WashPackagePrice = require('../models/WashPackagePrice');
const { assignBayOrQueue, getQueueStatus } = require('../services/queueService');
const Settings = require('../models/Settings');
const { sendAppointmentConfirmation } = require('../services/notificationService');

// Get list of appointments
const getAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Larger limit for calendar integrations
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'preferredDate';
    const order = req.query.order === 'desc' ? -1 : 1;

    let query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { vehicleReg: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single appointment
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', code: 404 });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Check slot availability helper
const isSlotAvailable = async (preferredDate, preferredTime) => {
  const dateObj = new Date(preferredDate);
  dateObj.setHours(0, 0, 0, 0);

  // Default max capacity per slot is 3
  const maxCapacity = 3;

  const count = await Appointment.countDocuments({
    preferredDate: dateObj,
    preferredTime,
    status: { $nin: ['cancelled'] }
  });

  return count < maxCapacity;
};

// Create appointment (handles both online public bookings and admin bookings)
const createAppointment = async (req, res) => {
  try {
    const { customerName, mobile, vehicleReg, vehicleType, washPackage, preferredDate, preferredTime, notes, source } = req.body;

    if (!customerName || !mobile || !vehicleReg || !vehicleType || !washPackage || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, mobile, vehicle registration, type, package, date, and time slot are required',
        code: 400
      });
    }

    // Validate slot availability
    const available = await isSlotAvailable(preferredDate, preferredTime);
    if (!available) {
      return res.status(400).json({
        success: false,
        error: `The slot at ${preferredTime} on ${new Date(preferredDate).toLocaleDateString()} is fully booked. Please choose another date/time.`,
        code: 400
      });
    }

    const dateObj = new Date(preferredDate);
    dateObj.setHours(0,0,0,0);

    const appointment = await Appointment.create({
      customerName,
      mobile,
      vehicleReg: vehicleReg.toUpperCase().trim(),
      vehicleType,
      washPackage,
      preferredDate: dateObj,
      preferredTime,
      notes,
      source: source || 'online',
      status: 'pending'
    });

    // Send confirmation SMS asynchronously
    await sendAppointmentConfirmation({
      customerName,
      mobile,
      vehicleReg: vehicleReg.toUpperCase().trim(),
      date: dateObj.toLocaleDateString(),
      time: preferredTime
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update appointment details / reschedule
const updateAppointment = async (req, res) => {
  try {
    const { customerName, mobile, vehicleReg, vehicleType, washPackage, preferredDate, preferredTime, notes, status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', code: 404 });
    }

    // Validate slot availability if rescheduled
    if ((preferredDate && new Date(preferredDate).getTime() !== new Date(appointment.preferredDate).getTime()) || 
        (preferredTime && preferredTime !== appointment.preferredTime)) {
      
      const checkDate = preferredDate || appointment.preferredDate;
      const checkTime = preferredTime || appointment.preferredTime;
      const available = await isSlotAvailable(checkDate, checkTime);
      if (!available) {
        return res.status(400).json({
          success: false,
          error: 'The requested rescheduled slot is fully booked.',
          code: 400
        });
      }

      if (preferredDate) {
        const dateObj = new Date(preferredDate);
        dateObj.setHours(0,0,0,0);
        appointment.preferredDate = dateObj;
      }
      if (preferredTime) appointment.preferredTime = preferredTime;
    }

    if (customerName) appointment.customerName = customerName;
    if (mobile) appointment.mobile = mobile;
    if (vehicleReg) appointment.vehicleReg = vehicleReg.toUpperCase().trim();
    if (vehicleType) appointment.vehicleType = vehicleType;
    if (washPackage) appointment.washPackage = washPackage;
    if (notes !== undefined) appointment.notes = notes;

    // Send notifications if status changed
    if (status && status !== appointment.status) {
      appointment.status = status;
      
      const dateStr = new Date(appointment.preferredDate).toLocaleDateString();
      await sendAppointmentConfirmation({
        customerName: appointment.customerName,
        mobile: appointment.mobile,
        vehicleReg: appointment.vehicleReg,
        date: `${dateStr} (${status.toUpperCase()})`,
        time: appointment.preferredTime
      });
    }

    await appointment.save();
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Convert confirmed appointment to wash job
const convertToJobCard = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', code: 404 });
    }

    // Check if customer exists in the system
    let customer = await Customer.findOne({ mobile: appointment.mobile });
    if (!customer) {
      customer = await Customer.create({
        name: appointment.customerName,
        mobile: appointment.mobile,
        email: '',
        address: '',
        notes: 'Created via appointment conversion'
      });
    }

    // Check if vehicle exists in the system
    let vehicle = await Vehicle.findOne({ regNumber: appointment.vehicleReg });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        customerId: customer._id,
        regNumber: appointment.vehicleReg,
        make: 'Unknown',
        model: 'Unknown',
        year: new Date().getFullYear(),
        fuelType: 'petrol',
        engineCC: 1000,
        notes: 'Created via appointment conversion'
      });
    }

    // Look up price in pricing matrix
    let finalPrice = 150;
    const priceDoc = await WashPackagePrice.findOne({
      vehicleType: appointment.vehicleType || 'car',
      washPackage: appointment.washPackage || 'basic'
    });
    if (priceDoc) {
      finalPrice = priceDoc.price;
    }

    // Create Wash Job
    const washJob = new WashJob({
      vehicleReg: appointment.vehicleReg,
      vehicleType: appointment.vehicleType || 'car',
      customerId: customer._id,
      washPackage: appointment.washPackage || 'basic',
      price: finalPrice,
      assignedStaff: 'Unassigned',
      notes: appointment.notes || 'Converted from appointment'
    });

    await assignBayOrQueue(washJob);
    await washJob.save();

    // Update appointment status to completed
    appointment.status = 'completed';
    await appointment.save();

    // Emit live Queue updates
    const io = req.app.get('io');
    if (io) {
      const queueStatus = await getQueueStatus();
      io.to('queue').emit('queue:update', queueStatus);
      io.to('queue').emit('job:statusChange', {
        tokenNumber: washJob.tokenNumber,
        vehicleReg: washJob.vehicleReg,
        status: washJob.status,
        message: `Appointment for ${washJob.vehicleReg} converted. Token: ${washJob.tokenNumber}.`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment successfully converted to active Wash Job',
      data: washJob
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found', code: 404 });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  convertToJobCard,
  deleteAppointment
};
