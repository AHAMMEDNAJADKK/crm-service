const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const WashJob = require('../models/WashJob');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// List customers with search, sort, and pagination
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { nameMalayalam: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { alternateMobile: { $regex: search, $options: 'i' } },
          { place: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: customers,
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

// Search customer by mobile number (fast lookup for walk-in / new service flow)
const findByMobile = async (req, res, next) => {
  try {
    const mobile = (req.params.mobile || '').trim();
    if (!mobile) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    const customer = await Customer.findOne({
      $or: [
        { mobile: { $regex: mobile, $options: 'i' } },
        { alternateMobile: { $regex: mobile, $options: 'i' } }
      ]
    });

    if (!customer) {
      return res.status(200).json({ success: true, data: null, message: 'No customer found' });
    }

    // Also fetch their registered vehicles
    const vehicles = await Vehicle.find({ customerId: customer._id });

    res.status(200).json({
      success: true,
      data: {
        customer,
        vehicles
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single customer details
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// Create a customer
const createCustomer = async (req, res, next) => {
  try {
    const { name, nameMalayalam, mobile, alternateMobile, email, address, place, notes } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Name and mobile number are required'
      });
    }

    const cleanMobile = mobile.trim();

    // Check if mobile already exists
    const existing = await Customer.findOne({ mobile: cleanMobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A customer with this mobile number already exists',
        data: existing
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      nameMalayalam: (nameMalayalam || '').trim(),
      mobile: cleanMobile,
      alternateMobile: (alternateMobile || '').trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      place: (place || '').trim(),
      notes: (notes || '').trim()
    });

    res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
  } catch (error) {
    next(error);
  }
};

// Update customer details
const updateCustomer = async (req, res, next) => {
  try {
    const { name, nameMalayalam, mobile, alternateMobile, email, address, place, notes } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (mobile && mobile.trim() !== customer.mobile) {
      const existing = await Customer.findOne({ mobile: mobile.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this mobile number already exists'
        });
      }
      customer.mobile = mobile.trim();
    }

    if (name) customer.name = name.trim();
    if (nameMalayalam !== undefined) customer.nameMalayalam = nameMalayalam.trim();
    if (alternateMobile !== undefined) customer.alternateMobile = alternateMobile.trim();
    if (email !== undefined) customer.email = email.trim();
    if (address !== undefined) customer.address = address.trim();
    if (place !== undefined) customer.place = place.trim();
    if (notes !== undefined) customer.notes = notes.trim();

    await customer.save();
    res.status(200).json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete customer
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Customer Profile details (vehicles, job history, payments, outstanding balance)
const getCustomerProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Fetch vehicles
    const vehicles = await Vehicle.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Fetch service jobs
    const jobCards = await WashJob.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Fetch payment records
    const payments = await Payment.find({ customerId: customer._id }).sort({ date: -1 });

    // Calculate actual financial metrics
    let totalServiceValue = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    jobCards.forEach(job => {
      if (job.status !== 'cancelled') {
        const val = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
        const paid = job.amountPaid || 0;
        totalServiceValue += val;
        totalPaid += paid;
        outstandingBalance += Math.max(0, val - paid);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        customer,
        vehicles,
        jobCards,
        payments,
        stats: {
          totalVisits: jobCards.length,
          totalServiceValue,
          totalPaid,
          outstandingBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  findByMobile,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProfile
};
