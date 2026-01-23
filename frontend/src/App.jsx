import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { RequestProvider } from "./context/RequestContext";
import { NotificationProvider } from "./context/NotificationContext";

// Pages directly in /pages
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OTPVerification from "./pages/OTPVerification";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import TutorsList from "./pages/TutorsList";

// Pages inside /pages/Dashboard
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import TutorDashboard from "./pages/Dashboard/TutorDashboard";
import LearnerDashboard from "./pages/Dashboard/LearnerDashboard";
import TutorNotes from "./pages/Dashboard/TutorNotes";

// Profile pages
import TutorProfile from "./pages/Profile/TutorProfile";
import LearnerProfile from "./pages/Profile/LearnerProfile";

// Components
import ChatNotification from "./components/ChatNotification";
import NotificationContainer from "./components/NotificationContainer";
import AppInitializer from "./components/AppInitializer";
import { ConnectionStatusBanner } from "./components/ConnectionStatusBanner";
import { useConnectionStatus } from "./hooks/useConnectionStatus";

function AppRoutes() {
  // Real-world logic: Detect the user role from storage
  const userAccountType = localStorage.getItem('userRole') || "tutor"; 

  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:otherUserId" element={<Chat />} />
      <Route path="/bookings" element={<Bookings />} />

      {/* --- Tutor Dashboard Routes --- */}
      <Route path="/TutorDashboard" element={<DashboardLayout />}>
        <Route index element={<TutorDashboard />} />
        <Route path="notes" element={<TutorNotes />} />
        <Route path="messages" element={<Chat />} />
        <Route path="profile" element={<TutorProfile />} />
      </Route>

      {/* --- Learner Dashboard Routes --- */}
      <Route path="/dashboard/learner" element={<DashboardLayout />}>
        <Route index element={<LearnerDashboard />} />
        <Route path="messages" element={<Chat />} />
        <Route path="profile" element={<LearnerProfile />} />
      </Route>

      {/* --- Tutor List Route (Inside DashboardLayout) --- */}
      <Route path="/tutors" element={<DashboardLayout />}>
        <Route index element={<TutorsList />} />
      </Route>

      {/* --- Tutor Profile Route --- */}
      <Route path="/tutor/:tutorId" element={<Profile />} />

      {/* --- 404 Safety Net --- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Inner component to handle theme and real-time notifications
function AppContent() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Apply dark mode to the root HTML element globally
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <AppInitializer>
      <ConnectionStatusDisplay />
      <NotificationContainer />
      <ChatNotification />
      <AppRoutes />
    </AppInitializer>
  );
}

/**
 * Connection Status Display wrapper
 * Needs to be inside AppInitializer for socket to be initialized
 */
function ConnectionStatusDisplay() {
  const { status, isVisible, hide } = useConnectionStatus();
  return <ConnectionStatusBanner status={status} isVisible={isVisible} onClose={hide} />;
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <RequestProvider>
          <AppContent />
        </RequestProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;