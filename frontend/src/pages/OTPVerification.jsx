import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, RefreshCw, Check, AlertCircle, Loader, BookOpen, GraduationCap } from "lucide-react";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [verified, setVerified] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const inputRefs = useRef([]);

  const languagesList = ["Python", "JavaScript", "Java", "C++", "TypeScript", "Go", "Rust", "Swift", "Kotlin", "PHP"];
  const techSkills = ["Web Development", "Backend", "Frontend", "Machine Learning", "Data Science", "Cloud Computing", "Cyber Security", "DevOps"];

  const email = location.state?.email || localStorage.getItem("pendingEmail");
  const userId = location.state?.userId || localStorage.getItem("pendingUserId");
  const isSignup = location.state?.isSignup || false;

  useEffect(() => {
    console.log('📧 [OTP PAGE] Component loaded');
    console.log('📧 [OTP PAGE] Email from state:', location.state?.email);
    console.log('📧 [OTP PAGE] Email from localStorage:', localStorage.getItem("pendingEmail"));
    console.log('📧 [OTP PAGE] isSignup:', location.state?.isSignup);
    
    // Redirect if no email to verify
    if (!email) {
      console.log('❌ [OTP PAGE] No email found, redirecting to signup');
      navigate("/signup", { replace: true });
      return;
    }

    console.log('✅ [OTP PAGE] Email found:', email);

    // Store email and userId in localStorage
    if (email) {
      localStorage.setItem("pendingEmail", email);
    }
    if (userId) {
      localStorage.setItem("pendingUserId", userId);
    }
  }, [email, navigate, userId]);

  // Timer for OTP expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setOtp(newOtp);
  };

  const toggleSkill = (item, category) => {
    if (category === 'languages') {
      setLanguages(languages.includes(item) ? languages.filter(l => l !== item) : [...languages, item]);
    } else {
      setSkills(skills.includes(item) ? skills.filter(s => s !== item) : [...skills, item]);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    if (timeLeft === 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('🔐 [OTP VERIFY] Verifying OTP for email:', email);
      console.log('🔐 [OTP VERIFY] OTP entered:', otpString);
      
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: email,
        otp: otpString,
      });

      console.log('✅ [OTP VERIFY] OTP verified successfully!');
      console.log('✅ [OTP VERIFY] Response:', response.data);

      // Store authentication info
      setSuccess("Email verified successfully!");
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user.id);
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name);
      localStorage.setItem("userEmail", response.data.user.email);
      localStorage.setItem("isEmailVerified", "true"); // Mark email as verified
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("pendingUserId");

      // If from signup, show role selection. Otherwise go to dashboard
      if (isSignup) {
        console.log('📋 [OTP VERIFY] Showing role selection screen');
        setVerified(true);
      } else {
        // Redirect after 1 second
        setTimeout(() => {
          if (response.data.user.role === "tutor") {
            navigate("/TutorDashboard", { replace: true });
          } else {
            navigate("/dashboard/learner", { replace: true });
          }
        }, 1000);
      }
    } catch (err) {
      console.error("❌ [OTP VERIFY] OTP verification failed:", err);
      console.error('❌ [OTP VERIFY] Error response:', err.response?.data);
      
      if (err.response?.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.response.data.attemptsRemaining);
      }
      
      setError(
        err.response?.data?.message ||
        "Failed to verify OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!selectedRole) {
      alert("Please select a role (Learner or Tutor)");
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      // Update user role on backend
      const updateData = {
        role: selectedRole,
      };

      if (selectedRole === "tutor") {
        updateData.skills = skills;
        updateData.languages = languages;
      }

      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update localStorage
      localStorage.setItem("userRole", selectedRole);
      
      if (selectedRole === "tutor") {
        localStorage.setItem("tutorSkills", JSON.stringify(skills));
        localStorage.setItem("tutorLanguages", JSON.stringify(languages));
      }

      // Navigate based on role
      setTimeout(() => {
        if (selectedRole === "tutor") {
          navigate("/TutorDashboard", { replace: true });
        } else {
          navigate("/dashboard/learner", { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error("Error updating role:", err);
      alert(err.response?.data?.message || "Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email: email,
      });

      setSuccess("OTP resent to your email!");
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(600); // Reset timer
      setAttemptsRemaining(5); // Reset attempts
      
      // Focus on first input
      inputRefs.current[0].focus();
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to resend OTP. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Role selection form for signup users
  if (verified && isSignup) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-purple-600/20 rounded-full mb-4">
                <BookOpen className="text-purple-500" size={32} />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                Choose Your Role
              </h2>
              <p className="text-slate-500 mt-2">
                Email verified! Now select how you want to use the platform
              </p>
            </div>

            {/* Role Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Learner Option */}
              <button
                onClick={() => setSelectedRole("learner")}
                className={`p-6 rounded-2xl border-2 transition-all text-left
                  ${
                    selectedRole === "learner"
                      ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${selectedRole === "learner" ? "bg-blue-600/30" : "bg-slate-700"}`}>
                    <GraduationCap className={selectedRole === "learner" ? "text-blue-400" : "text-slate-400"} size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Learner</h3>
                    <p className="text-slate-400 text-sm">Find tutors & book sessions</p>
                  </div>
                </div>
              </button>

              {/* Tutor Option */}
              <button
                onClick={() => setSelectedRole("tutor")}
                className={`p-6 rounded-2xl border-2 transition-all text-left
                  ${
                    selectedRole === "tutor"
                      ? "bg-green-600/20 border-green-500 shadow-lg shadow-green-500/20"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${selectedRole === "tutor" ? "bg-green-600/30" : "bg-slate-700"}`}>
                    <BookOpen className={selectedRole === "tutor" ? "text-green-400" : "text-slate-400"} size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Tutor</h3>
                    <p className="text-slate-400 text-sm">Teach & help learners</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Skills Selection for Tutors */}
            {selectedRole === "tutor" && (
              <div className="space-y-6 mb-8 pb-8 border-b border-slate-800">
                {/* Programming Languages */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Programming Languages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {languagesList.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleSkill(lang, 'languages')}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all
                          ${
                            languages.includes(lang)
                              ? "bg-blue-600/20 border-blue-500 text-blue-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Technical Skills */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Technical Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {techSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, 'skills')}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all text-left
                          ${
                            skills.includes(skill)
                              ? "bg-green-600/20 border-green-500 text-green-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleCompleteSignup}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                ${
                  selectedRole
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
            >
              <Check size={20} />
              Continue to Dashboard
            </button>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-400 text-sm">
                ✓ Email verified successfully! You can always change your role later in settings.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Need help?{" "}
            <a href="mailto:support@tutoring.com" className="text-blue-500 hover:underline font-semibold">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    );
  }

  // OTP Entry Form
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-600/20 rounded-full mb-4">
              <Mail className="text-blue-500" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Verify Email
            </h2>
            <p className="text-slate-500 mt-2">
              Enter the 6-digit OTP sent to
            </p>
            <p className="text-blue-400 font-semibold mt-1">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-400 font-semibold">{error}</p>
                {attemptsRemaining > 0 && attemptsRemaining < 5 && (
                  <p className="text-red-300 text-sm mt-1">
                    {attemptsRemaining} attempts remaining
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
              <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-400 font-semibold">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={verifyOTP} className="space-y-8">
            {/* OTP Input Fields */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300">
                Enter OTP Code
              </label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={timeLeft === 0 || success}
                    className={`w-12 h-12 text-center text-2xl font-bold rounded-lg border-2 transition-all
                      ${
                        timeLeft === 0
                          ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                          : digit
                          ? "bg-blue-600/10 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-700 text-white hover:border-slate-600"
                      }
                      focus:outline-none focus:border-blue-500 focus:bg-blue-600/10`}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <div>
                  <p className="text-slate-400 text-sm mb-2">OTP expires in</p>
                  <p className={`text-2xl font-bold ${timeLeft < 60 ? "text-red-500" : "text-blue-400"}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-semibold">OTP Expired</p>
                  <p className="text-red-300 text-sm mt-1">Please request a new OTP</p>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || timeLeft === 0 || otp.join("").length !== 6}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 
                ${
                  loading || timeLeft === 0 || otp.join("").length !== 6
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Verify OTP
                </>
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-500 text-sm mb-4">
              Didn't receive the OTP?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || timeLeft > 300}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                ${
                  resendLoading || timeLeft > 300
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300"
                }`}
            >
              {resendLoading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Resend OTP
                </>
              )}
            </button>
            {timeLeft > 300 && (
              <p className="text-center text-slate-500 text-xs mt-2">
                You can resend OTP in {formatTime(timeLeft - 300)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Need help?{" "}
          <a href="mailto:support@tutoring.com" className="text-blue-500 hover:underline font-semibold">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
