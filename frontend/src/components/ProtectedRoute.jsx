import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * ProtectedRoute Component
 * 
 * This component protects routes that require:
 * 1. Valid JWT token (user is authenticated)
 * 2. Email verification (isEmailVerified === true)
 * 3. Optional: Specific role requirement (learner/tutor)
 * 
 * If conditions fail, user is redirected appropriately
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const isEmailVerified = localStorage.getItem('isEmailVerified') === 'true';
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Simulate checking auth status (replace with actual API call if needed)
    setIsChecking(false);
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Step 1: Check if user is authenticated (has token)
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Step 2: Check if email is verified (STRICT REQUIREMENT)
  if (!isEmailVerified) {
    return <Navigate to="/verify-otp" state={{ from: location, requiresVerification: true }} replace />;
  }

  // Step 3: Check if user has the required role (if specified)
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // All checks passed - render the protected component
  return children;
};

export default ProtectedRoute;