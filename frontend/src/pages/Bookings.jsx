import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, DollarSign, Check, X, AlertCircle, Briefcase, User, MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import bookingService from '../services/bookingService';
import profileService from '../services/profileService';
import ReviewModal from '../components/ReviewModal';
import useSessionReviewTrigger from '../hooks/useSessionReviewTrigger';

export default function Bookings() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [userRole, setUserRole] = useState('learner');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  
  // 🎯 REVIEW TRIGGER INTEGRATION
  const { pendingReviewSession, clearPendingReview } = useSessionReviewTrigger();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const role = localStorage.getItem('userRole');
        setUserRole(role || 'learner');

        let response;
        if (role === 'tutor') {
          response = await profileService.getTutorProfile();
          setCurrentUser(response.tutor || response.data?.tutor || {});
        } else {
          response = await profileService.getLearnerProfile();
          setCurrentUser(response.learner || response.data?.learner || {});
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        // Set empty object so bookings can still load
        setCurrentUser({});
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      // Don't wait for currentUser - just use userRole from localStorage
      const role = localStorage.getItem('userRole') || 'learner';
      
      setLoading(true);
      setError('');
      try {
        let response;
        if (role === 'tutor') {
          response = await bookingService.getTutorBookings(filter === 'all' ? null : filter);
        } else {
          response = await bookingService.getLearnerBookings(filter === 'all' ? null : filter);
        }

        setBookings(response.data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load bookings';
        setError(errorMessage);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userRole, filter]);

  const handleStatusChange = async (bookingId, newStatus, reason = '') => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus, reason);

      // Refresh bookings
      let response;
      if (userRole === 'tutor') {
        response = await bookingService.getTutorBookings(filter === 'all' ? null : filter);
      } else {
        response = await bookingService.getLearnerBookings(filter === 'all' ? null : filter);
      }
      setBookings(response.data || []);
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await bookingService.deleteBooking(bookingId);
      setBookings(bookings.filter((b) => b._id !== bookingId));
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Failed to delete booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Show loading only on initial load
  if (loading && bookings.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
      {/* 🎯 REVIEW MODAL - Auto-triggers when session is completed */}
      {pendingReviewSession && (
        <ReviewModal 
          session={pendingReviewSession}
          onClose={clearPendingReview}
        />
      )}

      {/* Animated Background Orbs */}
      <div className="fixed top-20 -left-40 w-80 h-80 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Briefcase size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {userRole === 'tutor' ? 'My Sessions' : 'My Bookings'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {userRole === 'tutor'
                  ? '🎓 Manage your teaching sessions'
                  : '📚 View and manage your tutoring bookings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/40 scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
              }`}
            >
              {status === 'all' && '📋'}
              {status === 'pending' && '⏳'}
              {status === 'confirmed' && '✅'}
              {status === 'completed' && '🎉'}
              {status === 'cancelled' && '❌'}
              {' '}{status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-700 dark:text-red-400 shadow-lg animate-shake">
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400"></div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800/50 rounded-3xl p-16 text-center transform transition-all hover:scale-105">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-2">
              {userRole === 'tutor' ? 'No sessions booked yet' : 'No bookings yet'}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base mb-6">
              {userRole === 'tutor'
                ? 'Your sessions will appear here when learners book with you'
                : 'Search for tutors and book a session to get started on your learning journey'}
            </p>
            {userRole === 'learner' && (
              <button
                onClick={() => {
                  const userRole = localStorage.getItem('userRole') || 'learner';
                  const basePath = userRole === 'tutor' ? '/TutorDashboard' : '/dashboard/learner';
                  navigate(basePath + '/tutors');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Explore Tutors →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={booking._id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <BookingCard
                  booking={booking}
                  userRole={userRole}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteBooking}
                  getStatusColor={getStatusColor}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, userRole, onStatusChange, onDelete, getStatusColor }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const otherUser = userRole === 'tutor' ? booking.learnerId : booking.tutorId;
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  
  // Handle case where otherUser might be populated or just an ID
  const otherUserName = otherUser?.name || 'Unknown User';
  const otherUserEmail = otherUser?.email || '';

  const getStatusEmoji = (status) => {
    switch(status) {
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div 
      className="group bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-md hover:shadow-2xl dark:hover:shadow-xl dark:hover:shadow-blue-900/50 transition-all duration-300 cursor-pointer transform hover:scale-102 hover:-translate-y-1"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{booking.subject}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5 truncate">
              👤 {otherUserName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
            booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 shadow-lg shadow-green-500/20' :
            booking.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-lg shadow-blue-500/20' :
            booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 shadow-lg shadow-red-500/20' :
            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 shadow-lg shadow-yellow-500/20'
          }`}>
            {getStatusEmoji(booking.status)}
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b-2 border-slate-200 dark:border-slate-700">
        {/* Date & Time */}
        <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100/50 dark:hover:bg-blue-500/20 transition-colors">
          <Calendar size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">📅 Date & Time</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-1 truncate">
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 p-3 bg-purple-50/50 dark:bg-purple-500/10 rounded-xl hover:bg-purple-100/50 dark:hover:bg-purple-500/20 transition-colors">
          <Clock size={24} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">⏱️ Duration</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              {Math.round((endDate - startDate) / 60000)} min
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {Math.round((endDate - startDate) / 3600000)} hours
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-500/10 rounded-xl hover:bg-green-100/50 dark:hover:bg-green-500/20 transition-colors">
          <DollarSign size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">💰 Total Price</p>
            <p className="font-black text-slate-900 dark:text-white text-lg mt-1 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              ${booking.price}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      {isExpanded && (
        <div className="space-y-4 pb-6 border-b-2 border-slate-200 dark:border-slate-700 animate-fade-in">
          {/* Notes */}
          {booking.notes && (
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">📝 Notes</p>
              <p className="text-slate-800 dark:text-slate-200">{booking.notes}</p>
            </div>
          )}

          {/* Cancellation Reason */}
          {booking.cancellationReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400 font-bold mb-2">⚠️ Cancellation Reason</p>
              <p className="text-red-600 dark:text-red-300">{booking.cancellationReason}</p>
            </div>
          )}

          {/* Email Info */}
          {otherUserEmail && (
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl flex items-center gap-3">
              <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contact</p>
                <p className="text-slate-800 dark:text-slate-200">{otherUserEmail}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-4">
        {booking.status === 'pending' && (
          <>
            {userRole === 'tutor' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(booking._id, 'confirmed');
                  }}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <Check size={18} />
                  Confirm
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const reason = window.prompt('Reason for cancellation:');
                if (reason) onStatusChange(booking._id, 'cancelled', reason);
              }}
              className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <X size={18} />
              Cancel
            </button>
          </>
        )}

        {booking.status === 'confirmed' && userRole === 'tutor' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(booking._id, 'completed');
            }}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <Check size={18} />
            Mark as Complete
          </button>
        )}

        {booking.status === 'cancelled' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(booking._id);
            }}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Click to expand hint */}
      {!isExpanded && (
        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand details ↓
        </div>
      )}
    </div>
  );
}
