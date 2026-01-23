import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Star, Clock, MessageSquare, Calendar } from 'lucide-react';
import tutorService from "../services/tutorService";
import chatService from "../services/chatService";
import BookingModal from "../components/BookingModal";

const Profile = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    tutorId: null,
    tutorName: '',
    hourlyRate: 0,
  });

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setLoading(true);
        if (tutorId) {
          const response = await tutorService.getTutorById(tutorId);
          const tutorData = response.data?.tutor || response.tutor || response.data;
          setTutor(tutorData);
          setError('');
        } else {
          setError('No tutor ID provided');
        }
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorProfile();
    }
  }, [tutorId]);

  const handleMessage = () => {
    if (tutor?.userId?._id) {
      navigate(`/chat/${tutor.userId._id}`);
    }
  };

  const handleBooking = () => {
    if (tutor) {
      setBookingModal({
        isOpen: true,
        tutorId: tutor._id,
        tutorName: tutor.userId?.name || 'Tutor',
        hourlyRate: tutor.hourlyRate,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            {error || 'Unable to load tutor profile'}
          </div>
          <button
            onClick={() => navigate('/tutors')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tutors List
          </button>
        </div>
      </div>
    );
  }

  const userData = tutor.userId;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-40"></div>

          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-20 mb-6">
              <div className="w-32 h-32 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center text-5xl font-bold text-blue-600 shadow-lg">
                {userData?.name?.charAt(0) || 'T'}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-4xl font-black text-slate-800">{userData?.name || 'Tutor'}</h1>
                <p className="text-gray-600">{userData?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 py-6 border-t border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(tutor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'} ({tutor.reviews} reviews)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-800">{tutor.completedSessions}</p>
                  <p className="text-sm text-gray-600">Sessions Completed</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-[20px] font-semibold">₹</span>
                <div>
                  <p className="font-semibold text-slate-800">₹{tutor.hourlyRate}/hr</p>
                  <p className="text-sm text-gray-600">Hourly Rate</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-800">{tutor.experience || 'N/A'}</p>
                <p className="text-sm text-gray-600">Experience</p>
              </div>
            </div>

            {tutor.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">About</h3>
                <p className="text-gray-600">{tutor.bio}</p>
              </div>
            )}

            {tutor.specialization && tutor.specialization.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.specialization.map((spec, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleMessage}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={20} />
                Send Message
              </button>

              <button
                onClick={handleBooking}
                className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Book Session
              </button>

              <button
                onClick={() => navigate('/tutors')}
                className="py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={bookingModal.isOpen}
        tutorId={bookingModal.tutorId}
        tutorName={bookingModal.tutorName}
        hourlyRate={bookingModal.hourlyRate}
        onClose={() => setBookingModal({ ...bookingModal, isOpen: false })}
        onSuccess={() => navigate('/bookings')}
      />
    </div>
  );
};

export default Profile;
