import React from 'react';
import { useTheme } from '../context/ThemeContext';

const GlassCard = ({ children, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;