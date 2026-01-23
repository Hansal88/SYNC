import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getIncomingRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
} from '../services/requestService';
import {
  onReceiveRequest,
  onRequestAccepted,
  onRequestRejected,
  onLiveStatsUpdate,
  onChatCreated,
  emitAcceptRequest,
  emitRejectRequest,
  offReceiveRequest,
  offRequestAccepted,
  offRequestRejected,
  offLiveStatsUpdate,
  offChatCreated,
} from '../services/socketService';

const RequestContext = createContext();

export const useRequests = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequests must be used within RequestProvider');
  }
  return context;
};

export const RequestProvider = ({ children }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [newChatNotification, setNewChatNotification] = useState(null);
  const [liveStats, setLiveStats] = useState({
    onlineTutors: 0,
    onlineLearners: 0,
    tutorsInSession: 0,
    learnersInSession: 0,
    totalOnline: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Fetch incoming requests (for tutors)
  const fetchIncomingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getIncomingRequests();
      setIncomingRequests(data.requests || []);
      console.log('✅ Fetched incoming requests:', data.requests);
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sent requests (for learners)
  const fetchSentRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSentRequests();
      setSentRequests(data.requests || []);
      console.log('✅ Fetched sent requests:', data.requests);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept a request
  const handleAcceptRequest = useCallback(
    async (requestId, tutorId, learnerId) => {
      try {
        await acceptRequest(requestId);
        // Emit socket event
        emitAcceptRequest(requestId, tutorId, learnerId);
        // Update local state
        setIncomingRequests((prev) =>
          prev.map((req) =>
            req._id === requestId ? { ...req, status: 'accepted' } : req
          )
        );
        console.log('✅ Request accepted:', requestId);
      } catch (err) {
        console.error('Error accepting request:', err);
        setError(err.message);
      }
    },
    []
  );

  // Reject a request
  const handleRejectRequest = useCallback(
    async (requestId, tutorId, learnerId, reason = '') => {
      try {
        await rejectRequest(requestId, reason);
        // Emit socket event
        emitRejectRequest(requestId, tutorId, learnerId, reason);
        // Update local state
        setIncomingRequests((prev) =>
          prev.map((req) =>
            req._id === requestId ? { ...req, status: 'rejected' } : req
          )
        );
        console.log('❌ Request rejected:', requestId);
      } catch (err) {
        console.error('Error rejecting request:', err);
        setError(err.message);
      }
    },
    []
  );

  // Handle incoming request (via socket)
  useEffect(() => {
    const handleReceiveRequest = (data) => {
      const { request } = data;
      console.log('📬 Received new request:', request);
      setIncomingRequests((prev) => [request, ...prev]);
    };

    onReceiveRequest(handleReceiveRequest);
    return () => offReceiveRequest();
  }, []);

  // Handle request accepted (for learner)
  useEffect(() => {
    const handleRequestAccepted = (data) => {
      const { requestId, tutorId } = data;
      console.log('🎉 Request accepted by tutor:', requestId);
      setSentRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status: 'accepted', tutorId }
            : req
        )
      );
    };

    onRequestAccepted(handleRequestAccepted);
    return () => offRequestAccepted();
  }, []);

  // Handle request rejected (for learner)
  useEffect(() => {
    const handleRequestRejected = (data) => {
      const { requestId, reason } = data;
      console.log('❌ Request rejected:', requestId, reason);
      setSentRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status: 'rejected', rejectionReason: reason }
            : req
        )
      );
    };

    onRequestRejected(handleRequestRejected);
    return () => offRequestRejected();
  }, []);

  // Handle live stats update
  useEffect(() => {
    const handleLiveStatsUpdate = (stats) => {
      console.log('📊 Live stats updated:', stats);
      setLiveStats(stats);
    };

    onLiveStatsUpdate(handleLiveStatsUpdate);
    return () => offLiveStatsUpdate();
  }, []);

  // Handle chat created
  useEffect(() => {
    const handleChatCreated = (data) => {
      const { conversationId, otherUserId, requestId } = data;
      console.log('💬 Chat created:', { conversationId, otherUserId, requestId });
      setNewChatNotification({
        conversationId,
        otherUserId,
        requestId,
        createdAt: new Date(),
      });
    };

    onChatCreated(handleChatCreated);
    return () => offChatCreated();
  }, []);

  const value = {
    incomingRequests,
    sentRequests,
    liveStats,
    loading,
    error,
    userRole,
    setUserRole,
    newChatNotification,
    setNewChatNotification,
    fetchIncomingRequests,
    fetchSentRequests,
    handleAcceptRequest,
    handleRejectRequest,
  };

  return (
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  );
};
