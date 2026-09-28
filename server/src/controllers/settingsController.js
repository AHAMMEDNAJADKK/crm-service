const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');
const User = require('../models/User');
const WashPackagePrice = require('../models/WashPackagePrice');
const VehicleType = require('../models/VehicleType');
const ServicePackage = require('../models/ServicePackage');

// Get settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        stationName: 'AHAMMED SONS WATER SERVICE',
        tagline: 'Vehicle Washing, Cleaning & Underbody/Undercoating Services',
        address: 'Kozhikode, Kerala',
        mobile: '9539691738',
        email: 'contact@ahammedsons.com',
        logoUrl: '/uploads/logo/station-logo.jpg',
        logoPath: 'uploads/logo/station-logo.jpg'
      });
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
      tagline,
      address,
      mobile,
      alternatePhone,
      email,
      gstNumber,
      receiptFooter,
      googleMapsLink,
      activeBaysCount,
      gstRate,
      waterRatePerLitre,
      dailyCapacityPerSlot,
      workingHours,
      smsTemplates,
      expenseCategories,
      paymentMethods
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (stationName !== undefined) settings.stationName = stationName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (address !== undefined) settings.address = address;
    if (mobile !== undefined) settings.mobile = mobile;
    if (alternatePhone !== undefined) settings.alternatePhone = alternatePhone;
    if (email !== undefined) settings.email = email;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (receiptFooter !== undefined) settings.receiptFooter = receiptFooter;
    if (googleMapsLink !== undefined) settings.googleMapsLink = googleMapsLink;
    if (activeBaysCount !== undefined) settings.activeBaysCount = parseInt(activeBaysCount) || 3;
    if (gstRate !== undefined) settings.gstRate = parseFloat(gstRate) || 0;
    if (waterRatePerLitre !== undefined) settings.waterRatePerLitre = parseFloat(waterRatePerLitre) || 0;
    if (dailyCapacityPerSlot !== undefined) settings.dailyCapacityPerSlot = parseInt(dailyCapacityPerSlot) || 5;

    if (expenseCategories && Array.isArray(expenseCategories)) {
      settings.expenseCategories = expenseCategories;
    }

    if (paymentMethods && Array.isArray(paymentMethods)) {
      settings.paymentMethods = paymentMethods;
    }

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
// Returns full dynamic pricing matrix with vehicle types & service packages metadata
const getPricingMatrix = async (req, res, next) => {
  try {
    const [vehicleTypes, servicePackages, rawPrices] = await Promise.all([
      VehicleType.find({ isActive: true }).sort({ displayOrder: 1 }),
      ServicePackage.find({ isActive: true }).sort({ displayOrder: 1 }),
      WashPackagePrice.find({})
    ]);

    // Map existing prices into lookup map
    const priceMap = new Map();
    rawPrices.forEach(p => {
      priceMap.set(`${p.vehicleType}_${p.washPackage}`, p);
    });

    // Build complete matrix ensuring every cell exists
    const matrix = [];
    const missingDocs = [];

    vehicleTypes.forEach(vt => {
      servicePackages.forEach(sp => {
        const key = `${vt.code}_${sp.code}`;
        const existing = priceMap.get(key);
        if (existing) {
          matrix.push(existing);
        } else {
          const newDoc = {
            vehicleType: vt.code,
            washPackage: sp.code,
            price: sp.basePrice || 0,
            isNA: false
          };
          matrix.push(newDoc);
          missingDocs.push(newDoc);
        }
      });
    });

    if (missingDocs.length > 0) {
      try {
        await WashPackagePrice.insertMany(missingDocs, { ordered: false });
      } catch (insertErr) {
        // Ignore duplicate key race conditions
      }
    }

    const latestDoc = await WashPackagePrice.findOne().sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: matrix,
      vehicleTypes,
      servicePackages,
      lastSaved: latestDoc ? latestDoc.updatedAt : null
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

    const bulkOps = [];
    for (const p of prices) {
      if (!p.vehicleType || !p.washPackage) continue;

      const priceVal = (p.price === null || p.price === '' || isNaN(p.price))
        ? null
        : Math.max(0, parseFloat(p.price));

      bulkOps.push({
        updateOne: {
          filter: { vehicleType: p.vehicleType, washPackage: p.washPackage },
          update: {
            $set: {
              price: priceVal,
              isNA: Boolean(p.isNA)
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await WashPackagePrice.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: `Pricing matrix updated successfully (${bulkOps.length} pricing slots updated)`
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/pricing/reset
const resetPricingMatrix = async (req, res, next) => {
  try {
    const [vehicleTypes, servicePackages] = await Promise.all([
      VehicleType.find(),
      ServicePackage.find()
    ]);

    await WashPackagePrice.deleteMany({});
    const matrixDocs = [];
    for (const vt of vehicleTypes) {
      for (const sp of servicePackages) {
        matrixDocs.push({
          vehicleType: vt.code,
          washPackage: sp.code,
          price: sp.basePrice || 0,
          isNA: false
        });
      }
    }

    if (matrixDocs.length > 0) {
      await WashPackagePrice.insertMany(matrixDocs);
    }

    res.status(200).json({ success: true, message: 'Pricing matrix reset to defaults' });
  } catch (error) {
    next(error);
  }
};

// Upload station logo
const uploadStationLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    const relativePath = `/uploads/${req.file.filename}`;
    settings.logoUrl = relativePath;
    settings.logoPath = req.file.path;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoUrl: relativePath }
    });
  } catch (error) {
    next(error);
  }
};

// Delete station logo
const deleteStationLogo = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (settings) {
      settings.logoUrl = '';
      settings.logoPath = '';
      await settings.save();
    }
    res.status(200).json({ success: true, message: 'Logo removed' });
  } catch (error) {
    next(error);
  }
};

// Change Owner / Admin PIN
const changeOwnerPIN = async (req, res, next) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ success: false, error: 'Current PIN and new PIN are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePIN(currentPin);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current PIN is incorrect' });
    }

    user.passwordHash = newPin; // Hashes via pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Public Settings endpoint
const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        stationName: 'AHAMMED SONS WATER SERVICE',
        tagline: 'Vehicle Washing, Cleaning & Underbody/Undercoating Services',
        address: 'Kozhikode, Kerala',
        mobile: '9539691738',
        email: 'contact@ahammedsons.com',
        logoUrl: '/uploads/logo/station-logo.jpg'
      });
    }
    res.status(200).json({
      success: true,
      data: {
        stationName: settings.stationName,
        tagline: settings.tagline,
        address: settings.address,
        mobile: settings.mobile,
        alternatePhone: settings.alternatePhone,
        email: settings.email,
        logoUrl: settings.logoUrl,
        receiptFooter: settings.receiptFooter,
        workingHours: settings.workingHours
      }
    });
  } catch (error) {
    next(error);
  }
};

// Public Pricing endpoint (delegates to getPricingMatrix)
const getPublicPricing = getPricingMatrix;

module.exports = {
  getSettings,
  updateSettings,
  getPricingMatrix,
  updatePricingMatrix,
  resetPricingMatrix,
  uploadStationLogo,
  deleteStationLogo,
  changeOwnerPIN,
  getPublicSettings,
  getPublicPricing
};
