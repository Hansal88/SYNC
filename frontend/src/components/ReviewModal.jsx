import React, { useState, useRef, useEffect } from 'react';
import { Star, X, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import StarRating from './StarRating';
import reviewService from '../services/reviewService';

/**
 * ReviewModal - Auto-triggered after session completion
 * Allows learner to rate tutor and provide feedback
 * 
 * Features:
 * - Auto-focuses on star rating
 * - One review per session (prevents duplicates)
 * - Optional review text (max 500 chars)
 * - Success confirmation screen
 * - Network error handling
 */
const ReviewModal = ({ 
  session, 
  onClose, 
  onSubmitSuccess,
  isOpen = false 
}) => {
  const { isDarkMode } = useTheme();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const firstStarRef = useRef(null);

  // ✅ Auto-focus on first star when modal opens
  useEffect(() => {
    if (isOpen && firstStarRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        firstStarRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // ✅ Check if already reviewed on modal open
  useEffect(() => {
    const checkExistingReview = async () => {
      if (isOpen && session?._id) {
        try {
          const { hasReview } = await reviewService.getSessionReview(session._id);
          if (hasReview) {
            setSubmitted(true);
            // Auto-close after 2 seconds
            setTimeout(() => onClose(), 2000);
          }
        } catch (err) {
          console.warn('Could not check review status:', err.message);
          // Continue anyway, backend will prevent duplicates
        }
      }
    };

    checkExistingReview();
  }, [isOpen, session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate rating is selected
    if (!rating) {
      setError('Please select a rating before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit review to backend
      const response = await reviewService.submitReview({
        sessionId: session._id,
        rating,
        reviewText: reviewText.trim()
      });

      console.log('✅ Review submitted successfully:', response);
      
      // Show success state
      setSubmitted(true);
      
      // Callback to parent component
      onSubmitSuccess?.();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Review submission error:', err.message);
      setError(err.message || 'Failed to submit review. Please try again.');
      setIsSubmitting(false); // Allow retry
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className={`${
            isDarkMode 
              ? 'bg-slate-900 border border-slate-700' 
              : 'bg-white border border-slate-200'
          } rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Rate Your Session
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-600'
              } disabled:opacity-50`}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {submitted ? (
              // ✅ SUCCESS STATE
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  ✨
                </motion.div>
                <h3 className={`text-xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Thank You!
                </h3>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your feedback helps us provide better tutoring experiences.
                </p>
                <div className="flex justify-center mt-4">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tutor Info Card */}
                <div className={`p-4 rounded-lg flex items-center gap-4 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-blue-50'
                }`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                    {session.tutorId?.name?.[0] || 'T'}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {session.tutorId?.name || 'Tutor'}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {session.subject}
                    </p>
                  </div>
                </div>

                {/* Star Rating Section */}
                <div className="space-y-3">
                  <label className={`text-sm font-semibold block ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    How was your experience? <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="py-4">
                    <StarRating
                      rating={rating}
                      onRatingChange={setRating}
                      size={48}
                      interactive={true}
                      showLabel={true}
                    />
                  </div>
                </div>

                {/* Review Text Area */}
                <div className="space-y-2">
                  <label className={`text-sm font-semibold block ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Share your feedback <span className="text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                    placeholder="What did you like about this session? Any suggestions for improvement?"
                    className={`w-full p-4 rounded-lg border-2 transition-colors resize-none focus:outline-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                    }`}
                    rows={4}
                    disabled={isSubmitting}
                  />
                  <div className={`flex justify-between items-center text-xs ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <span>Be constructive and respectful</span>
                    <span>{reviewText.length}/500</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                      isDarkMode
                        ? 'bg-red-900/20 border-red-700/50 text-red-300'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900 disabled:opacity-50'
                    }`}
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={!rating || isSubmitting}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      !rating || isSubmitting
                        ? `${isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
                        : `${
                            isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                              : 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95'
                          }`
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star size={18} />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
