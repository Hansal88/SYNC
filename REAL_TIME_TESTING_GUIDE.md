# Real-Time Request & Live Status System - Testing Guide

## 🎯 System Overview

This implementation adds real-time request and live-status features to the tutoring platform using Socket.IO.

### Components Implemented:
- ✅ Backend: Request model, routes, and Socket.IO event handlers
- ✅ Frontend: Socket service, Request context, UI components
- ✅ Live Stats: Real-time tutor/learner online and session counters
- ✅ Request Flow: Send, receive, accept, reject with notifications

---

## 📋 Testing Checklist

### PART 1: Basic Setup Verification

#### Backend Server (Port 5000)
- [ ] Backend started with `npm start`
- [ ] Console shows:
  - `🚀 Server running on http://localhost:5000`
  - `⚡ Socket.IO ready for real-time communication`
  - `✅ MongoDB Connected Successfully!`

#### Frontend Server (Port 5173)
- [ ] Frontend running with `npm run dev`
- [ ] No socket.io-client import errors in console
- [ ] App loads without dependency errors

#### Database
- [ ] MongoDB connection successful
- [ ] `Request` model created (check MongoDB Atlas)

---

### PART 2: Socket.IO Connection Test

#### Step 1: Open Browser Console (F12)
1. Go to `http://localhost:5173/login`
2. Open DevTools → Console tab
3. Look for:
   - `✅ Socket connected: [socket-id]`

#### Step 2: Verify User Goes Online
1. Login as a Tutor
2. Navigate to Tutor Dashboard
3. Console should show:
   - `📱 Emitted user_online: [userId] (Role: tutor)`
4. Backend terminal should show:
   - `📱 User online: [userId] (Role: tutor)`

#### Step 3: Check Live Stats Update
1. Stay on Tutor Dashboard
2. Console should show (within 2 seconds):
   - `📊 Live stats updated: { onlineTutors: X, onlineLearners: Y, ... }`
3. Backend should emit:
   - `live_stats_update` event broadcast to all clients

---

### PART 3: Request Flow Testing

#### Scenario A: Learner Sends Request to Tutor

**Setup:**
- 2 browsers/tabs open:
  - Tab 1: Login as **Learner**
  - Tab 2: Login as **Tutor** (different user)

**Test Steps:**

1. **Learner Side:**
   - Go to "Find Tutors" page
   - Click on any tutor card
   - Click "Send Request" button
   - Fill form:
     - Subject: "Advanced JavaScript"
     - Message: "Help with async/await"
   - Click "Send Request"
   - Console should show:
     - `📬 Emitted send_request to tutor: [tutorId]`

2. **Backend Processing:**
   - Backend console should show:
     - `📬 Request sent from [learnerId] to tutor [tutorId]`
     - `✉️ Request delivered to tutor [tutorId]` (if tutor online)

3. **Tutor Side (Immediate):**
   - Tutor Dashboard should **refresh automatically** with new request
   - Console should show:
     - `📬 Received new request: {request object}`
   - "Incoming Learning Requests" card appears
   - Shows learner name, subject, message, timestamp
   - Green "✓ Accept" and Red "✗ Reject" buttons visible

4. **Learner Side (Immediate):**
   - "My Learning Requests" section updates
   - Shows status: "⏳ Pending"
   - Console shows:
     - `✅ Fetched sent requests: [...]`

---

#### Scenario B: Tutor Accepts Request

**From Tutor Dashboard:**

1. Click "✓ Accept" button on request card
2. Console shows:
   - `✅ Emitted accept_request: [requestId]`
3. Request card updates to show:
   - Status badge: "✅ Accepted"
   - Accept button disabled
4. Backend console shows:
   - `✅ Request accepted by tutor [tutorId] for learner [learnerId]`

**Learner Sees Instantly:**

1. On Learner Dashboard, request status changes to "✅ Accepted"
2. Console shows:
   - `🎉 Request accepted by tutor: [requestId]`
3. **NO PAGE REFRESH NEEDED** - happens via Socket.IO

---

#### Scenario C: Tutor Rejects Request

**From Tutor Dashboard:**

1. Click "✗ Reject" button on request card
2. Prompt appears asking for rejection reason (optional)
3. Enter reason: "Fully booked this week"
4. Console shows:
   - `❌ Emitted reject_request: [requestId]`
5. Request card updates to show:
   - Status badge: "❌ Rejected"

**Learner Sees Instantly:**

1. On Learner Dashboard, request status changes to "❌ Rejected"
2. Rejection reason displayed:
   - "Reason: Fully booked this week"
3. Console shows:
   - `❌ Request rejected: [requestId]`

---

### PART 4: Live Stats Testing

#### Tutor Dashboard - Learner Stats Card

