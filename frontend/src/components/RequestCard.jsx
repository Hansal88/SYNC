import React from 'react';
import { useTheme } from '../context/ThemeContext';

const RequestCard = ({ request, onAccept, onReject, isLoading = false }) => {
  const { isDark } = useTheme();
  const learner = request.learnerId;

  const handleReject = () => {
    const reason = prompt('Enter rejection reason (optional):');
    onReject(request._id, reason || '');
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
        isDark
          ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      {/* Header - Learner Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {learner?.profilePhoto && (
            <img
              src={learner.profilePhoto}
              alt={learner.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <h3
              className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {learner?.name || 'Unknown Learner'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {learner?.email || 'No email'}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            request.status === 'pending'
              ? isDark
                ? 'bg-yellow-900 text-yellow-200'
                : 'bg-yellow-100 text-yellow-800'
              : request.status === 'accepted'
              ? isDark
                ? 'bg-green-900 text-green-200'
                : 'bg-green-100 text-green-800'
              : isDark
              ? 'bg-red-900 text-red-200'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      {/* Subject */}
      <div className="mb-3">
        <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
          SUBJECT
        </p>
        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {request.subject}
        </p>
      </div>

      {/* Message */}
      <div className="mb-3">
        <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
          MESSAGE
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {request.message}
        </p>
      </div>

      {/* Timestamp */}
      <div className="mb-4">
        <p
          className={`text-xs ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          {new Date(request.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejectionReason && (
        <div
          className={`mb-4 p-2 rounded ${
            isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
          }`}
        >
          <p className="text-sm">
            <strong>Rejection Reason:</strong> {request.rejectionReason}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {request.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(request._id)}
            disabled={isLoading}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            ✓ Accept
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            ✗ Reject
          </button>
        </div>
      )}

      {request.status === 'accepted' && (
        <div
          className={`py-2 px-3 rounded-lg text-center font-medium text-white bg-green-500`}
        >
          ✓ Request Accepted
        </div>
      )}
    </div>
  );
};

export default RequestCard;
