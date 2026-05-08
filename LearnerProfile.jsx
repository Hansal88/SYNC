import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, BookOpen, Target, Award, TrendingUp, Mail, Check, Loader } from 'lucide-react';
import profileService from '../../services/profileService';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://YOUR_RENDER_BACKEND_URL.onrender.com';

const LearnerProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [verifySending, setVerifySending] = useState(false);
  const [otpRefInputs, setOtpRefInputs] = useState([]);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    learningGoals: [],
    skillLevel: 'Beginner',
    weeklyHourGoal: 10,
    hoursLearned: 0,
    completedCourses: 0,
    badges: [],
  });

  const [editData, setEditData] = useState({...profileData});
  const [newGoal, setNewGoal] = useState('');

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const isVerified = localStorage.getItem('isEmailVerified') === 'true';
      if (!token || role !== 'learner') {
        navigate('/login', { replace: true });
        return;
      }
      setIsEmailVerified(isVerified);
    };

    checkAuth();
    fetchProfileData();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileService.getLearnerProfile();
      const isVerified = localStorage.getItem('isEmailVerified') === 'true';
      setIsEmailVerified(isVerified);
      
      const learnerData = {
        name: data.learner?.userId?.name || '',
        email: data.learner?.userId?.email || '',
        bio: data.learner?.bio || '',
        learningGoals: data.learner?.learningGoals || [],
        skillLevel: data.learner?.skillLevel || 'Beginner',
        weeklyHourGoal: data.learner?.weeklyHourGoal || 10,
        hoursLearned: data.learner?.hoursLearned || 0,
        completedCourses: data.learner?.completedCourses || 0,
        badges: data.learner?.badges || [],
      };
      setProfileData(learnerData);
      setEditData(learnerData);
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationOTP = async () => {
    try {
      setVerifySending(true);
      setVerifyError('');
      
      const response = await axios.post(`${API_BASE_URL}/auth/resend-otp`, {
        email: profileData.email,
      });
      
      setShowVerifyEmail(true);
      setOtp(['', '', '', '', '', '']);
      setSuccess('OTP sent to your email!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setVerifyError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setVerifySending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5 && otpRefInputs[index + 1]) {
      otpRefInputs[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpRefInputs[index - 1]) {
      otpRefInputs[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setVerifyError('Please enter a 6-digit OTP');
      return;
    }
    
    try {
      setVerifyingEmail(true);
      setVerifyError('');
      
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: profileData.email,
        otp: otpString,
      });
      
      localStorage.setItem('isEmailVerified', 'true');
      setIsEmailVerified(true);
      setShowVerifyEmail(false);
      setOtp(['', '', '', '', '', '']);
      setSuccess('Email verified successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setVerifyError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: name === 'weeklyHourGoal' ? parseInt(value) : value,
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !editData.learningGoals.includes(newGoal)) {
      setEditData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, newGoal],
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal) => {
    setEditData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter(g => g !== goal),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        bio: editData.bio,
        learningGoals: editData.learningGoals,
        skillLevel: editData.skillLevel,
        weeklyHourGoal: editData.weeklyHourGoal,
      };
      
      await profileService.updateLearnerProfile(updateData);
      setProfileData(editData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="w-full p-8 bg-white dark:bg-slate-800 rounded-lg">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 bg-white dark:bg-slate-800 rounded-lg">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-lg">
          <p className="font-bold text-lg mb-2">Error Loading Profile</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Floating Action Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Learner Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all duration-300 font-bold hover:scale-105 hover:shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Edit size={20} /> Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 shadow-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-xl mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          {/* User Info */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={editData.bio}
                        onChange={handleEditChange}
                        placeholder="Tell tutors about yourself..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="4"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{profileData.name}</h2>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-slate-600 dark:text-slate-400">{profileData.email}</p>
                      {isEmailVerified ? (
                        <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                          <Check size={16} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
                          <Mail size={16} /> Unverified
                        </span>
                      )}
                    </div>
                    {!isEmailVerified && (
                      <button
                        onClick={handleSendVerificationOTP}
                        disabled={verifySending}
                        className="mt-3 flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifySending ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail size={16} />
                            Verify Email Now
                          </>
                        )}
                      </button>
                    )}
                    {profileData.bio && (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">{profileData.bio}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {!isEditing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Courses</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.completedCourses}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-green-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Hours</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.hoursLearned}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-purple-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Badges</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.badges.length}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} className="text-orange-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Level</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.skillLevel}</p>
              </div>
            </div>
          )}

          {/* Learning Details */}
          <div className="space-y-8">
            {/* Skill Level */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target size={24} className="text-orange-600" />
                Skill Level
              </h3>
              {isEditing ? (
                <select
                  name="skillLevel"
                  value={editData.skillLevel}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-300">{profileData.skillLevel}</p>
                </div>
              )}
            </div>

            {/* Weekly Goal */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-600" />
                Weekly Learning Goal
              </h3>
              {isEditing ? (
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="weeklyHourGoal"
                    value={editData.weeklyHourGoal}
                    onChange={handleEditChange}
                    placeholder="Hours per week"
                    min="1"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-bold">hours/week</span>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-3xl font-bold text-green-600">{profileData.weeklyHourGoal} hours/week</p>
                </div>
              )}
            </div>

            {/* Learning Goals */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target size={24} className="text-blue-600" />
                Learning Goals
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add a learning goal"
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    />
                    <button
                      onClick={addGoal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editData.learningGoals.map((goal, idx) => (
                      <div key={idx} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg flex items-center gap-2">
                        <span>{goal}</span>
                        <button
                          onClick={() => removeGoal(goal)}
                          className="ml-2 text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.learningGoals.length > 0 ? (
                    profileData.learningGoals.map((goal, idx) => (
                      <span key={idx} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg font-semibold">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No learning goals added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Badges */}
            {!isEditing && profileData.badges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award size={24} className="text-purple-600" />
                  Badges Earned
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileData.badges.map((badge, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-100 dark:from-purple-900/50 to-purple-50 dark:to-purple-900/20 rounded-lg p-4 text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <p className="font-bold text-purple-800 dark:text-purple-200">{badge}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Verification Modal */}
        {showVerifyEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <Mail className="text-blue-600 dark:text-blue-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Email</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Enter the 6-digit OTP sent to {profileData.email}</p>
              </div>

              {verifyError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {verifyError}
                </div>
              )}

              <div className="mb-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefInputs[index] = el;
                        setOtpRefInputs([...otpRefInputs]);
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={verifyingEmail || otp.join('').length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                {verifyingEmail ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Verify Email
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowVerifyEmail(false);
                  setOtp(['', '', '', '', '', '']);
                  setVerifyError('');
                }}
                className="w-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-lg font-bold transition-colors hover:bg-slate-400 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors font-bold disabled:opacity-50"
            >
              <X size={20} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-bold disabled:opacity-50"
            >
              <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerProfile;
