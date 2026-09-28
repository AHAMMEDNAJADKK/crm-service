const User = require('../models/User');
const Settings = require('../models/Settings');
const VehicleType = require('../models/VehicleType');
const ServicePackage = require('../models/ServicePackage');
const WashPackagePrice = require('../models/WashPackagePrice');

const DEFAULT_VEHICLE_TYPES = [
  { name: 'Bike', code: 'bike', category: 'light', icon: 'Bike', displayOrder: 1 },
  { name: 'Scooter', code: 'scooter', category: 'light', icon: 'Bike', displayOrder: 2 },
  { name: 'Auto', code: 'auto', category: 'light', icon: 'Car', displayOrder: 3 },
  { name: 'Hatchback', code: 'hatchback', category: 'medium', icon: 'Car', displayOrder: 4 },
  { name: 'Sedan', code: 'sedan', category: 'medium', icon: 'Car', displayOrder: 5 },
  { name: 'SUV', code: 'suv', category: 'medium', icon: 'Car', displayOrder: 6 },
  { name: 'MUV', code: 'muv', category: 'medium', icon: 'Car', displayOrder: 7 },
  { name: 'Pickup', code: 'pickup', category: 'heavy', icon: 'Truck', displayOrder: 8 },
  { name: 'Van', code: 'van', category: 'medium', icon: 'Truck', displayOrder: 9 },
  { name: 'Other', code: 'other', category: 'other', icon: 'Car', displayOrder: 10 }
];

const DEFAULT_SERVICES = [
  {
    name: 'Interior + Exterior Foam Wash',
    shortName: 'Foam Wash',
    code: 'interior-exterior-foam-wash',
    description: 'Complete high pressure foam wash with deep interior vacuuming and dashboard wipe',
    estimatedDuration: 45,
    displayOrder: 1,
    basePrice: 0
  },
  {
    name: 'Full Underbody + Interior + Exterior',
    shortName: 'Full Underbody Wash',
    code: 'full-underbody-interior-exterior',
    description: 'Thorough hydraulic ramp underbody wash, complete body foam cleaning and full interior detailing',
    estimatedDuration: 60,
    displayOrder: 2,
    basePrice: 0
  },
  {
    name: 'Exterior Only',
    shortName: 'Exterior Only',
    code: 'exterior-only',
    description: 'Quick exterior pressure rinse, snow foam wash, tyre dressing and hand dry',
    estimatedDuration: 25,
    displayOrder: 3,
    basePrice: 0
  },
  {
    name: 'Full Undercoating + Full Washing',
    shortName: 'Undercoating + Wash',
    code: 'full-undercoating-full-washing',
    description: 'Heavy duty anti-corrosion chassis undercoating shield with complete exterior foam wash & interior clean',
    estimatedDuration: 90,
    displayOrder: 4,
    basePrice: 0
  }
];

