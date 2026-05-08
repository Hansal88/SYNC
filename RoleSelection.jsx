import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://YOUR_RENDER_BACKEND_URL.onrender.com';

const RoleSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);

  const languagesList = ['Python', 'JavaScript', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP'];
  const techSkills = ['Web Development', 'Backend', 'Frontend', 'Machine Learning', 'Data Science', 'Cloud Computing', 'Cyber Security', 'DevOps'];

  const toggleSkill = (item, category) => {
    if (category === 'languages') {
      setLanguages(languages.includes(item) ? languages.filter(l => l !== item) : [...languages, item]);
    } else {
      setSkills(skills.includes(item) ? skills.filter(s => s !== item) : [...skills, item]);
    }
  };

  const handleCompleteSignup = async () => {
    if (!selectedRole) {
      alert('Please select a role (Learner or Tutor)');
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      // Update user with role and skills (if tutor)
      const updateData = {
        role: selectedRole,
      };

      if (selectedRole === 'tutor') {
        updateData.skills = skills;
        updateData.languages = languages;
      }

      await axios.put(
        `${API_BASE_URL}/users/${userId}/role`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update localStorage
      localStorage.setItem('userRole', selectedRole);
      if (selectedRole === 'tutor') {
        localStorage.setItem('tutorSkills', JSON.stringify(skills));
        localStorage.setItem('tutorLanguages', JSON.stringify(languages));
      }

      // Navigate based on role
      setTimeout(() => {
        if (selectedRole === 'tutor') {
          navigate('/TutorDashboard', { replace: true });
        } else {
          navigate('/dashboard/learner', { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error('Error updating role:', err);
      alert(err.response?.data?.message || 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              Phone verified! Now select how you want to use the platform
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Learner Option */}
            <button
              onClick={() => setSelectedRole('learner')}
              className={`p-6 rounded-2xl border-2 transition-all text-left
                ${
                  selectedRole === 'learner'
                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${selectedRole === 'learner' ? 'bg-blue-600/30' : 'bg-slate-700'}`}>
                  <GraduationCap className={selectedRole === 'learner' ? 'text-blue-400' : 'text-slate-400'} size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Learner</h3>
                  <p className="text-slate-400 text-sm">Find tutors & book sessions</p>
                </div>
              </div>
            </button>

            {/* Tutor Option */}
            <button
              onClick={() => setSelectedRole('tutor')}
              className={`p-6 rounded-2xl border-2 transition-all text-left
                ${
                  selectedRole === 'tutor'
                    ? 'bg-green-600/20 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${selectedRole === 'tutor' ? 'bg-green-600/30' : 'bg-slate-700'}`}>
                  <BookOpen className={selectedRole === 'tutor' ? 'text-green-400' : 'text-slate-400'} size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tutor</h3>
                  <p className="text-slate-400 text-sm">Teach & help learners</p>
                </div>
              </div>
            </button>
          </div>

          {/* Skills Selection for Tutors */}
          {selectedRole === 'tutor' && (
            <div className="space-y-6 mb-8 pb-8 border-b border-slate-800">
              {/* Programming Languages */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Programming Languages</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languagesList.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleSkill(lang, 'languages')}
                      className={`p-3 rounded-xl font-semibold transition-all ${
                        languages.includes(lang)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {techSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill, 'skills')}
                      className={`p-3 rounded-xl font-semibold transition-all text-sm ${
                        skills.includes(skill)
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleCompleteSignup}
            disabled={loading || !selectedRole}
            className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${
              !selectedRole || loading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                Setting up your profile...
              </>
            ) : (
              <>
                Complete Setup <ArrowRight size={20} />
              </>
            )}
          </button>

          {!selectedRole && (
            <p className="text-center text-slate-400 text-sm mt-4">👆 Please select a role to continue</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
