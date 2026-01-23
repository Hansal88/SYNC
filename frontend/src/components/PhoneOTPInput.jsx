import React, { useState, useEffect, useRef } from 'react';
import { Lock, RotateCcw } from 'lucide-react';

const PhoneOTPInput = ({ 
  length = 6, 
  onComplete, 
  onOTPChange, 
  isLoading = false,
  canResend = false,
  onResend,
  timeRemaining = 0
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Call onChange callback
    if (onOTPChange) {
      onOTPChange(newOtp.join(''));
    }

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all filled
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
        if (onOTPChange) {
          onOTPChange(newOtp.join(''));
        }
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        if (onOTPChange) {
          onOTPChange(newOtp.join(''));
        }
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = pastedText.split('').concat(Array(length).fill('')).slice(0, length);
    setOtp(newOtp);
    
    if (onOTPChange) {
      onOTPChange(newOtp.join(''));
    }

    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }

    // Focus last filled input
    const lastFilledIndex = newOtp.findIndex(digit => digit === '');
    if (lastFilledIndex >= 0) {
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-3">
        {Array(length)
          .fill('')
          .map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={otp[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="—"
            />
          ))}
      </div>

      {/* Timer and Resend */}
      <div className="text-center space-y-3">
        {timeRemaining > 0 ? (
          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 font-semibold">
            <RotateCcw size={16} />
            <span>OTP expires in {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</span>
          </div>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">OTP expired. Please request a new one.</p>
        )}

        {canResend && (
          <button
            onClick={onResend}
            disabled={isLoading || timeRemaining > 0}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw size={16} />
            Resend OTP
          </button>
        )}
      </div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Lock size={14} />
        <span>Never share your OTP with anyone</span>
      </div>
    </div>
  );
};

export default PhoneOTPInput;
