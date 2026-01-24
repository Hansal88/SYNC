import { useEffect, useState } from 'react';
import {
  onReviewModalTrigger,
  offReviewModalTrigger,
  onReviewRequested,
  offReviewRequested
} from '../services/socketService';

/**
 * Hook: useSessionReviewTrigger
 * 
 * Listens for socket events when a session is completed
 * Auto-opens the review modal for learners
 * 
 * Usage:
 * const { pendingReviewSession, clearPendingReview } = useSessionReviewTrigger();
 * 
 * @returns {Object} { pendingReviewSession, clearPendingReview }
 */
export const useSessionReviewTrigger = () => {
  const [pendingReviewSession, setPendingReviewSession] = useState(null);

  useEffect(() => {
    // 📢 Listen for review_modal_trigger event (emitted by backend when tutor completes session)
    const handleReviewModalTrigger = (data) => {
      console.log('⭐ Review modal trigger received:', data);
      
      // Create session object from socket data
      const sessionData = {
        _id: data.sessionId,
        tutorId: data.tutorId,
        tutorName: data.tutorName,
        subject: data.subject,
        message: data.message
      };
      
      setPendingReviewSession(sessionData);
    };

    // 📢 Listen for review_requested event (fallback trigger)
    const handleReviewRequested = (data) => {
      console.log('📢 Tutor requested review:', data);
      
      if (data?.session && data.session._id) {
        setPendingReviewSession(data.session);
      }
    };

    // Register event listeners
    onReviewModalTrigger(handleReviewModalTrigger);
    onReviewRequested(handleReviewRequested);

    // Cleanup listeners on unmount
    return () => {
      offReviewModalTrigger();
      offReviewRequested();
    };
  }, []);

  const clearPendingReview = () => {
    console.log('🧹 Clearing pending review');
    setPendingReviewSession(null);
  };

  return {
    pendingReviewSession,
    clearPendingReview,
    hasPendingReview: !!pendingReviewSession
  };
};

export default useSessionReviewTrigger;
