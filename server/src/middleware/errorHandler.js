const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  const code = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ Error [${req.method} ${req.url}]:`, err);

  res.status(code).json({
    success: false,
    error: message,
    code,
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
