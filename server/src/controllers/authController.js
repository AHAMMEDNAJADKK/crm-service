const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = env.NODE_ENV === 'production';
  
  // Access Token: 15 min
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  });

  // Refresh Token: 7 days
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const login = async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    if (!mobile || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and PIN are required',
        code: 400
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 401
      });
    }

    const isMatch = await user.comparePIN(pin);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 401
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        token: accessToken,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

const logout = async (req, res) => {
  try {
    const userMobile = req.user?.mobile;
    if (userMobile) {
      const user = await User.findOne({ mobile: userMobile });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Explicitly set cookie headers to delete in case browser ignores clearCookie
    res.setHeader('Set-Cookie', [
      'accessToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refreshToken=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

const refresh = async (req, res) => {
  try {
    let token = null;

    // Read cookie manually to be safe
    if (req.headers.cookie) {
      const { parseCookies } = require('../middleware/auth');
      const cookies = parseCookies(req.headers.cookie);
      token = cookies.refreshToken;
    // Also allow body fallback for cross-origin environments where cookies might be suppressed
    if (!token && req.body?.refreshToken) {
      token = req.body.refreshToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token missing',
        code: 401
      });
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 401
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Refresh token expired or invalid',
      code: 401
    });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
};

module.exports = {
  login,
  logout,
  refresh,
  getMe
};
