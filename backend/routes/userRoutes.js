const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// DEBUG: Check current user role
router.get('/me/role', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Current user role',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// DEBUG: Quick role update (for testing)
router.post('/me/role/:newRole', verifyToken, async (req, res) => {
  try {
    const { newRole } = req.params;
    const validRoles = ['learner', 'tutor'];
    
    if (!validRoles.includes(newRole.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role. Must be "learner" or "tutor"' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { role: newRole.toLowerCase() },
      { new: true }
    );

    console.log(`✅ Role updated for user ${user.email}: ${newRole}`);

    res.status(200).json({
      message: 'Role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

// CREATE - Add a new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // In production, hash the password!
      role,
      bio,
    });

    await newUser.save();
    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// READ - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// READ - Get a specific user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User retrieved successfully',
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// UPDATE - Update a user by ID
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, bio },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// DELETE - Delete a user by ID
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User deleted successfully',
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// UPDATE USER ROLE - Authenticated endpoint for updating user role after signup
router.put('/users/:id/role', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, skills, languages } = req.body;

    // Verify user is updating their own profile
    if (req.userId !== id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Validate role
    const validRoles = ['learner', 'tutor'];
    if (!role || !validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role. Must be either "learner" or "tutor"' });
    }

    const updateData = { role: role.toLowerCase() };

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Role updated successfully',
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

module.exports = router;
