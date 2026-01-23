const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    // Support both MONGODB_URI and MONGODB_ATLAS_URI for flexibility
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
    
    console.log('🔍 Debugging - Checking environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Not set');
    console.log('MONGODB_ATLAS_URI:', process.env.MONGODB_ATLAS_URI ? '✓ Set' : '✗ Not set');
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found. Please set MONGODB_URI or MONGODB_ATLAS_URI in your .env file');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Please check your .env file and ensure MONGODB_URI or MONGODB_ATLAS_URI is set correctly.');
    process.exit(1); // Exit if connection fails
  }
};

module.exports = connectDB;
