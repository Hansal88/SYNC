# Real-Time Notifications System

## Overview

A comprehensive real-time in-app notification system for new messages and tutor availability changes. Features include:

- ✅ **Real-time notifications** using existing Socket.IO infrastructure
- ✅ **Multiple notification types** (messages, tutor availability, requests, etc.)
- ✅ **Animated UI** with subtle slide/fade animations
- ✅ **Sound notifications** with Web Audio API (togglable, off by default)
- ✅ **Dark mode support** with theme-aware styling
- ✅ **Non-intrusive design** that matches site theme
- ✅ **Persistent settings** (sound preference saved to localStorage)

## Architecture

### Context & Providers

#### **NotificationContext** (`src/context/NotificationContext.jsx`)
- Manages notification queue and state
- Handles sound toggle preference
- Provides methods to add/remove/clear notifications
- Stores sound setting in localStorage

### Components

#### **NotificationContainer** (`src/components/NotificationContainer.jsx`)
- Displays all active notifications in a stack
- Uses Framer Motion for smooth animations
- Supports multiple notification types with color-coded UI
- Shows progress bar for auto-close countdown
- Responsive and mobile-friendly

#### **NotificationSoundToggle** (`src/components/NotificationSoundToggle.jsx`)
- UI button to toggle sound on/off
- Can be placed in navbar or settings
- Shows tooltip with current state
- Plays preview sound when enabling

#### **AppInitializer** (`src/components/AppInitializer.jsx`)
- Sets up real-time notification listeners
- Initializes audio context on first user interaction
- Should wrap the app content

### Services & Utilities

#### **Socket Service Extensions** (`src/services/socketService.js`)
New listeners for notifications:
```javascript
onNewMessage(callback)           // Listens for new messages
onTutorAvailabilityChanged()     // Listens for tutor status changes
onNotification(callback)         // Generic notification listener
emitMessageRead()                // Sends read receipts
```

#### **Sound Notification** (`src/utils/soundNotification.js`)
Generates notification sounds using Web Audio API:
- No external audio files needed
- Different beep patterns for different notification types
- Safe fallback to URL-based audio if available
- Volume controlled at 30% for comfort

### Hooks

#### **useRealTimeNotifications** (`src/hooks/useRealTimeNotifications.js`)
- Integrates socket listeners with notification system
- Handles new message notifications
- Handles tutor availability changes
- Plays sounds when enabled
- Routes notifications to NotificationContainer

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── NotificationContainer.jsx      (main display)
│   │   ├── NotificationSoundToggle.jsx    (settings button)
│   │   └── AppInitializer.jsx             (setup hook)
│   ├── context/
│   │   └── NotificationContext.jsx        (state management)
│   ├── hooks/
│   │   └── useRealTimeNotifications.js    (listener setup)
│   ├── utils/
│   │   └── soundNotification.js           (audio generation)
│   ├── services/
│   │   └── socketService.js               (extended with notification listeners)
│   └── App.jsx                            (integrated providers)
```

## Usage

### 1. Basic Setup (Already Done in App.jsx)

```jsx
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import AppInitializer from './components/AppInitializer';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <RequestProvider>
          <AppInitializer>
            <NotificationContainer />
            <AppRoutes />
          </AppInitializer>
        </RequestProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
```

### 2. Adding the Sound Toggle to Navbar

```jsx
import NotificationSoundToggle from './components/NotificationSoundToggle';

function Navbar() {
  return (
    <nav className="flex items-center gap-4">
      {/* other navbar items */}
      <NotificationSoundToggle />
    </nav>
  );
}
```

### 3. Manually Triggering Notifications

```jsx
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { addNotification } = useNotifications();

  const handleClick = () => {
    addNotification({
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from John',
      duration: 6000,
      action: () => {
        // Your action here
        console.log('Notification clicked!');
      },
      actionLabel: 'View',
    });
  };

  return <button onClick={handleClick}>Trigger Notification</button>;
}
```

## Notification Types

### Supported Types
- `message` - New message notifications (blue)
- `tutor-availability` - Tutor status change (purple)
- `request-accepted` - Request acceptance (green)
- `request-rejected` - Request rejection (red)
- `success` - Success messages (green)
- `error` - Error messages (red)
- `info` - Generic info (gray)

### Example Notification Structure

```javascript
{
  type: 'message',                          // Notification type
  title: 'New message from Sarah',          // Main heading
  message: 'Hi, are you available today?',  // Message content
  duration: 6000,                           // Auto-close in 6s (0 = manual)
  metadata: {                               // Custom data
    senderId: 'user123',
    conversationId: 'conv456'
  },
  action: () => navigate('/chat/user123'),  // Click handler
  actionLabel: 'View Message',              // Button text
}
```

## Backend Integration Points

### Expected Socket Events (Backend → Frontend)

#### New Message
```javascript
socket.emit('new_message', {
  senderName: 'John Doe',
  senderId: 'tutor_123',
  conversationId: 'conv_456',
  preview: 'Are you available tomorrow?'
});
```

#### Tutor Availability Changed
```javascript
socket.emit('tutor_availability_changed', {
  tutorName: 'Sarah Smith',
  tutorId: 'tutor_789',
  isAvailable: true,
  subject: 'Mathematics'
});
```

#### Generic Notification
```javascript
socket.emit('notification', {
  type: 'request-accepted',
  title: 'Request Accepted',
  message: 'Sarah has accepted your tutoring request',
  metadata: {
    redirect: '/chat/tutor_789'
  }
});
```

### Adding These Events to Backend

In `backend/server.js`, add these handlers:

```javascript
// In the chat routes or message handler
io.to(recipientSocketId).emit('new_message', {
  senderName: sender.name,
  senderId: sender._id,
  conversationId: conversationId,
  preview: message.content.substring(0, 50)
});

