import { useState } from 'react';
import { X, Calendar, Clock, DollarSign } from 'lucide-react';
import bookingService from '../services/bookingService';

export default function BookingModal({ isOpen, tutorId, tutorName, hourlyRate, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    subject: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Calculate duration and price
    if (name === 'startTime' || name === 'endTime') {
      const start = new Date(formData.startTime || value);
      const end = new Date(formData.endTime || value);

      if (start && end && start < end) {
        const durationMinutes = Math.round((end - start) / 60000);
        const durationHours = durationMinutes / 60;
        setDuration(durationMinutes);
      }
    }
  };

  const calculatePrice = () => {
    return (duration / 60) * hourlyRate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.startTime || !formData.endTime || !formData.subject) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (startDate >= endDate) {
        setError('Start time must be before end time');
        setLoading(false);
        return;
      }

      if (startDate < new Date()) {
        setError('Cannot book sessions in the past');
        setLoading(false);
        return;
      }

      const price = calculatePrice();

      await bookingService.createBooking(
        tutorId,
        startDate.toISOString(),
        endDate.toISOString(),
        formData.subject,
        price,
        formData.notes
      );

      setFormData({
        startTime: '',
        endTime: '',
        subject: '',
        notes: '',
      });

      onSuccess('Session booked successfully!');
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const price = calculatePrice();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all duration-300 animate-scale-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Book a Session</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">with <span className="font-bold text-slate-900 dark:text-slate-100">{tutorName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-110">
            <X size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject */}
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Subject/Topic *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="e.g., Python Basics"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          {/* Start Time */}
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 font-medium text-base"
            />
            {formData.startTime && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pl-1">
                📅 {new Date(formData.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* End Time */}
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-2">
              <Calendar size={16} className="text-purple-600" />
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all duration-200 font-medium text-base"
            />
            {formData.endTime && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pl-1">
                📅 {new Date(formData.endTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any specific topics or requirements..."
              rows="3"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Duration & Price */}
          {duration > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-2xl space-y-3 border border-blue-200 dark:border-blue-800 animate-slide-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{duration} min</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Price</p>
                      <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold p-3 rounded-xl border border-red-200 dark:border-red-800 flex gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              {loading ? '⏳ Booking...' : '✨ Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
