# Optional: Adding Sound Toggle to Navbar

If you want to add the notification sound toggle to your navbar, here's how:

## Option 1: Add to Existing Navbar Component

Find your navbar component (likely `Navbar.jsx` or `Header.jsx`) and add the import and button:

```jsx
import React from 'react';
import NotificationSoundToggle from '../components/NotificationSoundToggle';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-white dark:bg-gray-900 px-6 py-4 shadow">
      {/* Logo/Brand */}
      <div className="text-xl font-bold">YourApp</div>

      {/* Nav Links */}
      <div className="flex items-center gap-6">
        <a href="/home">Home</a>
        <a href="/messages">Messages</a>
        <a href="/profile">Profile</a>

        {/* Add Sound Toggle Here */}
        <div className="border-l border-gray-300 dark:border-gray-700 pl-6">
          <NotificationSoundToggle />
        </div>
      </div>
    </nav>
  );
}
```

## Option 2: Standalone Sound Button in Any Component

```jsx
import NotificationSoundToggle from '../components/NotificationSoundToggle';

function MyComponent() {
  return (
    <div className="flex items-center gap-4">
      {/* Your content */}
      <NotificationSoundToggle />
    </div>
  );
}
```

## What It Looks Like

### Default State (Sound Off)
- Icon: Volume muted
- Color: Gray
- Tooltip: "Notifications: Off"

### Enabled State (Sound On)
- Icon: Volume unmuted
- Color: Dark gray/slate
- Tooltip: "Notifications: On"
- Preview beep plays when enabling

## Customization

### Change Icon Styling
Edit `NotificationSoundToggle.jsx`:

```jsx
<Volume2 
  size={20} 
  className="text-blue-600 dark:text-blue-300"  // Change colors here
/>
```

### Change Tooltip Position
```jsx
{/* Tooltip above instead of below */}
<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
  {/* Tooltip content */}
</div>
```

### Add Badge for Status
```jsx
<div className="relative">
  <NotificationSoundToggle />
  {soundEnabled && (
    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
  )}
</div>
```

## Example: Full Navbar with Sound Toggle

```jsx
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import NotificationSoundToggle from '../components/NotificationSoundToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">Tutor</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Home
            </a>
            <a href="/tutors" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Find Tutors
            </a>
            <a href="/messages" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Messages
            </a>
            <a href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Profile
            </a>

            {/* Divider */}
            <div className="border-l border-gray-300 dark:border-gray-700 h-6" />

            {/* Sound Toggle */}
            <NotificationSoundToggle />

            {/* User Menu */}
            <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Account
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="/" className="block px-4 py-2 text-gray-700 dark:text-gray-300">
              Home
            </a>
            <a href="/tutors" className="block px-4 py-2 text-gray-700 dark:text-gray-300">
              Find Tutors
            </a>
            <a href="/messages" className="block px-4 py-2 text-gray-700 dark:text-gray-300">
              Messages
            </a>
            <a href="/profile" className="block px-4 py-2 text-gray-700 dark:text-gray-300">
              Profile
            </a>
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <NotificationSoundToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

## Integration Checklist

- [ ] Import `NotificationSoundToggle` component
- [ ] Add to navbar/header component
- [ ] Test that button appears
- [ ] Test sound toggle functionality
- [ ] Verify tooltip shows correctly
- [ ] Check dark mode styling
- [ ] Test on mobile view

## Testing

1. **Click the button**
   - Should toggle between muted/unmuted icon
   - Tooltip should update

2. **Enable sound**
   - Should hear a preview beep
   - Icon should change to "volume on"

3. **Reload page**
   - Icon should show previous state (persisted)

4. **Mobile view**
   - Button should be visible and clickable
   - Tooltip should adjust position if needed

## Troubleshooting

### Button not appearing?
- Check import path is correct
- Verify `NotificationSoundToggle.jsx` exists
- Check file has proper export

### Sound not playing?
- Sound is toggled OFF by default
- Click button to enable
- May need to interact with page first (audio context requirement)

### Icon not changing?
- Check `useNotifications` hook is working
- Verify context is wrapped in app
- Check console for errors

## Notes

- Button is small and non-intrusive (20px icon)
- Tooltip appears on hover for 2 seconds
- Works in all browsers that support audio
- Persists preference to localStorage
- No additional dependencies needed
