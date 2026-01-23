import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import profileAPI from '../../services/profileService';

const LearnerEditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bio: '',
    learningGoals: [],
    skillLevel: 'Beginner',
    weeklyHourGoal: 10,
  });

  const [newGoal, setNewGoal] = useState('');

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token || role !== 'learner') {
        navigate('/login', { replace: true });
        return;
      }
    };

    checkAuth();
    fetchProfileData();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await profileAPI.getLearnerProfile();
      setFormData({
        bio: data.learner.bio || '',
        learningGoals: data.learner.learningGoals || [],
        skillLevel: data.learner.skillLevel || 'Beginner',
        weeklyHourGoal: data.learner.weeklyHourGoal || 10,
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
      [name]: name === 'weeklyHourGoal' ? parseInt(value) : value,
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !formData.learningGoals.includes(newGoal)) {
      setFormData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, newGoal],
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter(g => g !== goal),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await profileAPI.updateLearnerProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard/learner'), 1500);
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
            onClick={() => navigate('/dashboard/learner')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-slate-800">Edit Learner Profile</h1>
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
              placeholder="Tell us about yourself and your learning journey..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none h-24"
            />
          </div>

          {/* Skill Level & Weekly Goal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Skill Level</label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Weekly Learning Goal (Hours)</label>
              <input
                type="number"
                name="weeklyHourGoal"
                value={formData.weeklyHourGoal}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Learning Goals</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="e.g., Learn React, Master JavaScript, Build Projects"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addGoal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.learningGoals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg"
                >
                  <span className="font-medium text-slate-700">{goal}</span>
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="text-red-600 hover:text-red-700 font-bold text-xl"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.learningGoals.length === 0 && (
                <p className="text-slate-500 text-sm italic">No learning goals added yet</p>
              )}
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
              onClick={() => navigate('/dashboard/learner')}
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

export default LearnerEditProfile;
