import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  TrendingUp, 
  Star,
  FileText,
  Filter,
  ArrowUpRight,
  Bell,
  X,
  Plus
} from 'lucide-react';
import profileAPI from '../../services/profileService';
import { useRequests } from '../../context/RequestContext';
import { emitUserOnline } from '../../services/socketService';
import RequestCard from '../../components/RequestCard';
import LiveLearnerStats from '../../components/LiveLearnerStats';

const TutorDashboard = () => {
  const context = useOutletContext();
  const navigate = useNavigate();
  const isDark = context ? context.isDark : false;
  const [activeTab, setActiveTab] = useState('Overview');
  const [userName, setUserName] = useState('');
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const {
    incomingRequests,
    fetchIncomingRequests,
    handleAcceptRequest,
    handleRejectRequest,
  } = useRequests();
  const [notifications] = useState([
    { id: 1, learner: 'John Doe', message: 'Booked a session for tomorrow at 2 PM', time: '5 mins ago', type: 'booking', bookingTime: '2 PM' },
    { id: 2, learner: 'Sarah Smith', message: 'Completed the previous session', time: '1 hour ago', type: 'completed', rating: 5 },
    { id: 3, learner: 'Mike Johnson', message: 'Requested to reschedule session', time: '2 hours ago', type: 'reschedule', from: '3 PM', to: '4 PM' },
  ]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const storedName = localStorage.getItem('userName');
      const userId = localStorage.getItem('userId');

      if (!token || role !== 'tutor') {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      setUserName(storedName);

      // Emit user online status
      emitUserOnline(userId, 'tutor');

      try {
        const data = await profileAPI.getTutorProfile();
        setTutorData(data.tutor);
        
        // Fetch incoming requests
        await fetchIncomingRequests();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
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
  }, [navigate, fetchIncomingRequests]);

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
    <div className="space-y-8 relative min-h-screen">
      {/* Live Learner Stats */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <LiveLearnerStats />
      </div>

      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            📬 Incoming Learning Requests ({incomingRequests.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incomingRequests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                onAccept={(requestId) =>
                  handleAcceptRequest(
                    requestId,
                    localStorage.getItem('userId'),
                    request.learnerId._id
                  )
                }
                onReject={(requestId, reason) =>
                  handleRejectRequest(
                    requestId,
                    localStorage.getItem('userId'),
                    request.learnerId._id,
                    reason
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-end">
        <button 
          onClick={() => setShowNotificationsModal(true)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden"
          title="View Notifications"
        >
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        </button>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-slate-900 w-full md:w-96 max-h-[80vh] rounded-t-3xl md:rounded-2xl overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h2>
              <button 
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">{notif.learner}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{notif.message}</p>
                        {notif.type === 'booking' && notif.bookingTime && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg w-fit">
                            <Calendar size={14} />
                            Session at {notif.bookingTime}
                          </div>
                        )}
                        {notif.type === 'completed' && notif.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(notif.rating)].map((_, i) => (
                              <span key={i} className="text-yellow-400">⭐</span>
                            ))}
                          </div>
                        )}
                        {notif.type === 'reschedule' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg w-fit">
                            <Clock size={14} />
                            Reschedule: {notif.from} → {notif.to}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2">{notif.time}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-bold transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white px-6 py-12 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-black mb-2">Welcome back, {userName}! 👋</h1>
        <p className="text-blue-100 dark:text-blue-200">Here is your teaching dashboard</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Students" value="24" icon={<Users size={24} />} />
        <StatCard title="Sessions Today" value="3" icon={<Calendar size={24} />} />
        <StatCard title="Completed" value="45" icon={<CheckCircle size={24} />} />
        <StatCard title="Rating" value="4.9/5" icon={<Star size={24} />} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Larger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Upcoming Sessions</h2>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Filter size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <SessionCard name="Alex Johnson" subject="Mathematics" time="2:00 PM" />
              <SessionCard name="Emma Wilson" subject="Physics" time="3:30 PM" />
              <SessionCard name="Lucas Brown" subject="Chemistry" time="4:45 PM" />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Your Performance</h2>
            <div className="space-y-4">
              <SkillProgress label="Student Satisfaction" value={85} />
              <SkillProgress label="Lesson Quality" value={92} />
              <SkillProgress label="Punctuality" value={98} />
              <SkillProgress label="Completion Rate" value={88} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                <Plus size={20} /> Schedule Session
              </button>
              <button className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={20} /> Send Message
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-600 dark:text-slate-400">✅ Session completed with John</p>
              <p className="text-slate-600 dark:text-slate-400">📝 Lesson notes added for Math</p>
              <p className="text-slate-600 dark:text-slate-400">⭐ New 5-star review received</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Components
function StatCard({ title, value, icon }) {
  return (
    <div className="group p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ name, subject, time }) {
  return (
    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-all duration-300">
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{name}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subject}</p>
      </div>
      <div className="text-sm font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg">
        {time}
      </div>
    </div>
  );
}

function SkillProgress({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{value}%</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
          style={{ width: value + '%' }}
        />
      </div>
    </div>
  );
}

export default TutorDashboard;
