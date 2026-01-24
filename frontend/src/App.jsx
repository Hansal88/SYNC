import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
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
import StudyMaterial from "./pages/StudyMaterial";

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

// Legacy redirect components for backward compatibility
function LegacyRedirect({ page }) {
  const navigate = useNavigate();
  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || 'learner';
    const basePath = userRole === 'tutor' ? '/TutorDashboard' : '/dashboard/learner';
    navigate(`${basePath}/${page}`, { replace: true });
  }, [navigate, page]);
  return null;
}

function LegacyRedirectWithId({ page }) {
  const navigate = useNavigate();
  const { otherUserId } = useParams();
  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || 'learner';
    const basePath = userRole === 'tutor' ? '/TutorDashboard' : '/dashboard/learner';
    navigate(`${basePath}/${page}/${otherUserId}`, { replace: true });
  }, [navigate, page, otherUserId]);
  return null;
}

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

      {/* --- Tutor Dashboard Routes (with sidebar) --- */}
      <Route path="/TutorDashboard" element={<DashboardLayout />}>
        <Route index element={<TutorDashboard />} />
        <Route path="study-material" element={<StudyMaterial />} />
        <Route path="messages" element={<Chat />} />
        <Route path="messages/:otherUserId" element={<Chat />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="profile" element={<TutorProfile />} />
      </Route>

      {/* --- Learner Dashboard Routes (with sidebar) --- */}
      <Route path="/dashboard/learner" element={<DashboardLayout />}>
        <Route index element={<LearnerDashboard />} />
        <Route path="study-material" element={<StudyMaterial />} />
        <Route path="messages" element={<Chat />} />
        <Route path="messages/:otherUserId" element={<Chat />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="tutors" element={<TutorsList />} />
        <Route path="profile" element={<LearnerProfile />} />
      </Route>

      {/* --- Legacy Routes Redirector Component --- */}
      <Route path="/chat" element={<LegacyRedirect page="messages" />} />
      <Route path="/chat/:otherUserId" element={<LegacyRedirectWithId page="messages" />} />
      <Route path="/bookings" element={<LegacyRedirect page="bookings" />} />
      <Route path="/tutors" element={<LegacyRedirect page="tutors" />} />

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