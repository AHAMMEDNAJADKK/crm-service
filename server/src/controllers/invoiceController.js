const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceNotification } = require('../services/notificationService');

// Get list of invoices
const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const paymentStatus = req.query.paymentStatus || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      const customers = await Customer.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerId: { $in: customers.map(c => c._id) } }
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customerId', 'name mobile email')
      .populate('washJobId', 'tokenNumber washPackage')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: invoices,
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

// Get single invoice
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name mobile email address')
      .populate({
        path: 'washJobId'
      });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found', code: 404 });
    }

    // Calculate remaining balance helper
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, invoice.grandTotal - totalPaid);

    res.status(200).json({
      success: true,
      data: {
        invoice,
        totalPaid,
        balance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Create manual invoice
const createManualInvoice = async (req, res) => {
  try {
    const { customerId, lineItems, discount, dueDate } = req.body;

    if (!customerId || !lineItems || lineItems.length === 0 || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID, line items, and due date are required',
        code: 400
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    let subTotal = 0;
    const validatedItems = lineItems.map(item => {
      const itemTotal = item.qty * item.unitPrice;
      subTotal += itemTotal;
      return {
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: itemTotal
      };
    });

    const taxRate = settings.gstRate || 18;
    const taxAmount = parseFloat((subTotal * (taxRate / 100)).toFixed(2));
    const discountVal = discount || 0;
    const grandTotal = parseFloat((subTotal + taxAmount - discountVal).toFixed(2));

    const invoice = await Invoice.create({
      customerId,
      lineItems: validatedItems,
      subTotal,
      taxRate,
      taxAmount,
      discount: discountVal,
      grandTotal,
      dueDate,
      paymentStatus: 'unpaid',
      payments: []
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Edit invoice line items
const updateInvoiceLineItems = async (req, res) => {
  try {
    const { lineItems, discount, dueDate } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found', code: 404 });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit line items of a fully paid invoice',
        code: 400
      });
    }

    if (lineItems) {
      let subTotal = 0;
      const validatedItems = lineItems.map(item => {
        const itemTotal = item.qty * item.unitPrice;
        subTotal += itemTotal;
        return {
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: itemTotal
        };
      });

      invoice.lineItems = validatedItems;
      invoice.subTotal = subTotal;
      invoice.taxAmount = parseFloat((subTotal * (invoice.taxRate / 100)).toFixed(2));
    }

    if (discount !== undefined) {
      invoice.discount = discount;
    }

    if (dueDate) {
      invoice.dueDate = dueDate;
    }

    invoice.grandTotal = parseFloat((invoice.subTotal + invoice.taxAmount - invoice.discount).toFixed(2));

    // Recheck status based on payments
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= invoice.grandTotal) {
      invoice.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      invoice.paymentStatus = 'partial';
    } else {
      invoice.paymentStatus = 'unpaid';
    }

    await invoice.save();
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Record invoice payment
const recordInvoicePayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body;

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount and method are required',
        code: 400
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found', code: 404 });
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, invoice.grandTotal - totalPaid);

    if (balance <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already fully paid',
        code: 400
      });
    }

    const paymentAmount = Math.min(amount, balance); // Cannot overpay
    invoice.payments.push({
      amount: paymentAmount,
      method,
      note,
      date: new Date()
    });

    const newTotalPaid = totalPaid + paymentAmount;
    const newBalance = Math.max(0, invoice.grandTotal - newTotalPaid);

    if (newBalance <= 0) {
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }

    await invoice.save();

    // Trigger SMS/Email notice
    const customer = await Customer.findById(invoice.customerId);
    if (customer) {
      // Send notification asynchronously
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      const pdfBuffer = await generateInvoicePDF(invoice, customer, settings);
      
      await sendInvoiceNotification({
        customerName: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.grandTotal,
        balance: newBalance,
        pdfBuffer
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice,
        balance: newBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Generate and download Invoice PDF
const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found', code: 404 });
    }

    const customer = await Customer.findById(invoice.customerId);
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const pdfBuffer = await generateInvoicePDF(invoice, customer, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

// Generate and email Invoice PDF
const emailInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found', code: 404 });
    }

    const customer = await Customer.findById(invoice.customerId);
    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email address is not configured',
        code: 400
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const pdfBuffer = await generateInvoicePDF(invoice, customer, settings);
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, invoice.grandTotal - totalPaid);

    const sent = await sendInvoiceNotification({
      customerName: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.grandTotal,
      balance,
      pdfBuffer
    });

    if (sent) {
      res.status(200).json({ success: true, message: 'Invoice email sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send invoice email', code: 500 });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createManualInvoice,
  updateInvoiceLineItems,
  recordInvoicePayment,
  downloadInvoicePDF,
  emailInvoicePDF
};
