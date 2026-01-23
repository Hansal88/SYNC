import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, LogOut, MessageSquare, UserCircle, 
  FileText, Settings, Search, Sun, Moon, Bell 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import chatService from '../../services/chatService';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- LOGIC: Get User Data from LocalStorage ---
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'Instructor';

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Security check: If someone tries to access dashboard without token
    if (!token) {
      navigate('/login');
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, navigate]);

  // Fetch conversations/messages for notifications
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await chatService.getConversations();
        const conversations = response.data || [];
        
        // Convert conversations to notifications
        const messageNotifications = conversations.map((conv, index) => ({
          id: index,
          name: conv.participantName || conv.otherUserName || 'Unknown User',
          message: conv.lastMessage || 'No message',
          time: conv.lastMessageTime ? formatTime(conv.lastMessageTime) : 'just now',
          type: 'message',
          userId: conv.participantId || conv.otherUserId,
          unread: conv.unreadCount || 0,
        }));
        
        setNotifications(messageNotifications);
        
        // Count total unread messages
        const totalUnread = messageNotifications.reduce((sum, notif) => sum + notif.unread, 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    // Fetch on mount
    fetchConversations();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click - navigate to chat with that user
  const handleNotificationClick = (userId) => {
    navigate(`/chat/${userId}`);
  };

  // --- LOGIC: Real Sign Out ---
  const handleSignOut = () => {
    localStorage.clear(); // This removes token, role, and name
    navigate('/login');
  };

  const currentRole = localStorage.getItem('userRole') || 'learner';
  const isTutor = currentRole === 'tutor';
  const isLearner = currentRole === 'learner';
  const basePath = isTutor ? '/TutorDashboard' : '/dashboard/learner';

  const isActivePath = (path) => {
    // Exact match for paths like /chat, /tutors, /bookings
    if (path.length > 1 && !path.includes('profile')) return location.pathname === path;
    // For base paths like /TutorDashboard or /dashboard/learner, only match exact or with /profile suffix
    return location.pathname === path || location.pathname === path + '/profile';
  };

  const getHeaderContent = () => {
    const path = location.pathname;
    if (path.includes('messages') || path.includes('chat')) return { title: 'Messages', subtitle: 'Chat with tutors and learners.' };
    if (path.includes('notes')) return { title: 'My Resources', subtitle: 'Review your course materials.' };
    if (path.includes('tutors')) return { title: 'Find Tutors', subtitle: 'Discover and book expert tutors.' };
    if (path.includes('bookings')) return { title: 'My Bookings', subtitle: 'Manage your sessions.' };
    return isTutor ? { title: 'Tutor Dashboard', subtitle: 'Monitor your pedagogical impact.' } : { title: 'Learner Dashboard', subtitle: 'Track your learning progress.' };
  };

  const header = getHeaderContent();

  return (
    <div className="flex min-h-screen font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`flex flex-col fixed h-full z-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-lg dark:shadow-slate-900/50 ${sidebarExpanded ? 'w-64' : 'w-20'}`}
      >
        <div className="p-6 py-6">
          <div className="flex items-center gap-3 px-2 mb-10 cursor-pointer group hover:opacity-80 transition-opacity" onClick={() => navigate("/")} title="Skill Exchange">
            {sidebarExpanded ? (
              <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase whitespace-nowrap animate-in fade-in duration-300">Skill Exchange</h1>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 flex-shrink-0">SE</div>
            )}
          </div>

          <nav className="space-y-1">
            {sidebarExpanded && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-4">{isTutor ? 'Teaching' : 'Learning'}</p>}
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={isActivePath(basePath)} onClick={() => navigate(basePath)} expanded={sidebarExpanded} />
            {isTutor && <SidebarItem icon={<FileText size={18} />} label="My Resources" active={isActivePath(basePath + '/notes')} onClick={() => navigate(basePath + '/notes')} expanded={sidebarExpanded} />}
            <SidebarItem icon={<MessageSquare size={18} />} label="Messages" active={isActivePath('/chat')} onClick={() => navigate('/chat')} expanded={sidebarExpanded} />
            {isLearner && <SidebarItem icon={<Search size={18} />} label="Find Tutors" active={isActivePath('/tutors')} onClick={() => navigate('/tutors')} expanded={sidebarExpanded} />}
            <SidebarItem icon={<Settings size={18} />} label="My Bookings" active={isActivePath('/bookings')} onClick={() => navigate('/bookings')} expanded={sidebarExpanded} />
          </nav>
        </div>

        <div className="mt-auto p-4 bg-gradient-to-b from-transparent via-blue-500/5 to-blue-600/10 dark:from-transparent dark:via-blue-500/10 dark:to-blue-900/20 border-t border-blue-200/30 dark:border-blue-800/30 space-y-3">
          <button 
            onClick={handleSignOut}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-red-500/20 active:scale-95 w-full ${sidebarExpanded ? 'justify-center' : 'justify-center'}`}
            title="Logout"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {sidebarExpanded && <span>Logout</span>}
          </button>
          <button 
            onClick={() => navigate(basePath + '/profile')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 hover:from-blue-500/20 hover:to-purple-500/20 dark:hover:from-blue-600/30 dark:hover:to-purple-600/30 text-slate-700 dark:text-slate-200 font-bold text-sm hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 transform w-full ${sidebarExpanded ? 'justify-start' : 'justify-center'}`}
            title="My Profile"
          >
            <UserCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            {sidebarExpanded && <span>My Profile</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{header.title}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">{header.subtitle}</p>
            </div>

            <div className="flex items-center gap-4 relative">
              <button onClick={toggleTheme} className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-yellow-400">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative" onMouseEnter={() => setShowNotifications(true)} onMouseLeave={() => setShowNotifications(false)}>
                <button 
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">Messages</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif.userId)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${notif.unread > 0 ? 'bg-blue-50/50 dark:bg-slate-700/30' : ''}`}
                          >
                            <div className="flex gap-3 items-start">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                {notif.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`font-bold text-slate-900 dark:text-white text-sm truncate ${notif.unread > 0 ? 'font-extrabold' : ''}`}>
                                    {notif.name}
                                  </p>
                                  {notif.unread > 0 && (
                                    <span className="text-xs font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                      {notif.unread > 9 ? '9+' : notif.unread}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 truncate">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1.5">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <p className="text-sm">No messages yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-300 group" onClick={() => navigate(basePath + '/profile')}>
                {/* DYNAMIC INITIALS */}
                <div className="w-9 h-9 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  {/* DYNAMIC NAME & ROLE */}
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{userName}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{userRole}</p>
                </div>
              </div>
            </div>
          </header>

          <Outlet context={{ isDarkMode }} /> 
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, expanded }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 w-full ${expanded ? 'justify-start' : 'justify-center'} ${active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-slate-200"} hover:scale-105 active:scale-95 transform`}
    title={label}
  >
    <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>
    {expanded && <span className="text-sm font-bold whitespace-nowrap">{label}</span>}
  </button>
);

export default DashboardLayout;