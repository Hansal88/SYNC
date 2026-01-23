import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, DollarSign, Filter, MapPin, MessageSquare, Calendar } from 'lucide-react';
import tutorAPI from '../services/tutorService';
import { useTheme } from '../context/ThemeContext';
import BookingModal from '../components/BookingModal';

const TutorsList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [sort, setSort] = useState('rating');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Booking Modal
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    tutorId: null,
    tutorName: '',
    hourlyRate: 0,
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
    };

    checkAuth();

    // Fetch specializations
    const fetchSpecializations = async () => {
      try {
        const data = await tutorAPI.getSpecializations();
        setSpecializations(data.specializations || []);
      } catch (err) {
        console.error('Error fetching specializations:', err);
      }
    };

    fetchSpecializations();
    fetchTutors();
  }, [navigate]);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const params = {
        keyword,
        specialization: selectedSpecialization,
        minRating,
        maxPrice,
        sort,
      };

      const data = await tutorAPI.searchTutors(params);
      setTutors(data.tutors || []);
      setError('');
    } catch (err) {
      console.error('Error fetching tutors:', err);
      setError(err.message || 'Failed to load tutors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTutors();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchTutors();
  };

  return (
    <div className={isDarkMode ? "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"}>
      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-end">
        <button 
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden animate-float"
          title="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="text-xl">⬆️</span>
        </button>
      </div>

      {/* Header */}
      <div className={isDarkMode ? "bg-gradient-to-br from-slate-900 to-slate-800/50 border-b border-slate-800/50 p-8" : "bg-gradient-to-br from-white to-blue-50/50 border-b border-slate-200 p-8"}>
        <div className="max-w-6xl mx-auto">
          <h1 className={isDarkMode ? "text-4xl font-black text-white mb-2" : "text-4xl font-black text-slate-900 mb-2"}>Find a Tutor</h1>
          <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Discover expert tutors and book your first session</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Success Message */}
        {successMessage && (
          <div className={isDarkMode ? "bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-8 text-green-300" : "bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-green-600"}>
            {successMessage}
          </div>
        )}

        {/* Filters Section */}
        <div className={isDarkMode ? "bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 mb-8 shadow-sm hover:shadow-lg transition-all duration-300" : "bg-gradient-to-br from-white to-blue-50/30 border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm hover:shadow-lg transition-all duration-300"}>
          <div className="flex items-center gap-2 mb-6">
            <Filter size={20} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
            <h2 className={isDarkMode ? "text-lg font-bold text-slate-200" : "text-lg font-bold text-slate-900"}>Advanced Filters</h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search */}
            <div>
              <label className={isDarkMode ? "block text-sm font-semibold text-slate-300 mb-2" : "block text-sm font-semibold text-slate-700 mb-2"}>Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className={isDarkMode ? "flex-1 px-4 py-3 border border-slate-700 bg-slate-800/50 text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" : "flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 flex items-center gap-2"
                >
                  <Search size={20} />
                  Search Tutors
                </button>
              </div>
            </div>

            {/* Grid of filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Specialization */}
              <div>
                <label className={isDarkMode ? "block text-sm font-semibold text-slate-300 mb-2" : "block text-sm font-semibold text-slate-700 mb-2"}>Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => {
                    setSelectedSpecialization(e.target.value);
                    handleFilterChange();
                  }}
                  className={isDarkMode ? "w-full px-4 py-3 border border-slate-700 bg-slate-800/50 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400" : "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400"}
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className={isDarkMode ? "block text-sm font-semibold text-slate-300 mb-2" : "block text-sm font-semibold text-slate-700 mb-2"}>Min Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    handleFilterChange();
                  }}
                  className={isDarkMode ? "w-full px-4 py-3 border border-slate-700 bg-slate-800/50 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400" : "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400"}
                >
                  <option value="">Any Rating</option>
                  <option value="3">⭐ 3+</option>
                  <option value="4">⭐⭐ 4+</option>
                  <option value="4.5">⭐⭐⭐ 4.5+</option>
                  <option value="5">⭐⭐⭐⭐ 5</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className={isDarkMode ? "block text-sm font-semibold text-slate-300 mb-2" : "block text-sm font-semibold text-slate-700 mb-2"}>Max Price (₹/hr)</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={handleFilterChange}
                  className={isDarkMode ? "w-full px-4 py-3 border border-slate-700 bg-slate-800/50 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400" : "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400"}
                />
              </div>

              {/* Sort */}
              <div>
                <label className={isDarkMode ? "block text-sm font-semibold text-slate-300 mb-2" : "block text-sm font-semibold text-slate-700 mb-2"}>Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    handleFilterChange();
                  }}
                  className={isDarkMode ? "w-full px-4 py-3 border border-slate-700 bg-slate-800/50 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400" : "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 hover:border-blue-400"}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="price">Price: Low to High</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className={isDarkMode ? "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" : "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"}></div>
          </div>
        ) : error ? (
          <div className={isDarkMode ? "bg-red-900/30 border border-red-800/50 rounded-lg p-6 text-red-300 text-center" : "bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 text-center"}>
            {error}
          </div>
        ) : tutors.length === 0 ? (
          <div className={isDarkMode ? "bg-blue-900/30 border border-blue-800/50 rounded-lg p-12 text-center" : "bg-blue-50 border border-blue-200 rounded-lg p-12 text-center"}>
            <p className={isDarkMode ? "text-slate-300 text-lg" : "text-slate-700 text-lg"}>No tutors found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {tutors.map((tutor, index) => (
                <div key={tutor._id} style={{ animationDelay: `${index * 100}ms` }} className="animate-slideInUp">
                  <TutorCard 
                    tutor={tutor}
                    isDarkMode={isDarkMode}
                    onViewProfile={() => navigate(`/tutor/${tutor._id}`)}
                    onMessage={() => {
                      // Navigate to chat with tutor's userId (not tutor document _id)
                      const tutorUserId = tutor.userId?._id || tutor.userId;
                      if (tutorUserId) {
                        navigate(`/chat/${tutorUserId}`);
                      } else {
                        console.error('Tutor userId not found');
                        alert('Unable to start chat. Tutor information is missing.');
                      }
                    }}
                    onBooking={() => {
                      // Use tutor's userId for booking (backend expects User ID, not Tutor document ID)
                      const tutorUserId = tutor.userId?._id || tutor.userId;
                      setBookingModal({
                        isOpen: true,
                        tutorId: tutorUserId, // Backend expects User ID
                        tutorName: tutor.userId?.name || 'Tutor',
                        hourlyRate: tutor.hourlyRate,
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Pagination (if needed) */}
          </>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        tutorId={bookingModal.tutorId}
        tutorName={bookingModal.tutorName}
        hourlyRate={bookingModal.hourlyRate}
        onClose={() => setBookingModal({ ...bookingModal, isOpen: false })}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setTimeout(() => setSuccessMessage(''), 3000);
          navigate('/bookings');
        }}
      />
    </div>
  );
};

// Tutor Card Component
const TutorCard = ({ tutor, isDarkMode, onViewProfile, onMessage, onBooking }) => {
  const userData = tutor.userId;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className={isDarkMode ? "absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" : "absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"}></div>
      
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 blur transition-opacity duration-300 ${isHovered ? 'opacity-30' : 'opacity-0'}`}></div>

      <div className={isDarkMode ? "relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-2 group-hover:border-blue-500/50" : "relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-2 group-hover:border-blue-300"}>
        {/* Header with gradient */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 group-hover:from-blue-700 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-t from-black to-transparent transition-opacity duration-300"></div>
        </div>

        <div className="p-6 -mt-12 relative">
          {/* Avatar placeholder */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-blue-50 border-4 border-white shadow-lg group-hover:shadow-2xl transition-all duration-300 mb-4 flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            {userData?.name?.charAt(0) || 'T'}
          </div>

          {/* Name & Rating */}
          <h3 className={isDarkMode ? "text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors" : "text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors"}>{userData?.name || 'Tutor'}</h3>
          
          <div className="flex items-center gap-2 mt-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(tutor.rating) ? 'fill-yellow-400 text-yellow-400 transition-transform group-hover:scale-110' : isDarkMode ? 'text-slate-600' : 'text-slate-300'}
                />
              ))}
            </div>
            <span className={isDarkMode ? "text-sm font-semibold text-slate-300" : "text-sm font-semibold text-slate-700"}>
              {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}
            </span>
            {tutor.reviews > 0 && (
              <span className={isDarkMode ? "text-xs text-slate-500" : "text-xs text-slate-500"}>({tutor.reviews} reviews)</span>
            )}
          </div>

          {/* Bio */}
          {tutor.bio && (
            <p className={isDarkMode ? "text-sm text-slate-400 mb-4 line-clamp-2 group-hover:text-slate-300 transition-colors" : "text-sm text-slate-600 mb-4 line-clamp-2 group-hover:text-slate-700 transition-colors"}>{tutor.bio}</p>
          )}

          {/* Specializations */}
          {tutor.specialization && tutor.specialization.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tutor.specialization.slice(0, 2).map((spec, idx) => (
                <span key={idx} className={isDarkMode ? "text-xs font-semibold bg-blue-900/40 text-blue-300 px-3 py-1.5 rounded-full border border-blue-800/50 group-hover:shadow-md group-hover:border-blue-600 transition-all duration-300" : "text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 group-hover:shadow-md group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300"}>
                  {spec}
                </span>
              ))}
              {tutor.specialization.length > 2 && (
                <span className={isDarkMode ? "text-xs font-semibold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 group-hover:bg-slate-700 transition-colors" : "text-xs font-semibold bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 group-hover:from-slate-200 transition-colors"}>
                  +{tutor.specialization.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className={isDarkMode ? "flex items-center justify-between text-sm border-t border-slate-800 pt-4 mb-4" : "flex items-center justify-between text-sm border-t border-slate-200 pt-4 mb-4"}>
            <div className={isDarkMode ? "flex items-center gap-1 text-slate-400 group-hover:text-slate-300 transition-colors" : "flex items-center gap-1 text-slate-600 group-hover:text-slate-800 transition-colors"}>
              <Clock size={16} className="text-blue-500 transition-transform group-hover:scale-110" />
              <span className="font-semibold">{tutor.completedSessions} sessions</span>
            </div>
            <div className={isDarkMode ? "flex items-center gap-1 text-slate-400 group-hover:text-slate-300 transition-colors" : "flex items-center gap-1 text-slate-600 group-hover:text-slate-800 transition-colors"}>
              <DollarSign size={16} className="text-green-500 transition-transform group-hover:scale-110" />
              <span className="font-semibold">₹{tutor.hourlyRate}/hr</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onViewProfile}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 group-hover:animate-buttonPulse"
            >
              View Profile
            </button>
            <button
              onClick={onMessage}
              className={isDarkMode ? "py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md hover:text-blue-300 active:scale-95" : "py-2.5 px-4 bg-gradient-to-br from-slate-100 to-slate-50 hover:from-blue-50 hover:to-blue-100 text-slate-700 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md hover:text-blue-600 active:scale-95"}
              title="Send message"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={onBooking}
              className={isDarkMode ? "py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md hover:text-green-400 active:scale-95" : "py-2.5 px-4 bg-gradient-to-br from-slate-100 to-slate-50 hover:from-green-50 hover:to-green-100 text-slate-700 rounded-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md hover:text-green-600 active:scale-95"}
              title="Book session"
            >
              <Calendar size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorsList;
