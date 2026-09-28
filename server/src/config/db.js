const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  const uri = env.MONGODB_URI || env.MONGO_URI || 'mongodb://127.0.0.1:27017/service_station';
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      autoIndex: true
    });
    console.log(`📡 MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed (${maskedUri}): ${error.message}`);
    console.log('🔄 Attempting local MongoDB fallback: mongodb://127.0.0.1:27017/service_station ...');

    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/service_station', {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`📡 Local MongoDB Connected: ${localConn.connection.host} (${localConn.connection.name})`);
      return localConn;
    } catch (localErr) {
      console.error(`❌ MongoDB connection error: Could not connect to Atlas or Local MongoDB.`);
      console.error(`   Local error: ${localErr.message}`);
      console.error(`👉 For local dev: Make sure MongoDB service is running (mongod or 'net start MongoDB')`);
      console.error(`👉 For cloud Atlas: Update MONGODB_URI in server/.env with your valid MongoDB Atlas connection string.`);
      return null;
    }
  }
};

module.exports = connectDB;

