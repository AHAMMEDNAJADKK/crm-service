const User = require('../models/User');
const Settings = require('../models/Settings');
const VehicleType = require('../models/VehicleType');
const ServicePackage = require('../models/ServicePackage');
const WashPackagePrice = require('../models/WashPackagePrice');

const DEFAULT_VEHICLE_TYPES = [
  // Two Wheeler
  { name: 'Bike', code: 'bike', category: 'light', icon: 'Bike', displayOrder: 1 },
  { name: 'Scooter', code: 'scooter', category: 'light', icon: 'Bike', displayOrder: 2 },

  // Three Wheeler
  { name: 'Auto', code: 'auto', category: 'light', icon: 'Car', displayOrder: 3 },

  // Cars
  { name: 'Hatchback', code: 'hatchback', category: 'medium', icon: 'Car', displayOrder: 4 },
  { name: 'Sedan', code: 'sedan', category: 'medium', icon: 'Car', displayOrder: 5 },
  { name: 'SUV', code: 'suv', category: 'medium', icon: 'Car', displayOrder: 6 },
  { name: 'MUV', code: 'muv', category: 'medium', icon: 'Car', displayOrder: 7 },

  // Commercial Vehicles
  { name: 'Pickup', code: 'pickup', category: 'heavy', icon: 'Truck', displayOrder: 8 },
  { name: 'Van', code: 'van', category: 'medium', icon: 'Truck', displayOrder: 9 },
  { name: 'Mini Truck', code: 'mini-truck', category: 'heavy', icon: 'Truck', displayOrder: 10 },
  { name: 'Lorry', code: 'lorry', category: 'heavy', icon: 'Truck', displayOrder: 11 },
  { name: 'BharatBenz', code: 'bharatbenz', category: 'heavy', icon: 'Truck', displayOrder: 12 },
  { name: 'Truck', code: 'truck', category: 'heavy', icon: 'Truck', displayOrder: 13 },

  // Heavy Vehicles & Machinery
  { name: 'JCB', code: 'jcb', category: 'heavy', icon: 'Truck', displayOrder: 14 },
  { name: 'Hitachi', code: 'hitachi', category: 'heavy', icon: 'Truck', displayOrder: 15 },
  { name: 'Excavator', code: 'excavator', category: 'heavy', icon: 'Truck', displayOrder: 16 },
  { name: 'Loader', code: 'loader', category: 'heavy', icon: 'Truck', displayOrder: 17 },
  { name: 'Crane', code: 'crane', category: 'heavy', icon: 'Truck', displayOrder: 18 },
  { name: 'Tractor', code: 'tractor', category: 'heavy', icon: 'Truck', displayOrder: 19 },
  { name: 'Heavy Machinery', code: 'heavy-machinery', category: 'heavy', icon: 'Truck', displayOrder: 20 },

  // Other
  { name: 'Other', code: 'other', category: 'other', icon: 'Car', displayOrder: 21 }
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
  },
  {
    name: 'Foam Wash',
    shortName: 'Foam Wash',
    code: 'foam-wash',
    description: 'High pressure foam wash and hand dry',
    estimatedDuration: 30,
    displayOrder: 5,
    basePrice: 0
  },
  {
    name: 'Interior Cleaning',
    shortName: 'Interior Clean',
    code: 'interior-cleaning',
    description: 'Interior vacuuming, dashboard polish, seat wiping',
    estimatedDuration: 35,
    displayOrder: 6,
    basePrice: 0
  },
  {
    name: 'Underbody Cleaning',
    shortName: 'Underbody Clean',
    code: 'underbody-cleaning',
    description: 'Ramp mounted high pressure undercarriage mud wash',
    estimatedDuration: 30,
    displayOrder: 7,
    basePrice: 0
  },
  {
    name: 'Undercoating',
    shortName: 'Undercoating',
    code: 'undercoating',
    description: 'Protective chassis undercoating application',
    estimatedDuration: 60,
    displayOrder: 8,
    basePrice: 0
  },
  {
    name: 'General Service',
    shortName: 'General Service',
    code: 'general-wash',
    description: 'Standard vehicle wash and clean service',
    estimatedDuration: 30,
    displayOrder: 9,
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

    // 3. Ensure All Vehicle Types Exist (Idempotent)
    let newVTypes = 0;
    for (const vt of DEFAULT_VEHICLE_TYPES) {
      const exists = await VehicleType.findOne({ code: vt.code });
      if (!exists) {
        await VehicleType.create(vt);
        newVTypes++;
      }
    }
    if (newVTypes > 0) {
      console.log(`✅ Seeded ${newVTypes} new vehicle categories (JCB, Lorry, BharatBenz, etc.)`);
    }

    // 4. Ensure All Service Packages Exist (Idempotent)
    let newServices = 0;
    for (const sp of DEFAULT_SERVICES) {
      const exists = await ServicePackage.findOne({ code: sp.code });
      if (!exists) {
        await ServicePackage.create(sp);
        newServices++;
      }
    }
    if (newServices > 0) {
      console.log(`✅ Seeded ${newServices} new service packages`);
    }

    // 5. Check & Ensure Pricing Matrix entries exist for all vehicle types and services
    const vehicleTypes = await VehicleType.find({ isActive: true });
    const servicePackages = await ServicePackage.find({ isActive: true });

    const DEFAULT_PRICING_TABLE = {
      'bike': { 'exterior-only': 100, 'interior-exterior-foam-wash': 150, 'full-underbody-interior-exterior': 250, 'full-undercoating-full-washing': 600, 'foam-wash': 100, 'interior-cleaning': 100, 'underbody-cleaning': 150, 'undercoating': 500, 'general-wash': 150 },
      'scooter': { 'exterior-only': 100, 'interior-exterior-foam-wash': 150, 'full-underbody-interior-exterior': 250, 'full-undercoating-full-washing': 600, 'foam-wash': 100, 'interior-cleaning': 100, 'underbody-cleaning': 150, 'undercoating': 500, 'general-wash': 150 },
      'auto': { 'exterior-only': 150, 'interior-exterior-foam-wash': 200, 'full-underbody-interior-exterior': 300, 'full-undercoating-full-washing': 800, 'foam-wash': 150, 'interior-cleaning': 150, 'underbody-cleaning': 200, 'undercoating': 600, 'general-wash': 200 },
      'hatchback': { 'exterior-only': 250, 'interior-exterior-foam-wash': 400, 'full-underbody-interior-exterior': 550, 'full-undercoating-full-washing': 1800, 'foam-wash': 300, 'interior-cleaning': 250, 'underbody-cleaning': 300, 'undercoating': 1500, 'general-wash': 400 },
      'sedan': { 'exterior-only': 300, 'interior-exterior-foam-wash': 450, 'full-underbody-interior-exterior': 600, 'full-undercoating-full-washing': 2000, 'foam-wash': 350, 'interior-cleaning': 250, 'underbody-cleaning': 350, 'undercoating': 1600, 'general-wash': 450 },
      'suv': { 'exterior-only': 350, 'interior-exterior-foam-wash': 550, 'full-underbody-interior-exterior': 750, 'full-undercoating-full-washing': 2500, 'foam-wash': 400, 'interior-cleaning': 300, 'underbody-cleaning': 450, 'undercoating': 2000, 'general-wash': 550 },
      'muv': { 'exterior-only': 350, 'interior-exterior-foam-wash': 550, 'full-underbody-interior-exterior': 750, 'full-undercoating-full-washing': 2500, 'foam-wash': 400, 'interior-cleaning': 300, 'underbody-cleaning': 450, 'undercoating': 2000, 'general-wash': 550 },
      'pickup': { 'exterior-only': 400, 'interior-exterior-foam-wash': 600, 'full-underbody-interior-exterior': 850, 'full-undercoating-full-washing': 2800, 'foam-wash': 450, 'interior-cleaning': 350, 'underbody-cleaning': 500, 'undercoating': 2200, 'general-wash': 600 },
      'van': { 'exterior-only': 400, 'interior-exterior-foam-wash': 600, 'full-underbody-interior-exterior': 850, 'full-undercoating-full-washing': 2800, 'foam-wash': 450, 'interior-cleaning': 350, 'underbody-cleaning': 500, 'undercoating': 2200, 'general-wash': 600 },
      'mini-truck': { 'exterior-only': 450, 'interior-exterior-foam-wash': 700, 'full-underbody-interior-exterior': 950, 'full-undercoating-full-washing': 3000, 'foam-wash': 500, 'interior-cleaning': 400, 'underbody-cleaning': 600, 'undercoating': 2400, 'general-wash': 700 },
      'lorry': { 'exterior-only': 600, 'interior-exterior-foam-wash': 1000, 'full-underbody-interior-exterior': 1500, 'full-undercoating-full-washing': 4000, 'foam-wash': 700, 'interior-cleaning': 500, 'underbody-cleaning': 900, 'undercoating': 3000, 'general-wash': 1000 },
      'bharatbenz': { 'exterior-only': 800, 'interior-exterior-foam-wash': 1200, 'full-underbody-interior-exterior': 1800, 'full-undercoating-full-washing': 4500, 'foam-wash': 800, 'interior-cleaning': 600, 'underbody-cleaning': 1000, 'undercoating': 3500, 'general-wash': 1200 },
      'truck': { 'exterior-only': 800, 'interior-exterior-foam-wash': 1200, 'full-underbody-interior-exterior': 1800, 'full-undercoating-full-washing': 4500, 'foam-wash': 800, 'interior-cleaning': 600, 'underbody-cleaning': 1000, 'undercoating': 3500, 'general-wash': 1200 },
      'jcb': { 'exterior-only': 700, 'interior-exterior-foam-wash': 1000, 'full-underbody-interior-exterior': 1500, 'full-undercoating-full-washing': 4000, 'foam-wash': 800, 'interior-cleaning': 500, 'underbody-cleaning': 1000, 'undercoating': 3000, 'general-wash': 1500 },
      'hitachi': { 'exterior-only': 800, 'interior-exterior-foam-wash': 1200, 'full-underbody-interior-exterior': 1800, 'full-undercoating-full-washing': 4500, 'foam-wash': 900, 'interior-cleaning': 600, 'underbody-cleaning': 1200, 'undercoating': 3500, 'general-wash': 1800 },
      'excavator': { 'exterior-only': 800, 'interior-exterior-foam-wash': 1200, 'full-underbody-interior-exterior': 1800, 'full-undercoating-full-washing': 4500, 'foam-wash': 900, 'interior-cleaning': 600, 'underbody-cleaning': 1200, 'undercoating': 3500, 'general-wash': 1800 },
      'loader': { 'exterior-only': 700, 'interior-exterior-foam-wash': 1000, 'full-underbody-interior-exterior': 1500, 'full-undercoating-full-washing': 4000, 'foam-wash': 800, 'interior-cleaning': 500, 'underbody-cleaning': 1000, 'undercoating': 3000, 'general-wash': 1500 },
      'crane': { 'exterior-only': 900, 'interior-exterior-foam-wash': 1400, 'full-underbody-interior-exterior': 2000, 'full-undercoating-full-washing': 5000, 'foam-wash': 1000, 'interior-cleaning': 700, 'underbody-cleaning': 1400, 'undercoating': 4000, 'general-wash': 2000 },
      'tractor': { 'exterior-only': 400, 'interior-exterior-foam-wash': 600, 'full-underbody-interior-exterior': 800, 'full-undercoating-full-washing': 2500, 'foam-wash': 450, 'interior-cleaning': 350, 'underbody-cleaning': 500, 'undercoating': 2000, 'general-wash': 600 },
      'heavy-machinery': { 'exterior-only': 1000, 'interior-exterior-foam-wash': 1500, 'full-underbody-interior-exterior': 2200, 'full-undercoating-full-washing': 5500, 'foam-wash': 1100, 'interior-cleaning': 800, 'underbody-cleaning': 1500, 'undercoating': 4500, 'general-wash': 2200 },
      'other': { 'exterior-only': 500, 'interior-exterior-foam-wash': 750, 'full-underbody-interior-exterior': 1000, 'full-undercoating-full-washing': 3500, 'foam-wash': 500, 'interior-cleaning': 400, 'underbody-cleaning': 700, 'undercoating': 2500, 'general-wash': 750 },
    };

    const existingPrices = await WashPackagePrice.find({}, 'vehicleType washPackage');
    const existingSet = new Set(existingPrices.map(p => `${p.vehicleType}:${p.washPackage}`));
    const docsToInsert = [];

    for (const vt of vehicleTypes) {
      for (const sp of servicePackages) {
        if (!existingSet.has(`${vt.code}:${sp.code}`)) {
          const defaultPrice = DEFAULT_PRICING_TABLE[vt.code]?.[sp.code] || 0;
          docsToInsert.push({
            vehicleType: vt.code,
            washPackage: sp.code,
            price: defaultPrice,
            isNA: false
          });
        }
      }
    }

    if (docsToInsert.length > 0) {
      await WashPackagePrice.insertMany(docsToInsert);
      console.log(`✅ Initialized ${docsToInsert.length} new pricing matrix slots for AHAMMED SONS`);
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
