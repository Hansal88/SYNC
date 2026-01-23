import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { 
  UserPlus, Mail, Lock, User, GraduationCap, 
  Eye, EyeOff, Phone, ChevronRight, Check, BookOpen 
} from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91 ",
    password: "",
    confirmPassword: "",
    role: "", 
    skills: [],
    languages: []
  });

  const languagesList = ["Python", "JavaScript", "Java", "C++", "TypeScript", "Go", "Rust", "Swift", "Kotlin", "PHP"];
  const techSkills = ["Web Development", "Backend", "Frontend", "Machine Learning", "Data Science", "Cloud Computing", "Cyber Security", "DevOps"];

  // Logic: Only redirect if a FULL valid session exists. 
  // If user manually goes to /signup, we ensure they can actually see the page.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      navigate(role === 'tutor' ? '/TutorDashboard' : '/dashboard/learner', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSelection = (item, category) => {
    const currentList = formData[category];
    const newList = currentList.includes(item)
      ? currentList.filter(i => i !== item)
      : [...currentList, item];
    setFormData({ ...formData, [category]: newList });
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!hasUpperCase) {
      return { valid: false, message: "Password must contain at least one capital letter (A-Z)" };
    }
    if (!hasSpecialChar) {
      return { valid: false, message: "Password must contain at least one special character (!@#$%^&*)" };
    }
    return { valid: true, message: "Password is strong" };
  };

  const handleInitialSignup = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      alert("Please enter your email");
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      alert(passwordValidation.message);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setStep(2);
  };

  const submitFinalData = async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    try {
      const trimmedName = formData.name.trim();
      const trimmedEmail = formData.email.trim();
      
      console.log('🔐 [SIGNUP] Starting signup');
      console.log('🔐 [SIGNUP] Name:', trimmedName);
      console.log('🔐 [SIGNUP] Email:', trimmedEmail);
      console.log('🔐 [SIGNUP] Sending request to backend...');
      
      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        role: "learner",
        bio: "",
      }, {
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('✅ [SIGNUP] Response received from backend');
      console.log('✅ [SIGNUP] Status:', response.status);
      console.log('✅ [SIGNUP] Data:', response.data);
      
      const { userId, email } = response.data;
      
      if (userId) {
        console.log('✅ [SIGNUP] User created with ID:', userId);
        console.log('✅ [SIGNUP] Email verified to:', email);
        
        // Store data in localStorage
        localStorage.setItem('pendingEmail', trimmedEmail);
        localStorage.setItem('pendingUserId', userId);
        
        console.log('✅ [SIGNUP] Data stored in localStorage');
        
        // Show success alert
        alert('✅ Signup successful!\n\nOTP sent to: ' + trimmedEmail + '\n\nCheck your email (including spam folder) for the 6-digit code.');
        
        // Navigate to OTP verification page
        console.log('🔄 [SIGNUP] Navigating to OTP verification page...');
        setLoading(false);
        
        navigate("/verify-otp", { 
          state: { 
            email: trimmedEmail,
            userId: userId,
            phone: formData.phone,
            isSignup: true
          }
        });
        
        console.log('🔄 [SIGNUP] Navigation complete');
      } else {
        console.error('❌ [SIGNUP] No userId in response');
        setLoading(false);
        alert('❌ Error: No user ID returned from server');
      }
    } catch (err) {
      console.error('❌ [SIGNUP] Exception caught:', err);
      
      let errorMessage = "Signup failed. Please try again.";
      
      if (err.response) {
        // Server responded with error
        console.error('❌ [SIGNUP] Server error - Status:', err.response.status);
        console.error('❌ [SIGNUP] Server error - Data:', err.response.data);
        errorMessage = err.response.data?.message || "Server error. Please try again.";
      } else if (err.request) {
        // Request made but no response
        console.error('❌ [SIGNUP] Network error - No response from backend');
        errorMessage = "Cannot connect to server. Make sure backend is running on port 5000.";
      } else {
        // Request setup error
        console.error('❌ [SIGNUP] Error:', err.message);
        errorMessage = err.message;
      }
      
      setLoading(false);
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-left">
      <div className={`w-full transition-all duration-500 max-w-md`}>
        <div className="flex justify-center gap-2 mb-8">
          {[1].map((i) => (
            <div key={i} className={`h-1 w-12 rounded-full transition-all bg-blue-600`} />
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          {step === 1 && (
            <form onSubmit={handleInitialSignup} className="space-y-5">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Create Account</h2>
                <p className="text-slate-500 mt-2">Join the skill exchange community</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input name="name" type="text" placeholder="Full Name" required className="signup-input" onChange={handleChange} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input name="email" type="email" placeholder="Email Address" required className="signup-input" onChange={handleChange} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input name="phone" type="text" value={formData.phone} className="signup-input" onChange={handleChange} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required className="signup-input" onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input name="confirmPassword" type="password" placeholder="Confirm Password" required className="signup-input" onChange={handleChange} />
                </div>
                <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                  <p className="text-blue-400 text-sm">
                    <strong>Note:</strong> After signing up, you'll need to verify your email with an OTP before you can select your profile type (Learner/Tutor).
                  </p>
                </div>
              </div>
              <button 
                onClick={submitFinalData}
                disabled={loading}
                className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group ${
                  loading 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-400 rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send Verification Code <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-slate-500 mt-8">
          Already have an account? <Link to="/login" className="text-blue-500 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;