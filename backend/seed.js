const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Learner = require('./models/Learner');

const seedTutors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_ATLAS_URI);
    console.log('Connected to MongoDB');

    // Clear existing tutors and users
    await User.deleteMany({});
    await Tutor.deleteMany({});
    console.log('Cleared existing data');

    // Create tutor users
    const tutorData = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        role: 'tutor',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'tutor',
      },
      {
        name: 'Mike Chen',
        email: 'mike@example.com',
        password: 'password123',
        role: 'tutor',
      },
      {
        name: 'Emma Wilson',
        email: 'emma@example.com',
        password: 'password123',
        role: 'tutor',
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        password: 'password123',
        role: 'tutor',
      },
    ];

    // Hash passwords and create users
    const createdUsers = [];
    for (const data of tutorData) {
      const hashedPassword = await bcryptjs.hash(data.password, 10);
      const user = new User({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isEmailVerified: true, // Mark as verified for seeded users
      });
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${data.name}`);
    }

    // Create tutor profiles
    const tutorProfiles = [
      {
        userId: createdUsers[0]._id,
        bio: 'Experienced React and JavaScript instructor with 5+ years of teaching experience.',
        specialization: ['React', 'JavaScript', 'Web Development', 'Node.js'],
        experience: 5,
        hourlyRate: 45,
        students: 12,
        completedSessions: 48,
        rating: 4.8,
        reviews: 15,
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      {
        userId: createdUsers[1]._id,
        bio: 'Python expert specializing in data science and machine learning.',
        specialization: ['Python', 'Data Science', 'Machine Learning', 'Django'],
        experience: 6,
        hourlyRate: 50,
        students: 8,
        completedSessions: 35,
        rating: 4.9,
        reviews: 12,
        availability: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      },
      {
        userId: createdUsers[2]._id,
        bio: 'Full-stack developer teaching web development and mobile apps.',
        specialization: ['HTML/CSS', 'JavaScript', 'React Native', 'Backend Development'],
        experience: 4,
        hourlyRate: 40,
        students: 15,
        completedSessions: 52,
        rating: 4.7,
        reviews: 18,
        availability: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
      },
      {
        userId: createdUsers[3]._id,
        bio: 'Math and Physics tutor for students of all levels.',
        specialization: ['Mathematics', 'Physics', 'Calculus', 'Algebra'],
        experience: 8,
        hourlyRate: 35,
        students: 20,
        completedSessions: 75,
        rating: 4.9,
        reviews: 22,
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      {
        userId: createdUsers[4]._id,
        bio: 'English and writing specialist with published works.',
        specialization: ['English', 'Writing', 'Literature', 'TOEFL Prep'],
        experience: 7,
        hourlyRate: 42,
        students: 10,
        completedSessions: 40,
        rating: 4.8,
        reviews: 14,
        availability: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Sunday'],
      },
    ];

    for (const profile of tutorProfiles) {
      const tutor = new Tutor(profile);
      await tutor.save();
      console.log(`Created tutor profile for: ${createdUsers[tutorProfiles.indexOf(profile)].name}`);
    }

    console.log('\n✅ Seed data created successfully!');

    // Create learner accounts
    const learnerData = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'learner',
      },
      {
        name: 'Bob Williams',
        email: 'bob@example.com',
        password: 'password123',
        role: 'learner',
      },
    ];

    for (const data of learnerData) {
      const hashedPassword = await bcryptjs.hash(data.password, 10);
      const user = new User({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isEmailVerified: true,
      });
      await user.save();

      // Create learner profile
      const learner = new Learner({
        userId: user._id,
        bio: 'Eager learner looking to improve my skills',
      });
      await learner.save();
      console.log(`Created learner: ${data.name}`);
    }

    console.log('\nTest Tutor Accounts:');
    tutorData.forEach((tutor) => {
      console.log(`- Email: ${tutor.email}, Password: ${tutor.password}`);
    });

    console.log('\nTest Learner Accounts:');
    learnerData.forEach((learner) => {
      console.log(`- Email: ${learner.email}, Password: ${learner.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedTutors();
