const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
require('dotenv').config();

async function removeDemoTutors() {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define demo/test email patterns
    const demoEmailPatterns = [
      'test',
      'demo',
      'example',
      'tutor@example',
      'sample',
      'dummy',
      'lorem',
      'ipsum',
      'helloworld',
      '@temp',
      'temporary'
    ];

    // Find all tutors
    const allTutors = await Tutor.find().populate('userId', 'email name');
    console.log(`\n📊 Total tutors found: ${allTutors.length}\n`);

    let demoTutorsToDelete = [];

    // Check each tutor
    allTutors.forEach((tutor, index) => {
      const email = tutor.userId?.email?.toLowerCase() || '';
      const name = tutor.userId?.name?.toLowerCase() || '';
      
      // Check if user is missing (orphaned tutor)
      const isOrphaned = !tutor.userId || !email;
      
      // Check if matches demo pattern
      const isDemo = demoEmailPatterns.some(pattern => 
        email.includes(pattern) || name.includes(pattern)
      );

      if (isOrphaned || isDemo) {
        demoTutorsToDelete.push({
          tutorId: tutor._id,
          userId: tutor.userId?._id,
          email: tutor.userId?.email,
          name: tutor.userId?.name,
          reason: isOrphaned ? 'orphaned' : 'demo'
        });
        const reason = isOrphaned ? '🔗 ORPHANED' : '🗑️  DEMO';
        console.log(`${index + 1}. ${reason}: ${tutor.userId?.name || 'Unknown'} (${tutor.userId?.email || 'No email'})`);
      } else {
        console.log(`${index + 1}. ✅ KEEP: ${tutor.userId?.name} (${tutor.userId?.email})`);
      }
    });

    if (demoTutorsToDelete.length === 0) {
      console.log('\n✅ No demo tutors found. All tutors are real!');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${demoTutorsToDelete.length} demo tutors to remove.\n`);

    // Delete demo tutors
    for (const demoTutor of demoTutorsToDelete) {
      // Delete tutor profile
      await Tutor.deleteOne({ _id: demoTutor.tutorId });
      
      // Delete user account
      await User.deleteOne({ _id: demoTutor.userId });
      
      console.log(`🗑️  Deleted: ${demoTutor.name} (${demoTutor.email})`);
    }

    console.log(`\n✅ Successfully removed ${demoTutorsToDelete.length} demo tutors!`);
    
    // Show remaining tutors
    const remainingTutors = await Tutor.find().populate('userId', 'email name');
    console.log(`\n📊 Remaining tutors: ${remainingTutors.length}`);
    remainingTutors.forEach((tutor, index) => {
      console.log(`${index + 1}. ${tutor.userId?.name} (${tutor.userId?.email})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

removeDemoTutors();
