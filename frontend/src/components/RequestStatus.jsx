import React from 'react';
import { useTheme } from '../context/ThemeContext';

const RequestStatus = ({ requests, isLoading = false }) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div
        className={`text-center p-8 rounded-lg ${
          isDark ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}
      >
        <p className="text-lg">📭 No requests sent yet</p>
        <p className="text-sm mt-2">Send a request to a tutor to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request._id}
          className={`p-4 rounded-lg border-2 transition-all ${
            isDark
              ? 'border-slate-700 bg-slate-800'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3
                className={`font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {request.tutorId?.name || 'Unknown Tutor'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {request.tutorId?.email || 'No email'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
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
              {request.status === 'pending' && '⏳ Pending'}
              {request.status === 'accepted' && '✅ Accepted'}
              {request.status === 'rejected' && '❌ Rejected'}
            </span>
          </div>

          {/* Subject */}
          <div className="mb-2">
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              SUBJECT
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {request.subject}
            </p>
          </div>

          {/* Message */}
          <div className="mb-2">
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              MESSAGE
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {request.message}
            </p>
          </div>

          {/* Rejection Reason */}
          {request.status === 'rejected' && request.rejectionReason && (
            <div
              className={`mt-2 p-2 rounded text-sm ${
                isDark
                  ? 'bg-red-900/30 text-red-200'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <strong>Reason:</strong> {request.rejectionReason}
            </div>
          )}

          {/* Timestamp */}
          <p
            className={`text-xs mt-2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default RequestStatus;