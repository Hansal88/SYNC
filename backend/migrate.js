const mongoose = require('mongoose');
require('dotenv').config();

async function migrateUsers() {
  try {
    const mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found in .env');
    }

    await mongoose.connect(mongoURI);
    
    console.log('🔄 Running migration...');
    
    const result = await mongoose.connection.collection('users').updateMany(
      { isEmailVerified: { $exists: false } },
      { $set: { isEmailVerified: true, otp: { code: null, expiresAt: null, attempts: 0 } } }
    );
    
    console.log('✅ Migration successful!');
    console.log(`   Updated ${result.modifiedCount} existing users`);
    console.log('   All users can now login without email verification');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateUsers();
