import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Star, LogOut } from 'lucide-react';
import profileAPI from '../../services/profileService';
import { useRequests } from '../../context/RequestContext';
import { emitUserOnline } from '../../services/socketService';
import LiveTutorStats from '../../components/LiveTutorStats';
import RequestStatus from '../../components/RequestStatus';
import DailyLearningStreak from '../../components/DailyLearningStreak';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const [learnerData, setLearnerData] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { sentRequests, fetchSentRequests } = useRequests();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('userName');
      const userId = localStorage.getItem('userId');

      if (!token || role !== 'learner') {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      setUserName(storedName);

      // Emit user online status
      emitUserOnline(userId, 'learner');

      try {
        const data = await profileAPI.getLearnerProfile();
        setLearnerData(data.learner);
        
        // Fetch sent requests
        await fetchSentRequests();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching learner profile:', err);
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    checkAuthAndFetchData();

    window.addEventListener('pageshow', checkAuthAndFetchData);
    window.addEventListener('focus', checkAuthAndFetchData);

    return () => {
      window.removeEventListener('pageshow', checkAuthAndFetchData);
      window.removeEventListener('focus', checkAuthAndFetchData);
    };
  }, [navigate, fetchSentRequests]);

  const handleLogout = async () => {
    try {
      await profileAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full">
      {/* Centered Container with Balanced Max Width */}
      <div className="w-full">
        
        {/* Top Section: Welcome Back + Live Tutors Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Welcome Back Card */}
          <div className="group relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-xl border border-blue-200/50 dark:border-slate-700/50 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 min-h-[250px] flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome back, {userName || 'Learner'}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-4">Here's your learning progress for today.</p>
            </div>
          </div>

          {/* Live Tutor Stats Card */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 min-h-[250px] flex flex-col justify-center">
              <LiveTutorStats />
            </div>
          </div>
        </div>

        {/* Request Status Section */}
        {sentRequests.length > 0 && (
          <div className="mb-10 space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              📬 My Learning Requests
            </h2>
            <RequestStatus requests={sentRequests} isLoading={loading} />
          </div>
        )}

        {/* Stats Cards - Centered Grid (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12 max-w-2xl mx-auto">
          <StatCard title="Skill Level" value={learnerData?.skillLevel || 'Beginner'} icon={<Star size={20}/>} />
          <StatCard title="Current Week" value={`${learnerData?.currentWeekHours || 0}/${learnerData?.weeklyHourGoal || 10}h`} icon={<PlayCircle size={20}/>} />
        </div>

        {/* Main Content Grid: Centered Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          
          {/* Left Column: Weekly Goal Progress */}
          <div className="group relative overflow-hidden rounded-[2rem]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 opacity-100 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-t from-white to-transparent transition-opacity duration-300"></div>
            <div className="relative p-8 text-white shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-300 group-hover:scale-105 group-hover:-translate-y-1 transform rounded-[2rem]">
              <h4 className="font-bold mb-4 text-lg">Weekly Goal Progress</h4>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black">{learnerData?.currentWeekHours || 0}/{learnerData?.weeklyHourGoal || 10}</span>
                <span className="text-sm font-medium opacity-80 mb-1">hours</span>
              </div>
              <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-white via-blue-100 to-blue-50 h-full rounded-full transition-all duration-1000 shadow-lg shadow-white/50" 
                  style={{ width: `${((learnerData?.currentWeekHours || 0) / (learnerData?.weeklyHourGoal || 10)) * 100}%` }} 
                />
              </div>
              <p className="text-xs mt-4 opacity-90">
                {(learnerData?.weeklyHourGoal || 10) - (learnerData?.currentWeekHours || 0)} more hours to reach your goal!
              </p>
            </div>
          </div>

          {/* Right Column: Daily Learning Streak */}
          <div className="relative">
            <DailyLearningStreak learnerData={learnerData} />
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-end">
        <a 
          href="/profile"
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden"
          title="Edit Profile"
        >
          <span className="text-xl group-hover:animate-spin">⚙️</span>
        </a>
        <a 
          href="/tutors"
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden animate-float"
          title="Find Tutors"
        >
          <span className="text-xl">🎓</span>
        </a>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon }) => (
  <div className="relative group overflow-hidden rounded-2xl">
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="relative bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">{value}</p>
        </div>
        <div className="text-blue-600 dark:text-blue-400 opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
      </div>
    </div>
  </div>
);

export default LearnerDashboard;