const jwt = require('jsonwebtoken');
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

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token missing',
        code: 401
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Get user from DB
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 401
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error.message);
    
    // Clear cookies if token is invalid or expired
    res.clearCookie && res.clearCookie('accessToken');
    res.clearCookie && res.clearCookie('refreshToken');
    
    res.setHeader('Set-Cookie', [
      'accessToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refreshToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);

    return res.status(401).json({
      success: false,
      error: 'Not authorized, token invalid or expired',
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
