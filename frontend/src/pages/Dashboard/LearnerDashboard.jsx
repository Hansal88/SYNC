import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Star } from "lucide-react";
import profileAPI from "../../services/profileService";
import { useRequests } from "../../context/RequestContext";
import { emitUserOnline } from "../../services/socketService";
import LiveTutorStats from "../../components/LiveTutorStats";
import RequestStatus from "../../components/RequestStatus";
import DailyLearningStreak from "../../components/DailyLearningStreak";
import ChatBot from "../../components/ChatBot";

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
        setError("Failed to load profile data");
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full">

      <div className="w-full">

        {/* Welcome Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          <div className="bg-blue-50 p-8 rounded-3xl">
            <h1 className="text-3xl font-bold text-blue-600">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-600 mt-3">
              Here's your learning progress for today.
            </p>
          </div>

          <div className="bg-gray-100 p-6 rounded-2xl">
            <LiveTutorStats />
          </div>

        </div>

        {/* Requests */}
        {sentRequests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">📬 My Learning Requests</h2>
            <RequestStatus requests={sentRequests} isLoading={loading} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">

          <StatCard
            title="Skill Level"
            value={learnerData?.skillLevel || "Beginner"}
            icon={<Star size={20} />}
          />

          <StatCard
            title="Current Week"
            value={`${learnerData?.currentWeekHours || 0}/${learnerData?.weeklyHourGoal || 10}h`}
            icon={<PlayCircle size={20} />}
          />

        </div>

        {/* Weekly Progress */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-blue-600 text-white p-8 rounded-2xl">

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

          </div>

          <DailyLearningStreak learnerData={learnerData} />

        </div>

      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">

        <a
          href="/profile"
          className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"
        >
          ⚙️
        </a>

        <a
          href="/tutors"
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg"
        >
          🎓
        </a>

      </div>

      {/* 🤖 AI CHATBOT */}
      <div className="fixed bottom-8 left-8 z-50 w-[360px]">
        <ChatBot role="learner" />
      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border p-6 rounded-2xl shadow-sm">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-blue-600 mt-2">{value}</p>
      </div>

      <div className="text-blue-500 opacity-60">
        {icon}
      </div>

    </div>

  </div>
);

export default LearnerDashboard;