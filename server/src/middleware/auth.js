const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
};

const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check cookies first
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies.accessToken;
    }

    // Fallback to Bearer token
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Filter out missing or stringified falsy tokens
    if (!token || token === 'null' || token === 'undefined' || token === '""') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token missing',
        code: 401
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      if (!res.headersSent) {
        res.setHeader('Set-Cookie', [
          'accessToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'refreshToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        ]);
      }
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token invalid or expired',
        code: 401
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, invalid token payload',
        code: 401
      });
    }

    // Check MongoDB connection readiness
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection temporarily unavailable',
        code: 503
      });
    }

    // Get user from DB
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account deactivated',
        code: 401
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error.message);
    
    if (!res.headersSent) {
      res.setHeader('Set-Cookie', [
        'accessToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'refreshToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
    }

    return res.status(401).json({
      success: false,
      error: 'Not authorized, authentication failed',
      code: 401
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
        code: 403
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
  parseCookies
};
