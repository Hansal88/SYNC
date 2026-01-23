# Real-Time Notifications - Quick Reference

## 🚀 Quick Start

### Integration is Complete!

The notification system is fully integrated and ready to use. Just ensure your backend emits the right events.

## 📡 Backend Event Emitters

Add these to your backend Socket.IO handlers:

### 1. New Message Notification
**Location**: Message handler (e.g., when saving a message)

```javascript
// When a new message is saved
io.to(recipientSocketId).emit('new_message', {
  senderName: senderUser.name,           // String: Sender's display name
  senderId: senderUser._id,              // String: Sender's user ID
  conversationId: conversationId,        // String: Conversation/chat ID
  preview: message.content.substring(0, 50)  // String: Message preview
});
```

### 2. Tutor Availability Changed
**Location**: Tutor profile update handler

```javascript
// When tutor updates availability status
io.emit('tutor_availability_changed', {
  tutorName: tutor.name,                 // String: Tutor's name
  tutorId: tutor._id,                    // String: Tutor's ID
  isAvailable: tutor.isAvailable,        // Boolean: Current availability
  subject: tutor.subject                 // String: Subject (optional)
});
```

### 3. Generic Notification (Optional)
**Location**: Any significant event

```javascript
io.to(userSocketId).emit('notification', {
  type: 'request-accepted',              // String: 'request-accepted' | 'request-rejected' | 'error' | etc.
  title: 'Request Accepted',             // String: Notification title
  message: 'Sarah has accepted your request',  // String: Notification body
  metadata: {
    redirect: '/chat/tutor_789'          // Optional: URL to navigate to
  }
});
```

## 🎨 Frontend Usage

### Access Notifications Context
```jsx
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { addNotification, soundEnabled, toggleSound } = useNotifications();

  // Add a notification
  addNotification({
    type: 'message',
    title: 'New Message',
    message: 'You have received a message',
    duration: 6000,
    action: () => console.log('Clicked!'),
    actionLabel: 'View'
  });
}
```

### Add Sound Toggle to Navbar
```jsx
import NotificationSoundToggle from './components/NotificationSoundToggle';

function Navbar() {
  return (
    <nav>
      {/* Your nav items */}
      <NotificationSoundToggle />
    </nav>
  );
}
```

## 📋 Notification Types & Colors

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `message` | Blue | 💬 | New messages |
| `tutor-availability` | Purple | 👥 | Tutor status changes |
| `request-accepted` | Green | ✅ | Request accepted |
| `request-rejected` | Red | ❌ | Request rejected |
| `success` | Green | ✅ | Generic success |
| `error` | Red | ⚠️ | Errors/warnings |
| `info` | Gray | ℹ️ | Generic info |

## 🔊 Sound Settings

- **Default**: OFF
- **Toggle**: Use NotificationSoundToggle component
- **Storage**: Saved to localStorage (`notificationSoundEnabled`)
- **Volume**: 30% (user-friendly)

## 📁 File Structure

```
✅ NotificationContext.jsx       - State management
✅ NotificationContainer.jsx     - UI display
✅ NotificationSoundToggle.jsx   - Settings button
✅ AppInitializer.jsx            - Setup hook
✅ useRealTimeNotifications.js   - Event listeners
✅ soundNotification.js          - Audio generation
✅ socketService.js              - Extended with new listeners
✅ App.jsx                       - Integration complete
```

## 🧪 Testing

### Trigger a Test Notification (Dev Console)
```javascript
// Navigate to any page, open console, run this
// Note: Won't work outside React component context
// Instead, create a test component
```

### Test Flow
1. Open two browser windows (different users)
2. User A sends message → User B gets notification
3. Tutor updates availability → All users get notification
4. Click sound toggle → Hear preview beep

## ⚡ Performance Notes

- ✅ Animations use GPU acceleration (Framer Motion)
- ✅ Audio context lazy-loaded on first interaction
- ✅ Notifications auto-remove (no memory leaks)
- ✅ Efficient event listener cleanup

## 🐛 Common Issues & Fixes

### Notifications not appearing?
- [ ] Verify backend is emitting events
- [ ] Check Socket.IO connection in console
- [ ] Ensure `NotificationContainer` is in DOM

### Sound not working?
- [ ] Sound is OFF by default - enable in UI
- [ ] Click anywhere to activate audio context
- [ ] Check browser volume settings

### Wrong notification type showing?
- [ ] Verify backend event name matches (`new_message`, `tutor_availability_changed`, etc.)
- [ ] Check metadata structure in backend emit

## 📚 Full Documentation
See [REAL_TIME_NOTIFICATIONS_GUIDE.md](./REAL_TIME_NOTIFICATIONS_GUIDE.md)
