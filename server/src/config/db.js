const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed (${error.message}). Attempting local fallback: mongodb://127.0.0.1:27017/service_station ...`);
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/service_station');
      console.log(`📡 Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error(`❌ MongoDB connection error: ${localErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
