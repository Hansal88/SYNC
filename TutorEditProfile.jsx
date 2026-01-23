import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import profileAPI from '../../services/profileService';

const TutorEditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bio: '',
    specialization: [],
    experience: 0,
    hourlyRate: 0,
    availability: [],
    certificates: [],
  });

  const [newSpecialization, setNewSpecialization] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token || role !== 'tutor') {
        navigate('/login', { replace: true });
        return;
      }
    };

    checkAuth();
    fetchProfileData();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await profileAPI.getTutorProfile();
      setFormData({
        bio: data.tutor.bio || '',
        specialization: data.tutor.specialization || [],
        experience: data.tutor.experience || 0,
        hourlyRate: data.tutor.hourlyRate || 0,
        availability: data.tutor.availability || [],
        certificates: data.tutor.certificates || [],
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' || name === 'hourlyRate' ? parseFloat(value) : value,
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specialization.includes(newSpecialization)) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization],
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec),
    }));
  };

  const toggleAvailability = (day) => {
    setFormData(prev => ({
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
      await profileAPI.updateTutorProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/TutorDashboard'), 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/TutorDashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-slate-800">Edit Tutor Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 mb-6">
            {success}
          </div>
        )}

        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Bio */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">About You</h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Write a brief bio about yourself and your teaching experience..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none h-24"
            />
          </div>

          {/* Experience & Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                max="60"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Hourly Rate ($)</label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Specializations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Specializations</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                placeholder="e.g., React, JavaScript, Web Development"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addSpecialization}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.specialization.map((spec, idx) => (
                <div
                  key={idx}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeSpecialization(spec)}
                    className="font-bold hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Availability</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {days.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.availability.includes(day)}
                    onChange={() => toggleAvailability(day)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/TutorDashboard')}
              className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorEditProfile;
