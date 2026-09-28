const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const WashJob = require('../models/WashJob');
const Invoice = require('../models/Invoice');

// List customers with search, sort, and pagination
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
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
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Get single customer details
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found', code: 404 });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create a customer
const createCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, notes } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Name and mobile number are required',
        code: 400
      });
    }

    // Check if mobile already exists
    const existing = await Customer.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A customer with this mobile number already exists',
        code: 400
      });
    }

    const customer = await Customer.create({ name, mobile, email, address, notes });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Update customer details
const updateCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, notes } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found', code: 404 });
    }

    if (mobile && mobile !== customer.mobile) {
      const existing = await Customer.findOne({ mobile });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this mobile number already exists',
          code: 400
        });
      }
      customer.mobile = mobile;
    }

    if (name) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found', code: 404 });
    }

    // Check if customer has associated vehicles or open jobs before deleting or proceed.
    // In production, we soft delete or cascade. Let's delete the customer:
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Customer Profile details (vehicles, job history, invoices, spend)
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found', code: 404 });
    }

    // Fetch vehicles
    const vehicles = await Vehicle.find({ customerId: customer._id });

    // Fetch jobs
    const jobCards = await WashJob.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Fetch invoices
    const invoices = await Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Calculate total spend (collected from paid and partial invoices)
    let totalSpend = 0;
    invoices.forEach(inv => {
      if (inv.paymentStatus === 'paid') {
        totalSpend += inv.grandTotal;
      } else if (inv.paymentStatus === 'partial') {
        // sum amounts paid
        totalSpend += inv.payments.reduce((sum, p) => sum + p.amount, 0);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        customer,
        vehicles,
        jobCards,
        invoices,
        totalSpend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProfile
};
