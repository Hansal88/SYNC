import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import profileAPI from '../services/profileService';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [showMenu, setShowMenu] = useState(false);

  const handleSignupClick = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    // If fully logged in, go to dashboard
    if (token && role) {
      navigate(role === "tutor" ? "/TutorDashboard" : "/dashboard/learner");
    } else {
      // Otherwise, go to signup
      navigate("/signup");
    }
  };

  const handleLogout = async () => {
    try {
      await profileAPI.logout();
      setIsLoggedIn(false);
      setUserName('');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API fails
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            Skill<span className="text-blue-600">Exchange</span>
          </h1>
        </Link>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
          {isLoggedIn ? (
            <>
              <Link to="/tutors" className="hover:text-blue-600 transition-colors">Find Tutors</Link>
              <Link to="/chat" className="hover:text-blue-600 transition-colors">Messages</Link>
              <Link to="/bookings" className="hover:text-blue-600 transition-colors">Bookings</Link>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-blue-600 transition-colors">Explore</Link>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            </>
          )}
        </div>

        <div className="flex items-center space-x-5">
          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">{userName}</span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate("/login")}
                className="hidden md:block text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Log in
              </button>
              
              <button 
                onClick={handleSignupClick} 
                className="hidden md:block bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-gray-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95"
              >
                Signup
              </button>
            </>
          )}

          {/* Mobile menu button */}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMenu && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-3">
          {isLoggedIn ? (
            <>
              <p className="text-sm font-semibold text-gray-700 px-4 py-2">{userName}</p>
              <Link to="/tutors" className="block text-sm font-semibold text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">Find Tutors</Link>
              <Link to="/chat" className="block text-sm font-semibold text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">Messages</Link>
              <Link to="/bookings" className="block text-sm font-semibold text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">Bookings</Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate("/login")}
                className="w-full text-sm font-semibold text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={handleSignupClick} 
                className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all"
              >
                Signup
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;