import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://YOUR_RENDER_BACKEND_URL.onrender.com';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true);
    
    // Validate inputs
    if (!email || !email.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }
    if (!password || !password.trim()) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email: email.trim(), 
        password: password 
      });

      // Check if response has token
      if (res.data && res.data.token && res.data.user) {
        // Store authentication info
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user._id);
        localStorage.setItem('userRole', res.data.user.role);
        localStorage.setItem('userName', res.data.user.name);
        localStorage.setItem('userEmail', res.data.user.email);
        localStorage.setItem('isEmailVerified', res.data.user.isEmailVerified ? 'true' : 'false');

        // Navigate based on role
        if (res.data.user.role === 'tutor') {
          navigate('/TutorDashboard');
        } else {
          navigate('/dashboard/learner');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      let errorMessage = 'Login failed';
      
      if (err.response) {
        // Check if it's an email verification error
        if (err.response.status === 403 && err.response.data?.requiresOTPVerification) {
          // User exists but email not verified - redirect to OTP verification
          localStorage.setItem('userEmail', email.trim().toLowerCase());
          setError(err.response.data?.message || 'Email not verified. Please verify your email.');
          
          // Show button to go to verification
          setTimeout(() => {
            navigate('/verify-otp', { state: { email: email.trim().toLowerCase() } });
          }, 2000);
          return;
        }
        
        // Regular error from server
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check if the backend is running.';
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter">Sign In</h2>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-4 text-center border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              className="w-full bg-slate-950 border border-slate-800 text-white p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 transition-all disabled:opacity-50"
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              className="w-full bg-slate-950 border border-slate-800 text-white p-4 pl-12 pr-12 rounded-2xl outline-none focus:border-blue-500 transition-all disabled:opacity-50"
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/10 disabled:shadow-none"
          >
            {loading ? 'Signing in...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>

      {/* Added Signup Link below the card */}
      <p className="text-center text-slate-500 mt-8">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-500 font-bold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;