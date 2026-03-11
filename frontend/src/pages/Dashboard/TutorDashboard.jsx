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
  X,
  Plus,
  Trash2,
  Bell
} from 'lucide-react';
import profileAPI from '../../services/profileService';
import { useRequests } from '../../context/RequestContext';
import { emitUserOnline, onTutorRatingUpdated, offTutorRatingUpdated, onReviewCompleted, offReviewCompleted } from '../../services/socketService';
import { useTheme } from '../../context/ThemeContext';
import RequestCard from '../../components/RequestCard';
import LiveLearnerStats from '../../components/LiveLearnerStats';
import ChatBot from '../../components/ChatBot';

const TutorDashboard = () => {
  const context = useOutletContext();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [userName, setUserName] = useState('');
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 🎯 RATING SYSTEM: Real-time rating state
  const [tutorRating, setTutorRating] = useState('0/5');
  const [recentReview, setRecentReview] = useState(null);
  const [showReviewNotification, setShowReviewNotification] = useState(false);
  
  // Notes State
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionLearner, setSessionLearner] = useState('');
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [sessionStartPeriod, setSessionStartPeriod] = useState('AM');
  const [sessionEndTime, setSessionEndTime] = useState('');
  const [sessionEndPeriod, setSessionEndPeriod] = useState('AM');
  const [upcomingSessions, setUpcomingSessions] = useState([
   
  ]);

  const {
    incomingRequests,
    fetchIncomingRequests,
    handleAcceptRequest,
    handleRejectRequest,
  } = useRequests();

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
      emitUserOnline(userId, 'tutor');

      // Load notes from localStorage
      const savedNotes = JSON.parse(localStorage.getItem('tutorNotes') || '[]');
      setNotes(savedNotes);

      // Load sessions from localStorage
      const savedSessions = JSON.parse(localStorage.getItem('tutorSessions') || '[]');
      setUpcomingSessions(savedSessions);

      try {
        const data = await profileAPI.getTutorProfile();
        setTutorData(data.tutor);
        
        // 🎯 SET INITIAL RATING FROM TUTOR PROFILE
        if (data.tutor?.ratingStats?.averageRating) {
          const rating = data.tutor.ratingStats.averageRating.toFixed(1);
          setTutorRating(`${rating}/5`);
        }
        
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

  // 🎯 SOCKET LISTENERS: Real-time rating updates
  useEffect(() => {
    // Listen for tutor rating updates
    const handleTutorRatingUpdated = (data) => {
      console.log('⭐ Tutor rating updated in real-time:', data);
      
      if (data?.averageRating) {
        const rating = data.averageRating.toFixed(1);
        setTutorRating(`${rating}/5`);
        
        // Also update tutorData
        setTutorData(prev => ({
          ...prev,
          ratingStats: {
            averageRating: data.averageRating,
            totalReviews: data.totalReviews,
            ratingBreakdown: data.ratingBreakdown
          }
        }));
      }
    };

    // Listen for review completion (immediate notification)
    const handleReviewCompleted = (data) => {
      console.log('📬 New review received!', data);
      
      // Store recent review
      setRecentReview({
        learnerName: data.learnerName,
        rating: data.rating,
        reviewText: data.reviewText,
        subject: data.subject
      });
      
      // Show notification toast
      setShowReviewNotification(true);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowReviewNotification(false);
      }, 5000);
      
      // Update rating in real-time
      if (data?.rating) {
        handleTutorRatingUpdated(data);
      }
      
      return () => clearTimeout(timer);
    };

    // Register event listeners
    onTutorRatingUpdated(handleTutorRatingUpdated);
    onReviewCompleted(handleReviewCompleted);

    // Cleanup listeners on unmount
    return () => {
      offTutorRatingUpdated();
      offReviewCompleted();
    };
  }, []);


  // Notes Functions
  const saveNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      if (editingNote) {
        // Update existing note
        const updatedNotes = notes.map(note => 
          note.id === editingNote.id 
            ? { ...note, title: newNoteTitle, content: newNoteContent }
            : note
        );
        setNotes(updatedNotes);
        localStorage.setItem('tutorNotes', JSON.stringify(updatedNotes));
      } else {
        // Add new note
        const note = { id: Date.now(), title: newNoteTitle, content: newNoteContent };
        const updatedNotes = [...notes, note];
        setNotes(updatedNotes);
        localStorage.setItem('tutorNotes', JSON.stringify(updatedNotes));
      }
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
      setEditingNote(null);
    }
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('tutorNotes', JSON.stringify(updatedNotes));
  };

  const openNoteForEdit = (note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setIsAddingNote(true);
  };

  const closeNoteModal = () => {
    setIsAddingNote(false);
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  // Session functions
  const convertTo24Hour = (time, period) => {
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const addSession = () => {
    if (sessionLearner.trim() && sessionSubject.trim() && sessionDate && sessionStartTime && sessionEndTime) {
      const startTime24 = convertTo24Hour(sessionStartTime, sessionStartPeriod);
      const endTime24 = convertTo24Hour(sessionEndTime, sessionEndPeriod);
      
      const startDateTime = `${sessionDate}T${startTime24}:00`;
      const endDateTime = `${sessionDate}T${endTime24}:00`;
      
      const newSession = {
        id: Date.now(),
        name: sessionLearner,
        subject: sessionSubject,
        startTime: startDateTime,
        endTime: endDateTime
      };
      const updatedSessions = [...upcomingSessions, newSession];
      setUpcomingSessions(updatedSessions);
      localStorage.setItem('tutorSessions', JSON.stringify(updatedSessions));
      
      // Reset form
      setSessionLearner('');
      setSessionSubject('');
      setSessionDate('');
      setSessionStartTime('');
      setSessionStartPeriod('AM');
      setSessionEndTime('');
      setSessionEndPeriod('AM');
      setShowSessionModal(false);
    }
  };

  const getTimeUntilSession = (startTime) => {
    const now = new Date();
    const sessionTime = new Date(startTime);
    const diffMs = sessionTime - now;
    
    if (diffMs <= 0) return "Session started";
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    const remainingMins = diffMins % 60;
    
    if (diffDays > 0) {
      return `In ${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      return `In ${diffHours}h ${remainingMins}m`;
    } else if (diffMins > 0) {
      return `In ${diffMins}m`;
    } else {
      const diffSecs = Math.floor(diffMs / 1000);
      return `In ${diffSecs}s`;
    }
  };

  const getSessionsTodayCount = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return upcomingSessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate === todayString;
    }).length;
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
    <div className="space-y-8 relative min-h-screen dashboard-fade-in">
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
                  handleAcceptRequest(requestId, localStorage.getItem('userId'), request.learnerId._id)
                }
                onReject={(requestId, reason) =>
                  handleRejectRequest(requestId, localStorage.getItem('userId'), request.learnerId._id, reason)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* First Row: Welcome and Learner Activity */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className={`md:col-span-2 px-6 py-12 rounded-3xl shadow-lg flex flex-col h-full welcome-glow ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-slate-900 border border-blue-200'}`}>
          <h1 className="text-4xl font-black mb-2">Welcome back, {userName}!</h1>
          <p className={isDarkMode ? 'text-blue-100' : 'text-slate-600'}>Track sessions, engage learners, and grow your impact.</p>
        </div>
        <div className={`md:col-span-3 px-6 py-12 rounded-3xl shadow-lg flex flex-col h-full hover-glow card-hover ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}>
          <LiveLearnerStats />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Upcoming Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover-glow card-hover">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Clock size={16} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Upcoming Sessions</p>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {upcomingSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                <Clock size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No upcoming sessions</p>
                <p className="text-xs mt-1">Click + to schedule a session</p>
              </div>
            ) : (
              upcomingSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  name={session.name} 
                  subject={session.subject} 
                  time={getTimeUntilSession(session.startTime)} 
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Sessions Today + Recent Activity */}
        <div className="space-y-6 flex flex-col">
          <StatCard title="Sessions Today" value={getSessionsTodayCount()} icon={<Calendar size={24} />} />
          
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover-glow card-hover">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-600 dark:text-slate-400">✅ Session completed with John</p>
              <p className="text-slate-600 dark:text-slate-400">📝 Lesson notes added for Math</p>
              <p className="text-slate-600 dark:text-slate-400">⭐ New 5-star review received</p>
            </div>
          </div>
        </div>

        {/* Column 3: Rating + Sticky Notes */}
        <div className="space-y-6 flex flex-col">
          {/* 🎯 DYNAMIC RATING CARD with real-time updates */}
          <div className="group p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover-glow card-hover flex flex-col justify-center relative overflow-hidden">
            {/* Animated background pulse on new review */}
            {showReviewNotification && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-yellow-400/10 animate-pulse"></div>
            )}
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">Rating</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{tutorRating}</h3>
                {tutorData?.ratingStats?.totalReviews && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ({tutorData.ratingStats.totalReviews} {tutorData.ratingStats.totalReviews === 1 ? 'review' : 'reviews'})
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Star size={24} />
              </div>
            </div>
          </div>
          
          {/* 🔔 REVIEW NOTIFICATION TOAST */}
          {showReviewNotification && recentReview && (
            <div className="animate-slide-down p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 rounded-lg shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-400 rounded-lg text-white flex-shrink-0 mt-0.5">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">New Review Received!</p>
                  <p className="text-amber-800 dark:text-amber-300 text-sm mt-1">
                    <span className="font-semibold">{recentReview.learnerName}</span> gave you <span className="font-bold">{recentReview.rating}★</span> for {recentReview.subject}
                  </p>
                  {recentReview.reviewText && (
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-2 italic">
                      "{recentReview.reviewText}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Sticky Notes Block */}
          <div className="flex-1 max-h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover-glow card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Sticky Notes</h3>
              <button 
                onClick={() => setIsAddingNote(true)}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto hidden-scrollbar">
              {notes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-4">
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p className="text-xs">No notes yet</p>
                  <p className="text-xs mt-1">Click + to add your first note</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="group flex items-center justify-between py-2 px-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg transition-all hover:shadow-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/20 cursor-pointer" onClick={() => openNoteForEdit(note)}>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200/90 truncate flex-1">{note.title}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-200 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* AI Chat Assistant */}
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          🤖 AI Chat Assistant
        </h2>
        <div className="max-w-2xl">
          <ChatBot />
        </div>
      </div>

      {/* Add/Edit Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </h3>
              <button 
                onClick={closeNoteModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input 
                  autoFocus
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea 
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter note description..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={saveNote}
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                  className="flex-1 p-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {editingNote ? 'Update Note' : 'Save Note'}
                </button>
                <button 
                  onClick={closeNoteModal}
                  className="p-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Schedule New Session</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Set up a learning session with your student</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSessionModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Learner Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  👤 Learner Name
                </label>
                <input 
                  value={sessionLearner}
                  onChange={(e) => setSessionLearner(e.target.value)}
                  placeholder="Enter learner's full name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                />
              </div>
              
              {/* Subject */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  📚 Subject
                </label>
                <input 
                  value={sessionSubject}
                  onChange={(e) => setSessionSubject(e.target.value)}
                  placeholder="What will you teach? (e.g., Mathematics, Physics)..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  📅 Session Date
                </label>
                <input 
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Time Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  🕐 Session Time
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Time */}
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Start Time
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="time"
                        value={sessionStartTime}
                        onChange={(e) => setSessionStartTime(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                      <select
                        value={sessionStartPeriod}
                        onChange={(e) => setSessionStartPeriod(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* End Time */}
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      End Time
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="time"
                        value={sessionEndTime}
                        onChange={(e) => setSessionEndTime(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                      <select
                        value={sessionEndPeriod}
                        onChange={(e) => setSessionEndPeriod(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={addSession}
                  disabled={!sessionLearner.trim() || !sessionSubject.trim() || !sessionDate || !sessionStartTime || !sessionEndTime}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-xl py-3 px-6 font-semibold text-sm transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  📅 Schedule Session
                </button>
                <button 
                  onClick={() => setShowSessionModal(false)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-Components
function StatCard({ title, value, icon }) {
  return (
    <div className="group p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover-glow card-hover flex flex-col justify-center">
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

export default TutorDashboard;