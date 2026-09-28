const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');
const User = require('../models/User');
const WashPackagePrice = require('../models/WashPackagePrice');
const VEHICLE_TYPES = require('../constants/vehicleTypes');
const WASH_PACKAGES = require('../constants/washPackages');

// Cache mapping for public pricing (5 min TTL)
const cache = new Map();
const CACHE_KEY = 'public_pricing';
const CACHE_TTL = 5 * 60 * 1000;

// Helper to seed defaults
const seedDefaultPrices = async () => {
  await WashPackagePrice.deleteMany({});
  const pricingMatrixData = [];
  
  VEHICLE_TYPES.forEach(vType => {
    let multiplier = 1;
    if (vType.category === 'light') multiplier = 0.8;
    if (vType.category === 'medium') multiplier = 1.8;
    if (vType.category === 'heavy') multiplier = 4.5;
    if (vType.category === 'special') multiplier = 10;

    WASH_PACKAGES.forEach(pkg => {
      let basePrice = 100;
      if (pkg.id === 'basic') basePrice = 100;
      if (pkg.id === 'full') basePrice = 180;
      if (pkg.id === 'interior') basePrice = 150;
      if (pkg.id === 'full-interior') basePrice = 280;
      if (pkg.id === 'engine') basePrice = 180;
      if (pkg.id === 'detail') basePrice = 450;

      // Skip engine wash for bicycle (marked as NA)
      const isNA = (vType.id === 'bicycle' && pkg.id === 'engine');

      pricingMatrixData.push({
        vehicleType: vType.id,
        washPackage: pkg.id,
        price: isNA ? null : Math.ceil(basePrice * multiplier),
        isNA
      });
    });
  });

  await WashPackagePrice.insertMany(pricingMatrixData);
  // Clear pricing cache
  cache.delete(CACHE_KEY);
  return pricingMatrixData;
};

