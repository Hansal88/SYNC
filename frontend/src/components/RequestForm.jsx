import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { sendRequest } from '../services/requestService';
import { emitSendRequest } from '../services/socketService';

const RequestForm = ({ tutorId, tutorName, onSuccess }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendRequest(
        tutorId,
        formData.subject,
        formData.message
      );

      // Emit socket event
      const learnerId = localStorage.getItem('userId');
      emitSendRequest(tutorId, learnerId, response.request);

      // Reset form
      setFormData({ subject: '', message: '' });
      setIsOpen(false);

      if (onSuccess) {
        onSuccess(response.request);
      }

      console.log('✅ Request sent successfully');
    } catch (err) {
      console.error('Error sending request:', err);
      setError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          isDark
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        📬 Send Request to {tutorName}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md rounded-lg shadow-xl p-6 ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Request Learning Session
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Subject / Skill
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g., Advanced JavaScript"
                  className={`w-full px-3 py-2 rounded-lg border-2 outline-none transition-all ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell the tutor what you need help with..."
                  rows="4"
                  className={`w-full px-3 py-2 rounded-lg border-2 outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-2 rounded-lg font-medium text-white transition-all ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Sending...' : '📬 Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    isDark
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestForm;
