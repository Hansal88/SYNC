const jwt = require('jsonwebtoken');

/**
 * Middleware to verify that user has completed email verification
 * This middleware should be applied to ALL protected routes
 * 
 * Usage: router.post('/protected-route', verifyEmail, controller)
 */
const verifyEmail = async (req, res, next) => {
  try {
    // Check if JWT token exists
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token found. Please login.',
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please login again.',
          expired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Attach user info to request
    req.user = decoded;

    // Note: Email verification check happens in the route handler
    // because we need access to the database to check the user's status
    // This middleware just verifies the token is valid
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
};

/**
 * Middleware to verify BOTH token AND email verification status
 * This is more comprehensive and checks database
 */
const verifyEmailWithDB = (User) => {
  return async (req, res, next) => {
    try {
      // Verify token first
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No authentication token found. Please login.',
        });
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please login again.',
            expired: true,
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token.',
        });
      }

      // Get user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email to access this feature.',
          needsVerification: true,
          email: user.email,
        });
      }

      // Attach user to request
      req.user = {
        ...decoded,
        isEmailVerified: user.isEmailVerified,
      };

      next();
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying email status. Please try again.',
      });
    }
  };
};

module.exports = {
  verifyEmail,
  verifyEmailWithDB,
};
