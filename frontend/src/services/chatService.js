import axios from 'axios';
import { API_BASE_URL as BASE_API_URL, BACKEND_URL } from '../config/api';

const API_BASE_URL = `${BASE_API_URL}/messages`;
const AI_WEBHOOK_URL = import.meta.env.VITE_AI_WEBHOOK_URL || `${BACKEND_URL}/webhook/skill-exchange-chat`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

const chatService = {
  // Send a message
  sendMessage: async (receiverId, content, fileData = null) => {
    try {
      const payload = { receiverId, content };
      
      // Add file metadata if present
      if (fileData) {
        payload.messageType = fileData.messageType || 'file';
        payload.fileUrl = fileData.fileUrl;
        payload.fileName = fileData.fileName;
        payload.fileSize = fileData.fileSize;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/send`,
        payload,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get conversation messages
  getConversation: async (otherUserId, page = 1, limit = 50) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/conversation/${otherUserId}`,
        {
          headers: getAuthHeader(),
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Get all conversations (chat list)
  getConversations: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/conversations/list`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/unread/count`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/${messageId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};

export default chatService;

// AI CHAT FUNCTION
export const sendAIMessage = async (message) => {
  try {
    const response = await fetch(
      import.meta.env.VITE_AI_WEBHOOK_URL || `${BACKEND_URL}/webhook/skill-exchange-chat`,
      {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message
        })
      }
    );

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("AI error:", error);
    throw error;
  }
};