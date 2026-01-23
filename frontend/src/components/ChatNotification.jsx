import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle } from 'lucide-react';
import { useRequests } from '../context/RequestContext';

export default function ChatNotification() {
  const navigate = useNavigate();
  const { newChatNotification, setNewChatNotification } = useRequests();
  const [visible, setVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (newChatNotification) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newChatNotification]);

  const handleNavigateToChat = () => {
    if (newChatNotification) {
      navigate(`/chat/${newChatNotification.otherUserId}`);
      setVisible(false);
      setNewChatNotification(null);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setNewChatNotification(null);
  };

  if (!visible || !newChatNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-blue-400 dark:bg-blue-500 rounded-full p-2 flex-shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">New Chat Created!</h3>
              <p className="text-blue-100 text-xs mt-1">
                A chat conversation has been created from your request.
              </p>
              <button
                onClick={handleNavigateToChat}
                className="mt-3 bg-white text-blue-600 hover:bg-blue-50 font-medium py-1.5 px-3 rounded text-xs transition-colors"
              >
                Open Chat
              </button>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-200 hover:text-white ml-2 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
