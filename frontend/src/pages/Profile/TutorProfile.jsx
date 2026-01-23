import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, Star, DollarSign, BookOpen, Users, Award, Calendar, Mail, Check, Loader } from 'lucide-react';
import profileService from '../../services/profileService';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const TutorProfile = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
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
    specialization: [],
    experience: 0,
    hourlyRate: 0,
    availability: [],
    certificates: [],
    students: 0,
    completedSessions: 0,
    rating: 0,
    reviews: 0,
  });

  const [editData, setEditData] = useState({...profileData});
  const [newSpecialization, setNewSpecialization] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const isVerified = localStorage.getItem('isEmailVerified') === 'true';
      if (!token || role !== 'tutor') {
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
      const data = await profileService.getTutorProfile();
      const isVerified = localStorage.getItem('isEmailVerified') === 'true';
      setIsEmailVerified(isVerified);
      
      const tutorData = {
        name: data.tutor?.userId?.name || '',
        email: data.tutor?.userId?.email || '',
        bio: data.tutor?.bio || '',
        specialization: data.tutor?.specialization || [],
        experience: data.tutor?.experience || 0,
        hourlyRate: data.tutor?.hourlyRate || 0,
        availability: data.tutor?.availability || [],
        certificates: data.tutor?.certificates || [],
        students: data.tutor?.students || 0,
        completedSessions: data.tutor?.completedSessions || 0,
        rating: data.tutor?.rating || 0,
        reviews: data.tutor?.reviews || 0,
      };
      setProfileData(tutorData);
      setEditData(tutorData);
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
      
      const response = await axios.post('http://localhost:5000/api/auth/resend-otp', {
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
      
      const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
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
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: (name === 'experience' || name === 'hourlyRate') ? parseFloat(value) : value,
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !editData.specialization.includes(newSpecialization)) {
      setEditData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization],
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec) => {
    setEditData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec),
    }));
  };

  const skillsData = {
    'Mathematics': ['Basic Mathematics', 'Algebra', 'Trigonometry', 'Geometry', 'Calculus', 'Linear Algebra', 'Statistics', 'Probability'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    '💻 Computer Science & IT': ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'PHP', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'React.js', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'Redis', 'REST APIs', 'GraphQL', 'Android Development', 'iOS Development', 'Flutter', 'React Native'],
    '🧠 Data, AI & Emerging Tech': ['Data Structures & Algorithms', 'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Science', 'Computer Vision', 'Natural Language Processing', 'Prompt Engineering', 'Generative AI'],
    '🧑‍💼 Engineering & Technical': ['Operating Systems', 'Computer Networks', 'Database Management Systems', 'Software Engineering', 'Cloud Computing', 'DevOps', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud'],
    '🎨 Design & Creative': ['UI/UX Design', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Canva', 'Motion Design'],
    '📱 Digital & Business': ['Digital Marketing', 'SEO', 'Content Writing', 'Technical Writing', 'Copywriting', 'Social Media Marketing', 'Email Marketing'],
    '📊 Business & Management': ['Project Management', 'Product Management', 'Agile & Scrum', 'Business Analysis', 'Entrepreneurship', 'Leadership', 'Communication Skills', 'Public Speaking'],
    '🎥 Media & Multimedia': ['Video Editing', 'Adobe Premiere Pro', 'Final Cut Pro', 'After Effects', 'Podcast Editing', 'YouTube Content Creation'],
    '🌍 Language & Communication': ['English Speaking', 'Interview Preparation', 'Resume Building', 'Soft Skills Training'],
  };

  const [skillsSearch, setSkillsSearch] = useState('');
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.skills-dropdown')) {
        setShowSkillsDropdown(false);
      }
    };
    
    if (showSkillsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSkillsDropdown]);

  const getAllSkills = () => {
    return Object.values(skillsData).flat();
  };

  const getFilteredSkills = () => {
    const allSkills = getAllSkills();
    const search = skillsSearch.toLowerCase();
    return allSkills.filter(skill => 
      skill.toLowerCase().includes(search) && 
      !editData.specialization.includes(skill)
    );
  };

  const handleAddSkill = (skill) => {
    if (editData.specialization.length < 10 && !editData.specialization.includes(skill)) {
      setEditData(prev => ({
        ...prev,
        specialization: [...prev.specialization, skill],
      }));
      setSkillsSearch('');
    }
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && editData.specialization.length < 10 && !editData.specialization.includes(customSkill)) {
      setEditData(prev => ({
        ...prev,
        specialization: [...prev.specialization, customSkill],
      }));
      setCustomSkill('');
    }
  };

  const toggleAvailability = (day) => {
    setEditData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        bio: editData.bio,
        specialization: editData.specialization,
        experience: editData.experience,
        hourlyRate: editData.hourlyRate,
        availability: editData.availability,
        certificates: editData.certificates,
      };
      
      await profileService.updateTutorProfile(updateData);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
    <div className={`w-full ${isDarkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Tutor Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-colors font-bold shadow-lg shadow-blue-500/30"
            >
              <Edit size={20} /> Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className={isDarkMode ? "bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-xl mb-6" : "bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6"}>
            {error}
          </div>
        )}

        {success && (
          <div className={isDarkMode ? "bg-green-900/30 border border-green-700/50 text-green-300 p-4 rounded-xl mb-6" : "bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6"}>
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className={isDarkMode ? "bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-950/50 p-8 mb-8" : "bg-white border border-slate-200 rounded-2xl shadow-lg p-8 mb-8"}>
          {/* User Info */}
          <div className={isDarkMode ? "border-b border-slate-800/50 pb-8 mb-8" : "border-b border-slate-200 pb-8 mb-8"}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        placeholder="Enter your name"
                        className={isDarkMode ? "w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none" : "w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        disabled
                        className={isDarkMode ? "w-full px-4 py-3 rounded-lg bg-slate-800/50 text-slate-500 cursor-not-allowed" : "w-full px-4 py-3 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Bio</label>
                      <textarea
                        name="bio"
                        value={editData.bio}
                        onChange={handleEditChange}
                        placeholder="Tell learners about yourself..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                        rows="4"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{profileData.name}</h2>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-slate-600">{profileData.email}</p>
                      {isEmailVerified ? (
                        <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
                          <Check size={16} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-200">
                          <Mail size={16} /> Unverified
                        </span>
                      )}
                    </div>
                    {!isEmailVerified && (
                      <button
                        onClick={handleSendVerificationOTP}
                        disabled={verifySending}
                        className="mt-3 flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/30"
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
                      <p className="text-slate-700 leading-relaxed mt-4">{profileData.bio}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {!isEditing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">Students</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{profileData.students}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-green-600" />
                  <span className="text-sm font-bold text-slate-700">Sessions</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{profileData.completedSessions}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={20} className="text-yellow-600" />
                  <span className="text-sm font-bold text-slate-700">Rating</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{profileData.rating.toFixed(1)}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-purple-600" />
                  <span className="text-sm font-bold text-slate-700">Reviews</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{profileData.reviews}</p>
              </div>
            </div>
          )}

          {/* Teaching Details */}
          <div className="space-y-8">
            {/* Hourly Rate */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign size={24} className="text-blue-600" />
                Teaching Rate
              </h3>
              {isEditing ? (
                <div className="flex items-center gap-4">
                  <span className="text-slate-700 font-bold">₹</span>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={editData.hourlyRate}
                    onChange={handleEditChange}
                    placeholder="Enter hourly rate"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                  />
                  <span className="text-slate-700 font-bold">/hour</span>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">₹{profileData.hourlyRate}/hour</p>
                </div>
              )}
            </div>

            {/* Experience */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={24} className="text-green-600" />
                Experience
              </h3>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={editData.experience}
                  onChange={handleEditChange}
                  placeholder="Years of experience"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                />
              ) : (
                <p className="text-lg text-slate-700">{profileData.experience} years of experience</p>
              )}
            </div>

            {/* Specializations */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Specializations</h3>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Skills Search */}
                  <div className="relative skills-dropdown">
                    <input
                      type="text"
                      value={skillsSearch}
                      onChange={(e) => setSkillsSearch(e.target.value)}
                      onFocus={() => setShowSkillsDropdown(true)}
                      placeholder="Search and add skills..."
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                    />
                    
                    {/* Dropdown with filtered skills */}
                    {showSkillsDropdown && (skillsSearch || true) && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                        {skillsSearch === '' ? (
                          // Show categorized skills when no search
                          Object.entries(skillsData).map(([category, skills]) => (
                            <div key={category}>
                              <div className="px-4 py-2 bg-slate-100 font-bold text-slate-700 sticky top-0">
                                {category}
                              </div>
                              {skills.map(skill => (
                                <button
                                  key={skill}
                                  onClick={() => handleAddSkill(skill)}
                                  disabled={editData.specialization.length >= 10 || editData.specialization.includes(skill)}
                                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                                    editData.specialization.includes(skill) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  } ${editData.specialization.length >= 10 && !editData.specialization.includes(skill) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          ))
                        ) : getFilteredSkills().length > 0 ? (
                          getFilteredSkills().map(skill => (
                            <button
                              key={skill}
                              onClick={() => handleAddSkill(skill)}
                              disabled={editData.specialization.length >= 10}
                              className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                                editData.specialization.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              {skill}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-slate-500">No matching skills found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Custom Skill Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Or add custom skill"
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                      disabled={editData.specialization.length >= 10}
                    />
                    <button
                      onClick={handleAddCustomSkill}
                      disabled={editData.specialization.length >= 10 || !customSkill.trim()}
                      className={`${
                        editData.specialization.length >= 10 || !customSkill.trim()
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30'
                      } text-white px-4 py-2 rounded-lg transition-colors font-bold`}
                    >
                      Add Custom
                    </button>
                  </div>

                  {/* Skills Limit Info */}
                  <div className="text-sm text-slate-600">
                    Skills selected: {editData.specialization.length}/10
                  </div>

                  {/* Selected Skills Chips */}
                  <div className="flex flex-wrap gap-2">
                    {editData.specialization.map((spec, idx) => (
                      <div key={idx} className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                        <span className="font-medium">{spec}</span>
                        <button
                          onClick={() => removeSpecialization(spec)}
                          className="ml-1 text-red-600 hover:text-red-700 font-bold text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.specialization.length > 0 ? (
                    profileData.specialization.map((spec, idx) => (
                      <span key={idx} className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-full font-semibold shadow-sm">
                        {spec}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-400">No specializations added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar size={24} className="text-purple-600" />
                Availability
              </h3>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleAvailability(day)}
                      className={`py-2 px-3 rounded-lg font-bold transition-colors ${
                        editData.availability.includes(day)
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-200 border border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {days.map((day) => (
                    <div
                      key={day}
                      className={`py-2 px-3 rounded-lg font-bold text-center ${
                        profileData.availability.includes(day)
                          ? 'bg-blue-100 border border-blue-300 text-blue-700'
                          : 'bg-slate-200 border border-slate-300 text-slate-500 line-through'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Verification Modal */}
        {showVerifyEmail && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-blue-100 border border-blue-300 rounded-full mb-4">
                  <Mail className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Verify Email</h2>
                <p className="text-slate-600 mt-2">Enter the 6-digit OTP sent to {profileData.email}</p>
              </div>

              {verifyError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
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
                      className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={verifyingEmail || otp.join('').length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3 shadow-lg shadow-blue-500/30"
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
                className="w-full bg-slate-200 border border-slate-300 text-slate-700 py-3 rounded-lg font-bold transition-colors hover:bg-slate-300"
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
              className="flex items-center gap-2 bg-slate-200 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-300 transition-colors font-bold disabled:opacity-50"
            >
              <X size={20} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-colors font-bold disabled:opacity-50 shadow-lg shadow-blue-500/30"
            >
              <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorProfile;