const initBusinessDefaults = async () => {
  try {
    // 1. Check & Seed Owner Account
    const owner = await User.findOne({ role: { $in: ['owner', 'admin'] } });
    if (!owner) {
      console.log('🌱 Seeding AHAMMED SONS WATER SERVICE admin user...');
      await User.create({
        name: 'AHAMMED SONS Owner',
        mobile: '9539691738',
        passwordHash: '0000', // Hashes via pre-save hook
        role: 'owner'
      });
      console.log('✅ Admin account seeded: mobile=9539691738, PIN=0000');
    } else if (owner.name.toLowerCase().includes('aquaclean')) {
      owner.name = 'AHAMMED SONS Owner';
      await owner.save();
      console.log('✅ Updated owner account name to AHAMMED SONS Owner');
    }

    // 2. Check & Seed Settings
    let settings = await Settings.findOne();
    if (!settings) {
      console.log('🌱 Initializing AHAMMED SONS WATER SERVICE settings...');
      settings = await Settings.create({
        stationName: 'AHAMMED SONS WATER SERVICE',
        tagline: 'Vehicle Washing, Cleaning & Underbody/Undercoating Services',
        address: 'Kozhikode, Kerala',
        mobile: '9539691738',
        email: 'contact@ahammedsons.com',
        logoUrl: '/uploads/logo/station-logo.jpg',
        logoPath: 'uploads/logo/station-logo.jpg',
        receiptFooter: 'Thank you for choosing AHAMMED SONS WATER SERVICE! Visit us again.'
      });
      console.log('✅ Settings initialized for AHAMMED SONS WATER SERVICE');
    } else if (settings.stationName !== 'AHAMMED SONS WATER SERVICE') {
      settings.stationName = 'AHAMMED SONS WATER SERVICE';
      settings.tagline = 'Vehicle Washing, Cleaning & Underbody/Undercoating Services';
      settings.logoUrl = '/uploads/logo/station-logo.jpg';
      settings.logoPath = 'uploads/logo/station-logo.jpg';
      await settings.save();
      console.log('✅ Settings updated to AHAMMED SONS WATER SERVICE branding');
    }

    // 3. Check & Seed Vehicle Types
    const vTypeCount = await VehicleType.countDocuments();
    if (vTypeCount === 0) {
      console.log('🌱 Seeding default vehicle types...');
      await VehicleType.insertMany(DEFAULT_VEHICLE_TYPES);
      console.log(`✅ Seeded ${DEFAULT_VEHICLE_TYPES.length} vehicle categories`);
    }

    // 4. Check & Seed Service Packages
    const svcCount = await ServicePackage.countDocuments();
    if (svcCount === 0) {
      console.log('🌱 Seeding initial service packages...');
      await ServicePackage.insertMany(DEFAULT_SERVICES);
      console.log(`✅ Seeded ${DEFAULT_SERVICES.length} service packages`);
    }

    // 5. Check & Ensure Pricing Matrix entries exist for all vehicle types and services
    const vehicleTypes = await VehicleType.find({ isActive: true });
    const servicePackages = await ServicePackage.find({ isActive: true });

    const DEFAULT_PRICING_TABLE = {
      'bike': { 'exterior-only': 100, 'interior-exterior-foam-wash': 150, 'full-underbody-interior-exterior': 250, 'full-undercoating-full-washing': 600 },
      'scooter': { 'exterior-only': 100, 'interior-exterior-foam-wash': 150, 'full-underbody-interior-exterior': 250, 'full-undercoating-full-washing': 600 },
      'auto': { 'exterior-only': 150, 'interior-exterior-foam-wash': 200, 'full-underbody-interior-exterior': 300, 'full-undercoating-full-washing': 800 },
      'hatchback': { 'exterior-only': 250, 'interior-exterior-foam-wash': 400, 'full-underbody-interior-exterior': 550, 'full-undercoating-full-washing': 1800 },
      'sedan': { 'exterior-only': 300, 'interior-exterior-foam-wash': 450, 'full-underbody-interior-exterior': 600, 'full-undercoating-full-washing': 2000 },
      'suv': { 'exterior-only': 350, 'interior-exterior-foam-wash': 550, 'full-underbody-interior-exterior': 750, 'full-undercoating-full-washing': 2500 },
      'muv': { 'exterior-only': 350, 'interior-exterior-foam-wash': 550, 'full-underbody-interior-exterior': 750, 'full-undercoating-full-washing': 2500 },
      'pickup': { 'exterior-only': 400, 'interior-exterior-foam-wash': 600, 'full-underbody-interior-exterior': 850, 'full-undercoating-full-washing': 2800 },
      'van': { 'exterior-only': 400, 'interior-exterior-foam-wash': 600, 'full-underbody-interior-exterior': 850, 'full-undercoating-full-washing': 2800 },
      'other': { 'exterior-only': 500, 'interior-exterior-foam-wash': 750, 'full-underbody-interior-exterior': 1000, 'full-undercoating-full-washing': 3500 },
    };

    let createdSlots = 0;
    for (const vt of vehicleTypes) {
      for (const sp of servicePackages) {
        const existing = await WashPackagePrice.findOne({ vehicleType: vt.code, washPackage: sp.code });
        if (!existing) {
          const defaultPrice = DEFAULT_PRICING_TABLE[vt.code]?.[sp.code] || 0;
          await WashPackagePrice.create({
            vehicleType: vt.code,
            washPackage: sp.code,
            price: defaultPrice,
            isNA: false
          });
          createdSlots++;
        }
      }
    }
    if (createdSlots > 0) {
      console.log(`✅ Initialized ${createdSlots} new pricing matrix slots for AHAMMED SONS`);
    }
  } catch (error) {
    console.error('❌ initBusinessDefaults failed:', error.message);
  }
};

module.exports = {
  initBusinessDefaults,
  DEFAULT_VEHICLE_TYPES,
  DEFAULT_SERVICES
};