// Get settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// Update settings
const updateSettings = async (req, res, next) => {
  try {
    const {
      stationName,
      address,
      mobile,
      email,
      gstNumber,
      googleMapsLink,
      activeBaysCount,
      gstRate,
      waterRatePerLitre,
      dailyCapacityPerSlot,
      workingHours,
      smsTemplates
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (stationName !== undefined) settings.stationName = stationName;
    if (address !== undefined) settings.address = address;
    if (mobile !== undefined) settings.mobile = mobile;
    if (email !== undefined) settings.email = email;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (googleMapsLink !== undefined) settings.googleMapsLink = googleMapsLink;
    if (activeBaysCount !== undefined) settings.activeBaysCount = parseInt(activeBaysCount) || 3;
    if (gstRate !== undefined) settings.gstRate = parseFloat(gstRate) || 0;
    if (waterRatePerLitre !== undefined) settings.waterRatePerLitre = parseFloat(waterRatePerLitre) || 0;
    if (dailyCapacityPerSlot !== undefined) settings.dailyCapacityPerSlot = parseInt(dailyCapacityPerSlot) || 5;
    
    if (workingHours) {
      settings.workingHours = {
        opensAt: workingHours.opensAt || settings.workingHours.opensAt,
        closesAt: workingHours.closesAt || settings.workingHours.closesAt,
        daysOpen: workingHours.daysOpen || settings.workingHours.daysOpen
      };
    }

    if (smsTemplates) {
      settings.smsTemplates = {
        ...settings.smsTemplates,
        ...smsTemplates
      };
    }

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/settings/pricing
const getPricingMatrix = async (req, res, next) => {
  try {
    let dbPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    if (dbPrices.length === 0) {
      await seedDefaultPrices();
      dbPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    }
    const latestDoc = await WashPackagePrice.findOne().sort({ updatedAt: -1 });
    const lastSaved = latestDoc ? latestDoc.updatedAt : null;
    
    res.status(200).json({
      success: true,
      data: dbPrices,
      lastSaved
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/pricing
const updatePricingMatrix = async (req, res, next) => {
  try {
    const { prices } = req.body;
    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({ success: false, error: 'prices array is required', code: 400 });
    }

    const validVehicleTypes = VEHICLE_TYPES.map(v => v.id);
    const validPackages = WASH_PACKAGES.map(p => p.id);

    const bulkOps = [];
    for (const p of prices) {
      if (!validVehicleTypes.includes(p.vehicleType) || !validPackages.includes(p.washPackage)) {
        return res.status(400).json({
          success: false,
          error: `Invalid vehicleType (${p.vehicleType}) or washPackage (${p.washPackage})`,
          code: 400
        });
      }
      
      bulkOps.push({
        updateOne: {
          filter: { vehicleType: p.vehicleType, washPackage: p.washPackage },
          update: {
            price: p.isNA ? null : (parseFloat(p.price) !== undefined ? parseFloat(p.price) : 0),
            isNA: !!p.isNA
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await WashPackagePrice.bulkWrite(bulkOps);
    }

    // Invalidate public cache
    cache.delete(CACHE_KEY);

    const updatedPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    const latestDoc = await WashPackagePrice.findOne().sort({ updatedAt: -1 });
    const lastSaved = latestDoc ? latestDoc.updatedAt : null;

    res.status(200).json({
      success: true,
      data: updatedPrices,
      lastSaved
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/pricing/reset
const resetPricingMatrix = async (req, res, next) => {
  try {
    await seedDefaultPrices();
    const freshPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    const latestDoc = await WashPackagePrice.findOne().sort({ updatedAt: -1 });
    const lastSaved = latestDoc ? latestDoc.updatedAt : null;

    res.status(200).json({
      success: true,
      data: freshPrices,
      lastSaved
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/public/pricing (Public endpoint, cached)
const getPublicPricing = async (req, res, next) => {
  try {
    const now = Date.now();
    const cached = cache.get(CACHE_KEY);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        success: true,
        data: cached.data
      });
    }

    let dbPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    if (dbPrices.length === 0) {
      await seedDefaultPrices();
      dbPrices = await WashPackagePrice.find({}).sort({ vehicleType: 1, washPackage: 1 });
    }

    cache.set(CACHE_KEY, {
      timestamp: now,
      data: dbPrices
    });

    res.status(200).json({
      success: true,
      data: dbPrices
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/settings/logo
const uploadStationLogo = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No logo file uploaded', code: 400 });
    }

    // Delete existing logo file if any
    if (settings.logoPath && fs.existsSync(settings.logoPath)) {
      try {
        fs.unlinkSync(settings.logoPath);
      } catch (err) {
        console.error('Failed to unlink old logo:', err);
      }
    }

    // Make sure server/uploads/logo directory exists
    const ext = path.extname(req.file.originalname) || '.png';
    const uploadDir = path.join(__dirname, '../../uploads/logo');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fixedFilename = `station-logo${ext}`;
    const newPath = path.join(uploadDir, fixedFilename);
    const newUrl = `/uploads/logo/${fixedFilename}`;

    // Rename temp uploaded file
    fs.renameSync(req.file.path, newPath);

    settings.logoPath = newPath;
    settings.logoUrl = newUrl;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: newUrl
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/settings/logo
const deleteStationLogo = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (settings) {
      if (settings.logoPath && fs.existsSync(settings.logoPath)) {
        try {
          fs.unlinkSync(settings.logoPath);
        } catch (err) {
          console.error('Failed to delete logo file:', err);
        }
      }
      settings.logoPath = '';
      settings.logoUrl = '';
      await settings.save();
    }
    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/public/settings
const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne() || {};
    res.status(200).json({
      success: true,
      data: {
        stationName: settings.stationName || 'AquaClean Vehicle Service',
        logoUrl: settings.logoUrl || '',
        phone: settings.mobile || '',
        address: settings.address || '',
        gstNumber: settings.gstNumber || ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change Owner PIN
const changeOwnerPIN = async (req, res, next) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: 'Current PIN and New PIN are required',
        code: 400
      });
    }

    if (newPin.length !== 4 || isNaN(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN must be a 4-digit number',
        code: 400
      });
    }

    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      return res.status(404).json({ success: false, error: 'Owner account not found', code: 404 });
    }

    const isMatch = await owner.comparePIN(currentPin);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect current PIN', code: 401 });
    }

    owner.passwordHash = newPin;
    await owner.save();

    res.status(200).json({ success: true, message: 'Owner PIN updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getPricingMatrix,
  updatePricingMatrix,
  resetPricingMatrix,
  getPublicPricing,
  uploadStationLogo,
  deleteStationLogo,
  getPublicSettings,
  changeOwnerPIN
};
