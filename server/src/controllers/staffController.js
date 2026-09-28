const Staff = require('../models/Staff');
const WashJob = require('../models/WashJob');
const Settings = require('../models/Settings');
const PDFDocument = require('pdfkit');

// Get list of staff
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({});
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single staff member
const getStaffById = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found', code: 404 });
    }
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create staff
const createStaff = async (req, res) => {
  try {
    const { name, mobile, role, skills, salary, joiningDate, commissionRate } = req.body;

    if (!name || !mobile || !role || salary === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, mobile, role, and salary are required',
        code: 400
      });
    }

    const existing = await Staff.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Staff member with this mobile already exists',
        code: 400
      });
    }

    const member = await Staff.create({
      name,
      mobile,
      role,
      skills: skills || [],
      salary,
      joiningDate,
      commissionRate: commissionRate || 0,
      attendance: []
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update staff
const updateStaff = async (req, res) => {
  try {
    const { name, mobile, role, skills, salary, isActive, commissionRate } = req.body;
    const member = await Staff.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found', code: 404 });
    }

    if (mobile && mobile !== member.mobile) {
      const existing = await Staff.findOne({ mobile });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Staff member with this mobile already exists',
          code: 400
        });
      }
      member.mobile = mobile;
    }

    if (name) member.name = name;
    if (role) member.role = role;
    if (skills) member.skills = skills;
    if (salary !== undefined) member.salary = salary;
    if (isActive !== undefined) member.isActive = isActive;
    if (commissionRate !== undefined) member.commissionRate = commissionRate;

    await member.save();
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Mark Attendance
const markAttendance = async (req, res) => {
  try {
    const { date, status, checkIn, checkOut } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        error: 'Date and status (present/absent/half-day/leave) are required',
        code: 400
      });
    }

    const member = await Staff.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found', code: 404 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0,0,0,0);

    // Check if attendance already logged for this date
    const existingIndex = member.attendance.findIndex(
      att => new Date(att.date).getTime() === attendanceDate.getTime()
    );

    const logEntry = {
      date: attendanceDate,
      status,
      checkIn: checkIn || null,
      checkOut: checkOut || null
    };

    if (existingIndex !== -1) {
      member.attendance[existingIndex] = logEntry;
    } else {
      member.attendance.push(logEntry);
    }

    await member.save();
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get mechanic workload details (for charts)
const getMechanicWorkload = async (req, res) => {
  try {
    const mechanics = await Staff.find({ role: 'mechanic', isActive: true });
    
    const workload = [];
    for (const mechanic of mechanics) {
      const activeJobsCount = await WashJob.countDocuments({
        assignedStaff: mechanic.name,
        status: { $nin: ['delivered', 'cancelled'] }
      });

      workload.push({
        mechanicId: mechanic._id,
        name: mechanic.name,
        activeJobs: activeJobsCount
      });
    }

    res.status(200).json({ success: true, data: workload });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Generate salary slip PDF with commission
const generateSalarySlip = async (req, res) => {
  try {
    const { year, month } = req.query; // e.g. 2026, 5 (June is 5, July is 6)
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and Month query parameters are required',
        code: 400
      });
    }

    const member = await Staff.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found', code: 404 });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Set date bounds for the month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999);

    // Compute Attendance summary
    let present = 0, absent = 0, halfDay = 0, leave = 0;
    member.attendance.forEach(att => {
      const d = new Date(att.date);
      if (d >= startOfMonth && d <= endOfMonth) {
        if (att.status === 'present') present++;
        else if (att.status === 'absent') absent++;
        else if (att.status === 'half-day') halfDay++;
        else if (att.status === 'leave') leave++;
      }
    });

    // Compute commission: completed jobs assigned within this month
     const completedJobs = await WashJob.find({
      assignedStaff: member.name,
      status: 'delivered',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
     });

    let commissionEarned = 0;
    completedJobs.forEach(job => {
      commissionEarned += job.price * (member.commissionRate / 100);
    });

    const netSalary = member.salary + commissionEarned;

    // Generate PDF Slip
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary_${member.name}_${year}_${month}.pdf`);
    doc.pipe(res);

    // Header
    doc.fillColor('#1e293b').fontSize(20).text(settings.stationName, 50, 50);
    doc.fontSize(10).fillColor('#64748b').text('MONTHLY SALARY SLIP');
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 90).lineTo(550, 90).stroke();

    // Employee & Period Details
    doc.fillColor('#1e293b').fontSize(11).text('Employee Details', 50, 110, { underline: true });
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Name: ${member.name}`);
    doc.text(`Mobile: ${member.mobile}`);
    doc.text(`Role: ${member.role.toUpperCase()}`);

    doc.fillColor('#1e293b').fontSize(11).text('Pay Period', 300, 110, { underline: true });
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Month/Year: ${parseInt(month) + 1}/${year}`, 300, 130);
    doc.text(`Base Salary: Rs. ${member.salary.toFixed(2)}`, 300, 145);
    doc.text(`Commission Rate: ${member.commissionRate}%`, 300, 160);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 190).lineTo(550, 190).stroke();

    // Attendance Summary
    doc.fillColor('#1e293b').fontSize(11).text('Attendance Summary', 50, 210);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Present Days: ${present}`, 50, 230);
    doc.text(`Half Days: ${halfDay}`, 50, 245);
    doc.text(`Leave Days: ${leave}`, 50, 260);
    doc.text(`Absent Days: ${absent}`, 50, 275);

    // Earnings Breakdowns
    doc.fillColor('#1e293b').fontSize(11).text('Earnings & Deductions', 300, 210);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Basic Salary: Rs. ${member.salary.toFixed(2)}`, 300, 230);
    doc.text(`Commissions: Rs. ${commissionEarned.toFixed(2)}`, 300, 245);
    doc.text(`Total completed jobs: ${completedJobs.length}`, 300, 260);
    doc.fillColor('#1e293b').fontSize(12).text(`Net Salary Payable: Rs. ${netSalary.toFixed(2)}`, 300, 285, { bold: true });

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 320).lineTo(550, 320).stroke();
    doc.fontSize(9).fillColor('#94a3b8').text('This is a system generated salary receipt.', 50, 400, { align: 'center' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message, code: 500 });
    }
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Staff member not found', code: 404 });
    }

    await Staff.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  markAttendance,
  getMechanicWorkload,
  generateSalarySlip,
  deleteStaff
};
