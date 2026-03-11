import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ChatBot = ({ role = "learner" }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ================= LOAD CHAT HISTORY =================
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await axios.get(
          `${API_BASE}/api/ai-chat/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    loadHistory();
  }, []);

  // ================= SEND MESSAGE =================
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();

    const userMessage = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/ai-chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          role: role, // 👈 learner or tutor
        }),
      });

      const data = await response.json();

      const aiText =
        data.response ||
        data.reply ||
        data.text ||
        "No response from AI.";

      const aiMessage = {
        role: "assistant",
        content: aiText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI error:", error);
      let errText = "⚠️ AI service unavailable. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errText = error.response.data.message;
      }
      const errorMessage = {
        role: "assistant",
        content: errText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg shadow-lg">

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center text-gray-500 text-sm">
            🤖 AI is typing...
          </div>
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT BOX */}
      <div className="flex p-2 border-t">

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage()
          }
          className="flex-1 p-2 border rounded-l outline-none"
          placeholder="Ask AI something..."
        />

        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition"
          disabled={loading}
        >
          Send
        </button>

      </div>

    </div>
  );
};

export default ChatBot;