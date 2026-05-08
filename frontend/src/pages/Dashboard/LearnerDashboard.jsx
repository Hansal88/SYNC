import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Star, Settings, GraduationCap } from "lucide-react";
import profileAPI from "../../services/profileService";
import { useRequests } from "../../context/RequestContext";
import { emitUserOnline } from "../../services/socketService";
import LiveTutorStats from "../../components/LiveTutorStats";
import RequestStatus from "../../components/RequestStatus";
import DailyLearningStreak from "../../components/DailyLearningStreak";
import ChatBot from "../../components/ChatBot";
import GlassCard from "../../components/GlassCard";
import SkeletonCard from "../../components/SkeletonCard";
import AnimatedCard from "../../components/AnimatedCard";

const LearnerDashboard = () => {
  const navigate = useNavigate();

  const [learnerData, setLearnerData] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { sentRequests = [], fetchSentRequests } = useRequests();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      const storedName = localStorage.getItem("userName");
      const userId = localStorage.getItem("userId");

      if (!token || role !== "learner") {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setUserName(storedName || "Learner");

      emitUserOnline(userId, "learner");

      try {
        const data = await profileAPI.getLearnerProfile();
        setLearnerData(data?.learner || null);

        if (fetchSentRequests) {
          await fetchSentRequests();
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching learner profile:", err);
        // Set default learner data instead of error
        setLearnerData({
          userId: { name: 'Learner', email: '' },
          bio: '',
          interests: [],
          learningGoals: [],
          preferredSubjects: [],
          availability: [],
        });
        if (fetchSentRequests) {
          await fetchSentRequests();
        }
        setLoading(false);
      }
    };

    checkAuthAndFetchData();

    window.addEventListener("pageshow", checkAuthAndFetchData);
    window.addEventListener("focus", checkAuthAndFetchData);

    return () => {
      window.removeEventListener("pageshow", checkAuthAndFetchData);
      window.removeEventListener("focus", checkAuthAndFetchData);
    };
  }, [navigate, fetchSentRequests]);

  if (loading) {
    return (
      <motion.div
        className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full">
          {/* Skeleton Welcome Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          </div>

          {/* Skeleton Requests */}
          <div className="mb-10">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(2)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>

          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          </div>

          {/* Skeleton Weekly Progress */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      <div className="w-full">

        {/* Welcome Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          <AnimatedCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-blue-50 p-8 rounded-3xl"
          >
            <h1 className="text-3xl font-bold text-blue-600">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-600 mt-3">
              Here's your learning progress for today.
            </p>
          </AnimatedCard>

          <AnimatedCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gray-100 p-6 rounded-2xl"
          >
            <LiveTutorStats />
          </AnimatedCard>

        </div>

        {/* Requests */}
        {sentRequests.length > 0 && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">📬 My Learning Requests</h2>
            <RequestStatus requests={sentRequests} isLoading={loading} />
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">

          <AnimatedCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <StatCard
              title="Skill Level"
              value={learnerData?.skillLevel || "Beginner"}
              icon={<Star size={20} />}
            />
          </AnimatedCard>

          <AnimatedCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <StatCard
              title="Current Week"
              value={`${learnerData?.currentWeekHours || 0}/${learnerData?.weeklyHourGoal || 10}h`}
              icon={<PlayCircle size={20} />}
            />
          </AnimatedCard>

        </div>

        {/* Weekly Progress */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          <AnimatedCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-blue-600 text-white p-8 rounded-2xl"
          >

            <h4 className="font-bold mb-4 text-lg">
              Weekly Goal Progress
            </h4>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold">
                {learnerData?.currentWeekHours || 0}/{learnerData?.weeklyHourGoal || 10}
              </span>
              <span className="text-sm mb-1">hours</span>
            </div>

            <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden">

              <div
                className="bg-white h-full rounded-full"
                style={{
                  width: `${((learnerData?.currentWeekHours || 0) /
                    (learnerData?.weeklyHourGoal || 10)) * 100}%`
                }}
              />

            </div>

          </AnimatedCard>

          <AnimatedCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <DailyLearningStreak learnerData={learnerData} />
          </AnimatedCard>

        </div>

      </div>

      {/* Floating Buttons */}
      <motion.div
        className="fixed bottom-8 right-8 flex flex-col gap-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >

        <motion.a
          href="/profile"
          className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings size={20} />
        </motion.a>

        <motion.a
          href="/tutors"
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap size={20} />
        </motion.a>

      </motion.div>

      {/* 🤖 AI CHATBOT */}
      <motion.div
        className="fixed bottom-8 left-8 z-50 w-[360px]"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <ChatBot role="learner" />
      </motion.div>

    </motion.div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <GlassCard className="bg-white border p-6 rounded-2xl shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-blue-600 mt-2">{value}</p>
      </div>
      <div className="text-blue-500 opacity-60">
        {icon}
      </div>
    </div>
  </GlassCard>
);

export default LearnerDashboard;