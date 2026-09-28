const mongoose = require('mongoose');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const WashJob = require('./models/WashJob');
const Invoice = require('./models/Invoice');
const Appointment = require('./models/Appointment');
const Expense = require('./models/Expense');
const Settings = require('./models/Settings');
const WashPackagePrice = require('./models/WashPackagePrice');
const WaterLog = require('./models/WaterLog');
const ManualRevenue = require('./models/ManualRevenue');
const VEHICLE_TYPES = require('./constants/vehicleTypes');
const WASH_PACKAGES = require('./constants/washPackages');
const env = require('./config/env');
const path = require('path');

const seedDB = async () => {
  try {
    console.log('⚡ Starting database seeding process...');
    await mongoose.connect(env.MONGO_URI);
    console.log('📡 Connected to MongoDB for seeding');

    // Purge existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Vehicle.deleteMany({});
    await WashJob.deleteMany({});
    await Invoice.deleteMany({});
    await Appointment.deleteMany({});
    await Expense.deleteMany({});
    await Settings.deleteMany({});
    try {
      await mongoose.connection.db.dropCollection('washpackageprices');
      console.log('🗑️ Dropped washpackageprices collection');
    } catch (e) {
      // Ignore if not exists
    }
    await WashPackagePrice.deleteMany({});
    await WaterLog.deleteMany({});
    await ManualRevenue.deleteMany({});
    console.log('🧹 Purged all existing collections');

    // 1. Seed Station Settings
    const settings = await Settings.create({
      stationName: 'AHAMMED SONS',
      address: 'Plot 42, Bypass Road, Ernakulam, Kerala - 682024',
      gstNumber: '32AAAAA0000A1Z2',
      mobile: '9539691738',
      email: 'support@ahammedsons.com',
      gstRate: 0, // GST exempt
      waterRatePerLitre: 0.15,
      activeBaysCount: 3,
      dailyCapacityPerSlot: 5,
      logoUrl: '/uploads/logo/station-logo.jpg',
      logoPath: path.join(__dirname, '../uploads/logo/station-logo.jpg')
    });
    console.log('✅ Settings seeded');

    // 2. Seed Owner Account
    await User.create({
      name: 'AquaClean Owner',
      mobile: '9539691738',
      passwordHash: '0000', // Hashed by User model pre-save hook
      role: 'owner'
    });
    console.log('✅ Owner account seeded (PIN: 0000)');

    // 3. Seed Pricing Matrix (15 vehicle types × 6 packages = 90 rows)
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
    console.log(`✅ ${pricingMatrixData.length} Pricing Matrix cells seeded`);

    // 4. Seed Customers (15 customers, Kerala names)
    const customerData = [
      { name: 'Rahul Varghese', mobile: '9999999901', email: 'rahul@example.com', address: 'Varghese Villa, Kadavanthra, Kochi' },
      { name: 'Akhil K.S.', mobile: '9999999902', email: 'akhil@example.com', address: 'K.S. House, Aluva, Kochi' },
      { name: 'Anjali Nair', mobile: '9999999903', email: 'anjali@example.com', address: 'Nair Nivas, Tripunithura, Kochi' },
      { name: 'Sreedhar Pillai', mobile: '9999999904', email: 'sreedhar@example.com', address: 'Pillai Nilayam, Kakkanad, Kochi' },
      { name: 'Varghese Mathew', mobile: '9999999905', email: 'varghese@example.com', address: 'Mathew Lodge, Edappally, Kochi' },
      { name: 'George Joseph', mobile: '9999999906', email: 'george@example.com', address: 'Joseph Estates, Fort Kochi' },
      { name: 'Lakshmi Priya', mobile: '9999999907', email: 'lakshmi@example.com', address: 'Priya Homes, Kaloor, Kochi' },
      { name: 'Manu Shankar', mobile: '9999999908', email: 'manu@example.com', address: 'Shankar Bhavanam, Vyttila, Kochi' },
      { name: 'Parvathy Menon', mobile: '9999999909', email: 'parvathy@example.com', address: 'Menon Villa, Ravipuram, Kochi' },
      { name: 'Jaison Thomas', mobile: '9999999910', email: 'jaison@example.com', address: 'Thomas Villa, Palarivattom, Kochi' },
      { name: 'Reny Kurian', mobile: '9999999911', email: 'reny@example.com', address: 'Kurian House, Maradu, Kochi' },
      { name: 'Sujith Kumar', mobile: '9999999912', email: 'sujith@example.com', address: 'Sree Padmam, Cheranallur, Kochi' },
      { name: 'Dhanya Balan', mobile: '9999999913', email: 'dhanya@example.com', address: 'Balan Nivas, Kalamassery, Kochi' },
      { name: 'Harish R.', mobile: '9999999914', email: 'harish@example.com', address: 'R. Bhavan, Nettoor, Kochi' },
      { name: 'Sandeep Dev', mobile: '9999999915', email: 'sandeep@example.com', address: 'Dev Villa, Thevara, Kochi' }
    ];

    const customers = await Customer.insertMany(customerData);
    console.log('✅ 15 Customers seeded');

    // 5. Seed Vehicles (25 vehicles across categories, Kerala KL plates)
    const vehicleData = [];
    for (let i = 0; i < 25; i++) {
      const vType = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
      const customer = customers[i % customers.length];
      
      const brands = {
        light: ['Atlas', 'Hero', 'Bajaj', 'Honda', 'TVS'],
        medium: ['Suzuki', 'Hyundai', 'Toyota', 'Mahindra', 'Tata'],
        heavy: ['Ashok Leyland', 'BharatBenz', 'Eicher', 'Tata Trucks'],
        special: ['JCB', 'Escorts', 'Caterpillar', 'Sany']
      };
      
      const models = {
        light: ['Cycle', 'Pulsar', 'Activa', 'Rickshaw', 'Splendor'],
        medium: ['Swift', 'i20', 'Innova', 'Thar', 'Bolero'],
        heavy: ['Lorry 1618', 'Tipper', 'Cargo Truck', 'Traveler Bus'],
        special: ['Excavator 3DX', 'Tractor 5310', 'Hydra Crane', 'Road Roller']
      };

      const category = vType.category;
      const brand = brands[category][i % brands[category].length];
      const model = models[category][i % models[category].length];

      vehicleData.push({
        regNumber: `KL07C${String(1000 + i)}`,
        vehicleType: vType.id,
        make: brand,
        model: model,
        colour: i % 2 === 0 ? 'White' : i % 3 === 0 ? 'Black' : 'Blue',
        customerId: customer._id,
        notes: `Sample ${vType.label}`
      });
    }

    const vehicles = await Vehicle.insertMany(vehicleData);
    // Link vehicles in customer lists
    for (const veh of vehicles) {
      await Customer.findByIdAndUpdate(veh.customerId, {
        $push: { vehicleRefs: veh._id }
      });
    }
    console.log('✅ 25 Vehicles seeded');

    // 6. Seed 40 Wash Jobs (mix of statuses, past 30 days)
    const statuses = ['queued', 'in-bay', 'washing', 'drying', 'ready', 'delivered', 'cancelled'];
    const jobList = [];

    for (let i = 0; i < 40; i++) {
      const vehicle = vehicles[i % vehicles.length];
      const customer = customers[i % customers.length];
      const status = statuses[i % statuses.length];
      const vType = VEHICLE_TYPES.find(v => v.id === vehicle.vehicleType) || { category: 'medium' };
      
      // Filter packages based on eligibility
      const applicablePkgs = WASH_PACKAGES.filter(p => !(vType.id === 'bicycle' && p.id === 'engine'));
      const pkg = applicablePkgs[i % applicablePkgs.length];

      // Get Price
      const prDoc = await WashPackagePrice.findOne({ vehicleTypeId: vType.id, packageId: pkg.id });
      const price = prDoc ? prDoc.price : 180;

      // Determine water usage
      let waterUsed = 0;
      if (['washing', 'drying', 'ready', 'delivered'].includes(status)) {
        if (vType.category === 'light') waterUsed = 30 + (i % 20);
        if (vType.category === 'medium') waterUsed = 120 + (i % 80);
        if (vType.category === 'heavy') waterUsed = 450 + (i % 200);
        if (vType.category === 'special') waterUsed = 800 + (i % 300);
      }

      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - (30 - i)); // spread last 30 days

      jobList.push({
        vehicleReg: vehicle.regNumber,
        vehicleType: vehicle.vehicleType,
        customerId: customer._id,
        washPackage: pkg.id,
        price,
        status,
        bayNumber: ['in-bay', 'washing', 'drying'].includes(status) ? (i % 3) + 1 : null,
        assignedStaff: i % 4 === 0 ? 'Akhil' : i % 4 === 1 ? 'Jobin' : 'Sajid',
        waterUsedLitres: waterUsed,
        startTime: ['in-bay', 'washing', 'drying', 'ready', 'delivered'].includes(status) ? createdDate : null,
        endTime: status === 'delivered' ? new Date(createdDate.getTime() + 45 * 60 * 1000) : null,
        paymentStatus: status === 'delivered' ? 'paid' : 'unpaid',
        paymentMethod: status === 'delivered' ? (i % 2 === 0 ? 'upi' : 'cash') : 'pending',
        createdAt: createdDate,
        updatedAt: createdDate
      });
    }

    // Insert wash jobs individually to trigger tokenNumber pre-save hooks
    const washJobs = [];
    for (const jobItem of jobList) {
      const job = new WashJob(jobItem);
      // bypass pre-save count Today for clean spread by overriding
      await job.save();
      washJobs.push(job);
    }
    console.log('✅ 40 Wash Jobs seeded');

    // 7. Seed 30 Invoices corresponding to paid wash jobs
    const paidJobs = washJobs.filter(w => w.status === 'delivered');
    const paymentMethods = ['cash', 'upi', 'card'];

    for (let i = 0; i < 30 && i < paidJobs.length; i++) {
      const job = paidJobs[i];
      const taxRate = settings.gstRate || 0;
      const taxAmount = parseFloat(((job.price * taxRate) / 100).toFixed(2));
      const grandTotal = parseFloat((job.price + taxAmount).toFixed(2));

      const invoice = await Invoice.create({
        washJobId: job._id,
        customerId: job.customerId,
        vehicleReg: job.vehicleReg,
        vehicleType: job.vehicleType,
        washPackage: job.washPackage,
        amount: job.price,
        taxRate,
        taxAmount,
        grandTotal,
        paymentStatus: 'paid',
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paidAt: job.createdAt,
        createdAt: job.createdAt
      });

      invoice.payments.push({
        amount: grandTotal,
        method: paymentMethods[i % paymentMethods.length],
        date: job.createdAt,
        note: 'Seeded billing payment'
      });
      await invoice.save();

      // update customer stats
      await Customer.findByIdAndUpdate(job.customerId, {
        $inc: { totalSpend: grandTotal }
      });
    }
    console.log('✅ 30 Invoices seeded');

    // 8. Seed 25 Expenses
    const expenseCategories = ['water-supply', 'electricity', 'wages', 'cleaning-chemicals', 'equipment-repair', 'fuel-generator', 'marketing', 'rent', 'other'];
    const vendors = ['Kerala Water Authority', 'KSEB Power', 'LiquidShine Chemicals', 'JCB Repair Service', 'Indian Oil refuel', 'Local Landlord'];

    for (let i = 1; i <= 25; i++) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() - i);
      const cat = expenseCategories[i % expenseCategories.length];
      const vendor = vendors[i % vendors.length];
      const amount = Math.floor(Math.random() * 5000) + 200;

      await Expense.create({
        date: expDate,
        category: cat,
        description: `Monthly station cost for ${cat.replace('-', ' ')} operations.`,
        amount,
        paymentMethod: i % 2 === 0 ? 'upi' : 'cash',
        vendor,
        notes: 'Approved under settings overheads'
      });
    }
    console.log('✅ 25 Expenses seeded');

    // 9. Seed 10 Appointments
    const appServiceOptions = ['basic', 'full', 'full-interior', 'detail'];
    const timeSlots = ['09:30 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

    for (let i = 0; i < 10; i++) {
      const appDate = new Date();
      appDate.setDate(appDate.getDate() + (i - 3)); // past & future
      const timeSlot = timeSlots[i % timeSlots.length];
      const status = i < 4 ? 'completed' : i < 8 ? 'confirmed' : 'pending';

      await Appointment.create({
        customerName: `Booking Customer-${i + 1}`,
        mobile: `98989898${String(10 + i)}`,
        vehicleReg: `KL07D${4000 + i}`,
        vehicleType: VEHICLE_TYPES[i % VEHICLE_TYPES.length].id,
        washPackage: appServiceOptions[i % appServiceOptions.length],
        preferredDate: appDate,
        preferredTime: timeSlot,
        status,
        source: i % 3 === 0 ? 'online' : 'phone',
        notes: 'Customer requested quick turnaround.'
      });
    }
    console.log('✅ 10 Appointments seeded');

    // 10. Water Logs for past 7 days (overheads)
    for (let i = 0; i < 7; i++) {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - i);
      logDate.setHours(0,0,0,0);

      await WaterLog.create({
        date: logDate,
        litresUsed: 150 + (i * 25), // daily base waste/overhead
        notes: `Daily wash deck cleaning and filtration loss logs.`
      });
    }
    console.log('✅ 7 Daily Water Logs seeded');

    // 11. Seed ManualRevenue (historical 90 days) & Expenses (last 3 months)
    const manualRevenues = [];
    const manualExpenses = [];
    const today = new Date();
    const staffNames = ['Akhil', 'Jobin', 'Sajid'];

    for (let i = 90; i >= 1; i--) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - i);
      const dayOfWeek = logDate.getDay();

      let baseMin = 1000;
      let baseMax = 3000;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseMin = 3000;
        baseMax = 6000;
      } else if (dayOfWeek === 5) {
        baseMin = 1500;
        baseMax = 4000;
      }
      const dayRevenue = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

      let remaining = dayRevenue;
      let entryCount = 0;
      while (remaining > 300 && entryCount < 4) {
        const entryAmt = Math.min(remaining, Math.floor(Math.random() * 800) + 200);
        const randomVType = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)].id;
        const randomPkg = WASH_PACKAGES[Math.floor(Math.random() * WASH_PACKAGES.length)].id;
        const randomMethod = ['upi', 'cash', 'card'][Math.floor(Math.random() * 3)];
        
        manualRevenues.push({
          date: new Date(logDate),
          description: `Manual Walk-in Cashier Entry - ${randomVType.toUpperCase()}`,
          vehicleType: randomVType,
          washPackage: randomPkg,
          amount: entryAmt,
          paymentMethod: randomMethod,
          notes: 'Backfilled historical offline entry',
          source: 'manual'
        });
        remaining -= entryAmt;
        entryCount++;
      }
      if (remaining > 0) {
        manualRevenues.push({
          date: new Date(logDate),
          description: 'Offline wash ticket consolidation',
          amount: remaining,
          paymentMethod: 'cash',
          notes: 'Backfilled consolidation',
          source: 'manual'
        });
      }

      // Weekly Chemical Expense (Mondays)
      if (dayOfWeek === 1) {
        manualExpenses.push({
          date: new Date(logDate),
          category: 'cleaning-chemicals',
          description: 'Weekly cleaning shampoo & polymer wax concentrate refill',
          amount: Math.floor(Math.random() * (600 - 200 + 1)) + 200,
          paymentMethod: 'upi',
          vendor: 'Kochi Chemical Suppliers',
          notes: 'Automated weekly replenishment',
          source: 'manual'
        });
      }

      // Miscellaneous weekly (Thursdays)
      if (dayOfWeek === 4) {
        manualExpenses.push({
          date: new Date(logDate),
          category: 'other',
          description: 'Broom brushes, micro-fiber towels, refreshments for deck staff',
          amount: Math.floor(Math.random() * (400 - 100 + 1)) + 100,
          paymentMethod: 'cash',
          vendor: 'Local Grocery Mart',
          notes: 'Petty cash expense',
          source: 'manual'
        });
      }
    }

    // Monthly Expenses (last 3 months)
    for (let m = 3; m >= 1; m--) {
      const expDate = new Date(today);
      expDate.setMonth(today.getMonth() - m);
      expDate.setDate(5);

      manualExpenses.push({
        date: new Date(expDate),
        category: 'water-supply',
        description: 'Monthly tank tanker water load supply invoice',
        amount: Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000,
        paymentMethod: 'upi',
        vendor: 'Kochi Water Tanker Union',
        notes: '30,000 Litres total tanker delivery',
        source: 'manual'
      });

      manualExpenses.push({
        date: new Date(expDate),
        category: 'electricity',
        description: 'KSEB Commercial Power supply bill',
        amount: Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500,
        paymentMethod: 'upi',
        vendor: 'KSEB Office Ernakulam',
        notes: 'High pressure pumps & vacuum motors grid draw',
        source: 'manual'
      });

      manualExpenses.push({
        date: new Date(expDate),
        category: 'rent',
        description: 'Monthly commercial land parcel lease rent payment',
        amount: 15000,
        paymentMethod: 'upi',
        vendor: 'Landowner K. Kurian',
        notes: 'Lease rent',
        source: 'manual'
      });

      staffNames.forEach(staff => {
        manualExpenses.push({
          date: new Date(expDate),
          category: 'wages',
          description: `Monthly salary payout for deck specialist ${staff}`,
          amount: Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000,
          paymentMethod: 'upi',
          vendor: staff,
          notes: 'Bank transfer salary release',
          source: 'manual'
        });
      });
    }

    await ManualRevenue.insertMany(manualRevenues);
    await Expense.insertMany(manualExpenses);
    console.log(`✅ ${manualRevenues.length} Manual Revenues seeded`);
    console.log(`✅ Historical Expenses seeded`);

    console.log('🎉 Seeding successfully completed!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error.message);
    process.exit(1);
  }
};

seedDB();
