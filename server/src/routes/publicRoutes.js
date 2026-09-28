const express = require('express');
const router = express.Router();
const transporter = require('../config/mailer');
const WashJob = require('../models/WashJob');
const { createAppointment } = require('../controllers/appointmentController');
const { getPublicPricing, getPublicSettings } = require('../controllers/settingsController');
const { getQueueStatus } = require('../services/queueService');

// 1. Get Public Settings
router.get('/settings', getPublicSettings);

// 2. Get Pricing Matrix (Public, cached)
router.get('/pricing', getPublicPricing);

// 3. Book Appointment
router.post('/appointments', createAppointment);

// 4. Live Queue Display Board Status
router.get('/queue', async (req, res, next) => {
  try {
    const queueStatus = await getQueueStatus();
    res.status(200).json({ success: true, data: queueStatus });
  } catch (err) {
    next(err);
  }
});

// 5. Contact Form Submission
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, mobile, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required',
        code: 400
      });
    }

    const mailOptions = {
      from: `"AquaClean Contact" <${email}>`,
      to: process.env.SMTP_USER || 'owner@aquaclean.com',
      subject: `New Contact Request: ${subject || 'General Inquiry'}`,
      text: `Name: ${name}\nEmail: ${email}\nMobile: ${mobile || 'N/A'}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you shortly!'
    });
  } catch (error) {
    next(error);
  }
});

// 6. Track Wash Job Status (ref can be Token Number or Vehicle Registration Number)
router.get('/wash/track/:ref', async (req, res, next) => {
  try {
    const ref = req.params.ref.toUpperCase().trim();
    let job = null;

    if (ref.startsWith('TKN-')) {
      job = await WashJob.findOne({ tokenNumber: ref }).populate('customerId', 'name');
    } else {
      job = await WashJob.findOne({ vehicleReg: ref })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'No active wash job found for this reference',
        code: 404
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: job._id,
        tokenNumber: job.tokenNumber,
        vehicleReg: job.vehicleReg,
        vehicleType: job.vehicleType,
        washPackage: job.washPackage,
        price: job.price,
        status: job.status,
        bayNumber: job.bayNumber,
        assignedStaff: job.assignedStaff,
        waterUsedLitres: job.waterUsedLitres,
        startTime: job.startTime,
        endTime: job.endTime,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        customerName: job.customerId?.name || 'Walk-in Customer'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
