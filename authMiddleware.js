const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Centralized authentication middleware
 * Verifies JWT token and attaches userId and role to req object
 * Sets: req.userId, req.role, req.user (for backward compatibility)
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        error: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set userId and role for easy access
    req.userId = decoded.userId;
    req.role = decoded.role;
    
    // Keep req.user for backward compatibility
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'Please login again' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'Authentication failed' 
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication error',
      error: error.message 
    });
  }
};

/**
 * Optional token verification - doesn't fail if no token
 * Useful for routes that work with or without authentication
 */
const optionalVerifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.role = decoded.role;
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * Usage: verifyToken, requireRole('tutor')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Please login first' 
      });
    }
    
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: `This route requires one of these roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  requireRole,
};
