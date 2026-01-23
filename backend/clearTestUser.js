const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function clearTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS_URI);
    console.log('✅ Connected to MongoDB');
    
    // Delete the test user
    const result = await User.deleteOne({ email: 'helloworld070406@gmail.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Test user deleted successfully!');
    } else {
      console.log('ℹ️  No user found with that email');
    }
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

clearTestUser();