// In the tutor availability route
io.emit('tutor_availability_changed', {
  tutorName: tutor.name,
  tutorId: tutor._id,
  isAvailable: tutor.isAvailable,
  subject: tutor.subject
});
```

## Styling & Theme

### Dark Mode Support
All notifications automatically adapt to light/dark mode:
- Light theme: Light backgrounds with dark text
- Dark theme: Dark backgrounds with light text
- Smooth transitions between themes

### Color Scheme (Matches Site Theme)
- **Blue** - Messages (primary action)
- **Purple** - Tutor availability
- **Green** - Success/accepted
- **Red** - Errors/rejected
- **Gray** - Generic info

### Animations
- **Entry**: Slide in from right + fade in (300ms)
- **Progress Bar**: Linear scale animation
- **Exit**: Slide out to right + fade out (300ms)
- **Smooth Spring**: Uses Framer Motion spring physics for natural feel

## Sound Notifications

### Sound Types
| Type | Pattern | Use Case |
|------|---------|----------|
| `message` | Two beeps (800Hz, 1000Hz) | New messages |
| `request` | Three ascending (600-1000Hz) | Request events |
| `availability` | Two descending (900-700Hz) | Tutor status |
| `success` | Single high (1000Hz) | Success events |
| `error` | Low warning (500-400-500Hz) | Errors |

### Features
- ✅ OFF by default (respects user preference)
- ✅ Toggleable with UI button
- ✅ Web Audio API (no external files)
- ✅ Persistent preference (saved to localStorage)
- ✅ Preview sound when enabling
- ✅ ~30% volume for comfort

## Performance

- **Lazy initialized**: Audio context only created on first user interaction
- **Efficient re-renders**: Uses Framer Motion for GPU-accelerated animations
- **Memory managed**: Notifications auto-remove after duration
- **No network overhead**: Uses existing Socket.IO connection

## Browser Compatibility

- ✅ Chrome/Edge 70+
- ✅ Firefox 65+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Testing

### Manual Testing Steps

1. **Notification Display**
   ```javascript
   // In browser console, anywhere in the app
   // Note: First need to access the context somehow
   ```

2. **Sound Toggle**
   - Click sound icon in navbar
   - Should hear preview beep when enabling
   - Setting persists on page reload

3. **Real-time Events**
   - Open two browser windows (logged in as different users)
   - Send message → notification appears
   - Update tutor availability → notification appears

## Configuration

### Change Sound Volume
Edit `src/utils/soundNotification.js`, line ~60:
```javascript
gainNode.gain.setValueAtTime(0.3, now);  // Change 0.3 to desired volume (0-1)
```

### Change Default Duration
Edit notification types to adjust auto-close time:
```javascript
addNotification({
  // ...
  duration: 8000,  // Change from default 5000-6000ms
})
```

### Disable Sound System
Set `soundEnabled` to false in `NotificationContext.jsx`:
```javascript
const [soundEnabled, setSoundEnabled] = useState(false); // was: useState(false)
```

## Known Limitations & Future Improvements

### Current Limitations
- Sound uses synthesized tones (not customizable audio files)
- Notifications stack vertically on desktop (by design)
- Max 3 notifications visible at once (by design, prevents clutter)

### Future Enhancements
- [ ] Notification history/archive
- [ ] Notification preferences per type
- [ ] Browser push notifications integration
- [ ] Custom notification sounds
- [ ] Notification groups (collapse similar types)
- [ ] Actionable notifications with more than one action
- [ ] Desktop notifications API integration

## Troubleshooting

### Notifications Not Appearing
1. Check that `NotificationProvider` wraps the app
2. Verify `NotificationContainer` is rendered
3. Check browser console for socket connection errors
4. Ensure backend is emitting the correct events

### Sound Not Working
1. Check browser audio is enabled
2. Check volume is unmuted in notification settings
3. Try clicking anywhere on the page (audio context requires user interaction)
4. Check browser console for audio errors

### Socket Events Not Received
1. Verify backend is emitting correct event names
2. Check Socket.IO connection is established (`socket.id` should log in console)
3. Ensure the socket event handler is registered (`onNewMessage`, etc.)
4. Check network tab for socket message delivery

## Related Documentation
- [Socket Service](../../services/socketService.js)
- [Request Context](../../context/RequestContext.jsx)
- [App Configuration](../../App.jsx)
