const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/db');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const initQueueSocket = require('./sockets/queueSocket');
const { initBusinessDefaults } = require('./config/initBusinessDefaults');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with production-safe CORS & transports
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store socket instance on app for controllers access
app.set('io', io);

// Initialize Socket.io rooms & event listeners
initQueueSocket(io);

// Connect Database & initialize defaults for AHAMMED SONS WATER SERVICE
connectDB().then(() => {
  initBusinessDefaults();
});

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Production security and optimization middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows assets and maps to load cleanly
}));
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files statically (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', business: 'AHAMMED SONS WATER SERVICE', uptime: process.uptime() });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const washJobRoutes = require('./routes/washJobRoutes');
const servicePackageRoutes = require('./routes/servicePackageRoutes');
const vehicleTypeRoutes = require('./routes/vehicleTypeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const fuelLogRoutes = require('./routes/fuelLogRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const publicRoutes = require('./routes/publicRoutes');

// API Version prefixing
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/customers', customerRoutes);
app.use('/api/v1/admin/vehicles', vehicleRoutes);
app.use('/api/v1/admin/jobs', washJobRoutes);
app.use('/api/v1/admin/services', servicePackageRoutes);
app.use('/api/v1/admin/vehicle-types', vehicleTypeRoutes);
app.use('/api/v1/admin/payments', paymentRoutes);
app.use('/api/v1/admin/invoices', invoiceRoutes);
app.use('/api/v1/admin/inventory', inventoryRoutes);
app.use('/api/v1/admin/appointments', appointmentRoutes);
app.use('/api/v1/admin/staff', staffRoutes);
app.use('/api/v1/admin/expenses', expenseRoutes);
app.use('/api/v1/admin/fuel-logs', fuelLogRoutes);
app.use('/api/v1/admin/reports', reportRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/admin/ledger', ledgerRoutes);
app.use('/api/v1/public', publicRoutes);

// In production, serve the built React static files if SERVE_CLIENT flag is true
if (process.env.SERVE_CLIENT === 'true') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Fallback Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route not found: ${req.baseUrl}`,
    code: 404
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 AHAMMED SONS WATER SERVICE Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, server };
