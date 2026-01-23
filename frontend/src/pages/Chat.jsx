import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, MoreVertical, ArrowLeft, Check, CheckCheck, MessageCircle, MessageSquare, Smile, Paperclip, Phone, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import chatService from '../services/chatService';
import profileService from '../services/profileService';
import { 
  onChatCreated, 
  offChatCreated,
  onMessageDelivered,
  offMessageDelivered,
  onMessageReadReceipt,
  offMessageReadReceipt,
  emitMessageDelivered,
  emitMessageRead,
  onUserTyping,
  offUserTyping,
  onUserStopTyping,
  offUserStopTyping,
} from '../services/socketService';
import { useMessageDelivery } from '../hooks/useMessageDelivery';
import { useMessageVisibility } from '../hooks/useMessageVisibility';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useFileUpload } from '../hooks/useFileUpload';
import { MessageStatusIndicator } from '../components/MessageStatusIndicator';
import { TypingIndicator } from '../components/TypingIndicator';
import { FileUploadBox, UploadProgressBar, FileUploadError } from '../components/FileUploadBox';
import { FileMessage } from '../components/FileMessage';
import { createFilePreview, revokeFilePreview } from '../utils/fileUpload';

export default function Chat() {
  const navigate = useNavigate();
  const { otherUserId } = useParams();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(otherUserId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipientTyping, setRecipientTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageStatuses, setMessageStatuses] = useState(new Map()); // Track delivery status
  const { 
    getMessageStatus, 
    markAsSending, 
    markAsDelivered, 
    markAsRead, 
    markAsFailed, 
    resetAllStatuses 
  } = useMessageDelivery();
  const { handleUserTyping, stopTyping } = useTypingIndicator(
    selectedConversation ? [currentUser?._id, selectedConversation].sort().join('_') : '',
    currentUser?._id,
    selectedConversation
  );
  const [otherUser, setOtherUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  
  // File upload state
  const { 
    uploading, 
    uploadProgress, 
    uploadError, 
    selectedFile, 
    handleFileSelect, 
    uploadFile, 
    clearFile, 
    clearError 
  } = useFileUpload();
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');

        // Set a basic user object with stored info
        if (userId && userName) {
          setCurrentUser({
            _id: userId,
            userId: userId,
            name: userName,
          });
        } else {
          // Fallback: try to fetch profile
          const profileResponse = await profileService.getProfile();
          if (profileResponse.user) {
            setCurrentUser(profileResponse.user);
          } else {
            // If all else fails, create a temporary user object
            setCurrentUser({
              _id: 'current-user',
              userId: 'current-user',
              name: 'Me',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        // Set a default user object so chat can still function
        setCurrentUser({
          _id: 'current-user',
          userId: 'current-user',
          name: 'Me',
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Get conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await chatService.getConversations();
        const fetchedConversations = response.data || [];
        setConversations(fetchedConversations);
        
        if (otherUserId && !selectedConversation) {
          const exists = fetchedConversations.some(
            (conv) => conv.otherUser && conv.otherUser._id === otherUserId
          );
          if (!exists) {
            setSelectedConversation(otherUserId);
          } else {
            setSelectedConversation(otherUserId);
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err.response?.data?.message || 'Failed to load conversations');
        setConversations([]);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await chatService.getUnreadCount();
        setUnreadCount(response.unreadCount || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchConversations();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [otherUserId, selectedConversation]);

  // Listen for chat_created event (when tutor accepts learner request)
  useEffect(() => {
    const handleChatCreated = (data) => {
      const { chatId, tutorId, learnerId, requestId } = data;
      console.log('💬 Chat created event received:', { chatId, tutorId, learnerId, requestId });
      
      // Refresh conversations list to include the new chat
      const fetchConversations = async () => {
        try {
          const response = await chatService.getConversations();
          const fetchedConversations = response.data || [];
          setConversations(fetchedConversations);
          
          // Optionally auto-navigate to the new chat
          const newChat = fetchedConversations.find(
            (conv) => {
              const conversationId = [tutorId, learnerId].sort().join('_');
              return conv.conversationId === conversationId || conv._id === chatId;
            }
          );
          
          if (newChat) {
            const otherUserIdForChat = newChat.otherUser?._id || (tutorId || learnerId);
            console.log('✅ New chat loaded, other user:', otherUserIdForChat);
            // Uncomment next line to auto-navigate
            // navigate(`/chat/${otherUserIdForChat}`);
          }
        } catch (err) {
          console.error('Error refreshing conversations after chat creation:', err);
        }
      };
      
      fetchConversations();
    };

    onChatCreated(handleChatCreated);
    return () => offChatCreated();
  }, []);

  // Listen for message delivery confirmations
  useEffect(() => {
    const handleMessageDelivered = (data) => {
      const { messageId } = data;
      markAsDelivered(messageId);
      setMessageStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(messageId, 'delivered');
        return newMap;
      });
      console.log(`📦 Message delivered: ${messageId}`);
    };

    const handleMessageRead = (data) => {
      const { messageId } = data;
      markAsRead(messageId);
      setMessageStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(messageId, 'read');
        return newMap;
      });
      console.log(`✓ Message read: ${messageId}`);
    };

    onMessageDelivered(handleMessageDelivered);
    onMessageReadReceipt(handleMessageRead);

    return () => {
      offMessageDelivered();
      offMessageReadReceipt();
    };
  }, [markAsDelivered, markAsRead]);

  // Listen for typing indicators
  useEffect(() => {
    const handleUserTyping = (data) => {
      const { userId, conversationId } = data;
      if (userId !== currentUser?._id) {
        setRecipientTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-clear typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setRecipientTyping(false);
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      const { userId } = data;
      if (userId !== currentUser?._id) {
        setRecipientTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    onUserTyping(handleUserTyping);
    onUserStopTyping(handleUserStopTyping);

    return () => {
      offUserTyping();
      offUserStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser?._id]);

  // Get messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      setOtherUser(null);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await chatService.getConversation(selectedConversation);
        const fetchedMessages = response.data || [];
        setMessages(fetchedMessages);

        // Set other user info
        if (response.otherUser) {
          setOtherUser(response.otherUser);
        } else {
          const conversation = conversations.find(
            (conv) => conv.otherUser && conv.otherUser._id === selectedConversation
          );
          if (conversation && conversation.otherUser) {
            setOtherUser(conversation.otherUser);
          } else if (fetchedMessages.length > 0) {
            const firstMessage = fetchedMessages[0];
            const otherUserFromMessage = firstMessage.senderId._id === currentUser?._id 
              ? firstMessage.receiverId 
              : firstMessage.senderId;
            setOtherUser(otherUserFromMessage);
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.response?.data?.message || 'Failed to load messages');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);
    return () => {
      clearInterval(interval);
      resetAllStatuses();
    };
  }, [selectedConversation, conversations, currentUser, resetAllStatuses]);

  // Handle file selection
  const handleFileSelection = (file) => {
    if (handleFileSelect(file)) {
      const preview = createFilePreview(file);
      setFilePreviewUrl(preview);
    }
  };

  // Handle sending file message
  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation) {
      console.log('Missing file or conversation:', { selectedFile, selectedConversation });
      return;
    }

    try {
      stopTyping(); // Stop typing indicator if active
      
      console.log('🔄 Starting file upload...');
      console.log('Conversation ID:', [currentUser?._id, selectedConversation].sort().join('_'));
      
      // Upload file first
      const uploadResult = await uploadFile(selectedFile, [currentUser?._id, selectedConversation].sort().join('_'));
      
      console.log('Upload result:', uploadResult);
      
      if (!uploadResult.success) {
        console.error('Upload failed');
        return;
      }

      // Create file message
      const fileMessage = {
        receiverId: selectedConversation,
        content: `[File: ${uploadResult.fileName}]`,
        messageType: 'file',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
      };

      console.log('📨 Sending file message:', fileMessage);

      // Send file message to backend
      const sendResponse = await chatService.sendMessage(selectedConversation, fileMessage.content, fileMessage);
      
      console.log('✅ File message sent:', sendResponse);
      
      setError(''); // Clear any previous errors
      
      // Clear upload state
      clearFile();
      setShowFileUpload(false);
      if (filePreviewUrl) {
        revokeFilePreview(filePreviewUrl);
        setFilePreviewUrl(null);
      }

      // Refresh messages
      const response = await chatService.getConversation(selectedConversation);
      setMessages(response.data || []);

      // Refresh conversations
      const convResponse = await chatService.getConversations();
      setConversations(convResponse.data || []);
    } catch (err) {
      console.error('❌ Error sending file:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send file');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const messageContent = messageText.trim();
    setMessageText('');
    setError('');

    // Optimistic UI update with sending status
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempMessageId,
      senderId: { _id: currentUser?._id || 'current' },
      receiverId: { _id: selectedConversation },
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    // Mark as sending immediately
    markAsSending(tempMessageId);
    setMessageStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(tempMessageId, 'sending');
      return newMap;
    });
    
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sendResponse = await chatService.sendMessage(selectedConversation, messageContent);
      const actualMessageId = sendResponse.data?._id || tempMessageId;
      
      // Mark as delivered once sent
      markAsDelivered(actualMessageId);
      setMessageStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(actualMessageId, 'delivered');
        return newMap;
      });
      
      // Emit delivery confirmation
      emitMessageDelivered([currentUser?._id, selectedConversation].sort().join('_'), actualMessageId, selectedConversation);
      
      const response = await chatService.getConversation(selectedConversation);
      setMessages(response.data || []);
      
      const convResponse = await chatService.getConversations();
      setConversations(convResponse.data || []);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      setMessageText(messageContent);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const formatLastSeen = (lastSeenDate) => {
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateHeader = (dateString, prevDateString) => {
    const date = new Date(dateString);
    const prevDate = prevDateString ? new Date(prevDateString) : null;
    
    if (!prevDate || date.toDateString() !== prevDate.toDateString()) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      }
    }
    return null;
  };

  if (!currentUser && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar - Conversations List */}
      {showSidebar && (
        <div className="w-80 bg-slate-800/95 backdrop-blur-xl flex flex-col border-r border-slate-700/50 shadow-2xl">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 dark:from-cyan-600 dark:via-blue-700 dark:to-purple-700 p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-lg border border-white/20 transform hover:scale-110 transition-transform duration-300">
                <MessageSquare size={24} />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Messages</h1>
                <p className="text-white/60 text-xs font-medium">Your Conversations</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg relative z-10 animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-300 font-semibold">No conversations yet</p>
                <p className="text-slate-500 text-sm mt-2">Start chatting with a tutor or learner</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {conversations.map((conv) => {
                  if (!conv.otherUser || !conv.otherUser._id) return null;
                  const isOnline = conv.otherUser.isOnline || false;
                  const isActive = selectedConversation === conv.otherUser._id;
                  
                  return (
                    <button
                      key={conv.otherUser._id}
                      onClick={() => {
                        setSelectedConversation(conv.otherUser._id);
                        setActiveChat(conv.otherUser._id);
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 transform hover:scale-102 group relative overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 shadow-lg' 
                          : 'hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                      }`}
                    >
                      {/* Background glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${isActive ? 'from-cyan-400 to-blue-600 opacity-20' : 'from-slate-600 to-slate-500'}`}></div>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="relative flex-shrink-0">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg border-2 border-slate-700 transition-all duration-300 ${isActive ? 'border-cyan-400 shadow-cyan-500/30' : 'border-slate-600'}`}>
                            {conv.otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-slate-800 shadow-lg animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-100 truncate text-base">
                              {conv.otherUser.name || 'Unknown User'}
                            </h3>
                            {conv.lastMessageTime && (
                              <span className="text-xs text-slate-400 flex-shrink-0 font-medium">
                                {formatTime(conv.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <p className="text-sm text-slate-400 truncate">
                              {conv.lastMessage || 'Start conversation...'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full ml-2 font-bold flex-shrink-0 shadow-lg">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          {isOnline && (
                            <p className="text-xs text-green-400 font-semibold mt-1.5">
                              ● Online now
                            </p>
                          )}
                          {!isOnline && conv.otherUser.lastSeen && (
                            <p className="text-xs text-slate-500 mt-1.5">
                              Active {formatLastSeen(conv.otherUser.lastSeen)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-lg p-5 flex items-center justify-between border-b border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-300 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-lg border-2 border-slate-700">
                  {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {otherUser?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-slate-800 shadow-lg animate-pulse"></div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-100">{otherUser?.name || 'Unknown User'}</h2>
                <p className="text-sm text-slate-400">
                  {otherUser?.isOnline ? (
                    <span className="text-green-400 font-semibold">● Online</span>
                  ) : otherUser?.lastSeen ? (
                    <span className="text-slate-500">Active {formatLastSeen(otherUser.lastSeen)}</span>
                  ) : (
                    'No status'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-300 hover:text-white hover:scale-110">
                <Phone size={20} />
              </button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-300 hover:text-white hover:scale-110">
                <Video size={20} />
              </button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-300 hover:text-white hover:scale-110">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide" ref={messagesContainerRef}>
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-600 border-t-blue-600 mb-4"></div>
                  </div>
                  <p className="text-slate-300 font-medium">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                    <MessageSquare size={40} className="text-cyan-400" />
                  </div>
                  <p className="text-slate-200 font-semibold text-lg">Start a Conversation</p>
                  <p className="text-slate-400 text-sm mt-2">Say hello to begin chatting! 👋</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => {
                  const senderId = msg.senderId?._id || msg.senderId;
                  const isCurrentUser = senderId === currentUser?._id || senderId === currentUser?.userId;
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const dateHeader = formatDateHeader(msg.createdAt, prevMessage?.createdAt);
                  
                  return (
                    <div key={msg._id} data-message-id={msg._id}>
                      {dateHeader && (
                        <div className="flex justify-center my-4">
                          <span className="bg-slate-700/40 backdrop-blur-sm text-slate-300 text-xs px-4 py-1.5 rounded-full font-semibold border border-slate-600/30">
                            {dateHeader}
                          </span>
                        </div>
                      )}
                      <div className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md group relative animate-fadeIn ${
                          isCurrentUser ? '' : 'flex items-end gap-2'
                        }`}
                        onMouseEnter={() => {
                          // Emit read receipt when message becomes visible
                          if (!isCurrentUser && !msg.isRead) {
                            emitMessageRead(
                              [currentUser?._id, selectedConversation].sort().join('_'),
                              msg._id,
                              msg.senderId?._id || msg.senderId
                            );
                            markAsRead(msg._id);
                          }
                        }}>
                          {!isCurrentUser && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className={`px-5 py-3 rounded-3xl backdrop-blur-sm transition-all duration-300 hover:scale-102 transform ${
                            isCurrentUser
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-none shadow-lg shadow-cyan-500/20'
                              : 'bg-slate-700/50 text-slate-100 rounded-bl-none shadow-md border border-slate-600/30 hover:bg-slate-700/70'
                          }`}>
                            {msg.messageType === 'file' && msg.fileUrl ? (
                              <>
                                <FileMessage
                                  fileUrl={msg.fileUrl}
                                  fileName={msg.fileName || 'File'}
                                  fileSize={msg.fileSize || 0}
                                  isOwn={isCurrentUser}
                                />
                              </>
                            ) : (
                              <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed`}>
                                {msg.content}
                              </p>
                            )}
                            <div className={`flex items-center justify-end gap-1.5 ${
                              msg.messageType === 'file' ? 'mt-1' : 'mt-2'
                            } ${
                              isCurrentUser ? 'text-cyan-100' : 'text-slate-400'
                            }`}>
                              {isCurrentUser ? (
                                <MessageStatusIndicator
                                  status={messageStatuses.get(msg._id) || (msg.isRead ? 'read' : 'delivered')}
                                  timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  isCurrentUser={true}
                                  messageId={msg._id}
                                  onRetry={null}
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex gap-2 animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="px-5 py-3 rounded-3xl bg-slate-700/50 border border-slate-600/30">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gradient-to-t from-slate-900 via-slate-800/90 to-slate-800/70 backdrop-blur-lg p-5 border-t border-slate-700/50 shadow-2xl">
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-3 font-medium border border-red-500/20 backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* File Upload Section */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="space-y-3">
                    <FileUploadError 
                      error={uploadError} 
                      onDismiss={clearError} 
                    />
                    
                    <FileUploadBox
                      selectedFile={selectedFile}
                      previewUrl={filePreviewUrl}
                      onFileSelect={handleFileSelection}
                      onClear={() => {
                        clearFile();
                        if (filePreviewUrl) revokeFilePreview(filePreviewUrl);
                        setFilePreviewUrl(null);
                      }}
                      disabled={uploading}
                      error={uploadError}
                    />

                    <UploadProgressBar 
                      progress={uploadProgress} 
                      isUploading={uploading}
                    />

                    {selectedFile && !uploading && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendFile}
                          disabled={uploading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
                        >
                          Send File
                        </button>
                        <button
                          onClick={() => {
                            clearFile();
                            if (filePreviewUrl) revokeFilePreview(filePreviewUrl);
                            setFilePreviewUrl(null);
                            setShowFileUpload(false);
                          }}
                          className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200 hover:scale-110"
              >
                <Paperclip size={20} />
              </button>
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    // Emit typing event on every keystroke (debounced internally)
                    if (e.target.value.trim()) {
                      handleUserTyping();
                    } else {
                      stopTyping();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-slate-700/50 backdrop-blur-sm px-5 py-3.5 rounded-2xl border border-slate-600/50 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 transition-all duration-300 font-medium"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                  <Smile size={18} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg shadow-cyan-500/40 disabled:shadow-none font-semibold"
              >
                <Send size={20} />
              </button>
            </form>

            {/* Typing indicator - shown when recipient is typing */}
            {recipientTyping && (
              <div className="mt-3">
                <TypingIndicator 
                  userName={otherUser?.name} 
                  isVisible={true}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-2 border-cyan-500/30 animate-float">
              <MessageCircle size={64} className="text-cyan-400" />
            </div>
            <h3 className="text-slate-100 text-3xl font-bold mb-3">Welcome to Messages</h3>
            <p className="text-slate-400 text-base mb-4 max-w-sm leading-relaxed">
              Select a conversation from the list to start messaging or create a new one
            </p>
            <p className="text-slate-500 text-sm">💬 Let's connect!</p>
          </div>
        </div>
      )}
    </div>
  );
}