**Layout:**
```
🧑‍🎓 Learner Activity
Dashboard overview
[Collapse/Expand ▼]

When Expanded:
🟢 Online Now: X
🔵 In Session: Y
⏳ Waiting Requests: Z
```

**Test:**
1. Click card to expand
2. See numbers update as you login/logout different learners
3. Numbers should be **real-time** (no refresh needed)

#### Learner Dashboard - Tutor Stats Card

**Layout:**
```
👨‍🏫 Live Tutors
Real-time availability
[Collapse/Expand ▼]

When Expanded:
🟢 Online Now: X
🔴 In Session: Y
⏳ Available for New: Z
```

**Test:**
1. Click card to expand
2. See numbers update as tutors login/logout
3. "Available for New" = Online - InSession

---

### PART 5: Console Log Verification

**Backend Console Should Show:**
```
✅ User connected: [socket-id]
📱 User online: [userId] (Role: tutor)
📬 Request sent from [learnerId] to tutor [tutorId]: {request}
✉️ Request delivered to tutor [tutorId]
✅ Request accepted by tutor [tutorId] for learner [learnerId]
❌ Request rejected by tutor [tutorId] for learner [learnerId]
🎉 Learner [learnerId] notified of acceptance
📢 Learner [learnerId] notified of rejection
🏁 Session ended for [userId]
❌ User disconnected: [socket-id]
📊 Live stats updated: {...}
```

**Frontend Console Should Show:**
```
✅ Socket connected: [socket-id]
📱 Emitted user_online: [userId] (tutor)
📬 Emitted send_request to tutor: [tutorId]
✅ Fetched incoming requests: [...]
✅ Fetched sent requests: [...]
📬 Received new request: {request}
✅ Request accepted: [requestId]
❌ Request rejected: [requestId]
🎉 Request accepted by tutor: [requestId]
❌ Request rejected: [requestId]
📊 Live stats updated: {...}
```

---

## ⚠️ Expected Behavior Rules

### DO:
✅ Socket events emit and receive instantly (no polling)
✅ UI updates without page refresh
✅ Live stats change in real-time
✅ Request cards appear/disappear dynamically
✅ Status badges update smoothly

### DON'T:
❌ Request page refresh to see updates
❌ See "Loading..." spinner for more than 2 seconds
❌ Get console errors for missing socket events
❌ See stale data (old request status)
❌ Have hard-coded request/tutor counts

---

## 🐛 Troubleshooting

### "Socket not connected"
- ✓ Check backend server is running on port 5000
- ✓ Check CORS settings in backend (should allow port 5173)
- ✓ Check browser console for socket.io-client import errors

### "No incoming requests appearing"
- ✓ Check tutor is logged in and on dashboard
- ✓ Check backend console for "Request delivered" message
- ✓ Verify tutor's socket is actually connected

### "Request accepted but learner doesn't see it"
- ✓ Check both users' sockets are connected
- ✓ Check `request_accepted` event being emitted
- ✓ Verify learner's browser has socket listener for that event

### "Live stats not updating"
- ✓ Check `live_stats_update` event in backend
- ✓ Verify `onLiveStatsUpdate` listener in frontend context
- ✓ Check browser console for the live_stats_update message

---

## 📊 Success Metrics

All of the following should be TRUE:

- [ ] Requests send without page refresh ✨
- [ ] Tutor receives request notification instantly 🔔
- [ ] Accept/reject actions update both users instantly ⚡
- [ ] Live stats refresh in real-time 📊
- [ ] No console errors related to socket 🚫
- [ ] Backend logs show correct event flow 📝
- [ ] Multiple users can interact simultaneously 👥

---

## 📝 Example Test Scenario

**Time:** 5 minutes  
**Users:** 2 (1 Learner, 1 Tutor)

1. **00:00** - Open browser console, login as Learner (Tab 1)
   - Expected: See "✅ Socket connected"

2. **00:30** - Open second tab, login as Tutor (Tab 2)
   - Expected: Tab 2 shows "📱 User online: [tutorId] (tutor)"

3. **01:00** - Learner clicks "Find Tutors", finds tutor, sends request
   - Expected: Tab 1 shows "📬 Emitted send_request"

4. **01:30** - Switch to Tab 2 (Tutor Dashboard)
   - Expected: "Incoming Learning Requests" card appears with request

5. **02:00** - Tutor clicks "✓ Accept"
   - Expected: Tab 1 immediately shows "✅ Accepted" status (no refresh)

6. **02:30** - Check live stats on both dashboards
   - Expected: Numbers match across both tabs (real-time sync)

7. **03:00** - Learner closes tab/browser
   - Expected: Backend shows "❌ User disconnected", stats update

---

## 🎉 You're Done!

If all tests pass, the real-time request and live status system is working perfectly!
