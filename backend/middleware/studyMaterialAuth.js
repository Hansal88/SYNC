const jwt = require('jsonwebtoken');

/**
 * Middleware to enforce Tutor-only access
 * Used for folder creation, file uploads, deletions
 */
const requireTutor = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    
    // Get role from multiple possible field names
    const rawRole = decoded.role || decoded.userRole || 'unknown';
    req.userRole = String(rawRole).toLowerCase().trim();
    req.role = req.userRole;
    
    console.log('🔐 [requireTutor] Decoded token:', { userId: req.userId, rawRole, normalizedRole: req.userRole });

    // Explicit check for 'tutor'
    const isTutor = req.userRole === 'tutor';
    console.log(`🔐 [requireTutor] Is tutor check: ${isTutor} (role='${req.userRole}')`);
    
    if (!isTutor) {
      console.log(`❌ [requireTutor] REJECTED - Role is '${req.userRole}', not 'tutor'`);
      return res
        .status(403)
        .json({ message: 'This action is only available for tutors' });
    }

    console.log('✅ [requireTutor] APPROVED - User is tutor');
    next();
  } catch (error) {
    console.log('❌ [requireTutor] Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to verify authentication (Tutor or Learner)
 * Used for viewing folders and files
 */
const verifyStudyMaterial = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    
    // Support both 'role' and 'userRole' field names
    const userRole = decoded.role || decoded.userRole || 'unknown';
    req.userRole = userRole.toString().toLowerCase().trim();
    req.role = req.userRole; // Set both for compatibility

    console.log('🔐 Verify Auth - User Role:', req.userRole, '- User ID:', req.userId);

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  requireTutor,
  verifyStudyMaterial,
};
