# Real-Time Request System - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                      http://localhost:5173                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐          ┌──────────────────────┐    │
│  │  LearnerDashboard    │          │  TutorDashboard      │    │
│  ├──────────────────────┤          ├──────────────────────┤    │
│  │ • LiveTutorStats     │          │ • LiveLearnerStats   │    │
│  │ • RequestStatus      │          │ • RequestCard (list) │    │
│  │ • My Requests        │          │ • Incoming Requests  │    │
│  └──────────────────────┘          └──────────────────────┘    │
│                │                              │                  │
│                └──────────┬───────────────────┘                  │
│                           │                                      │
│            ┌──────────────▼──────────────┐                      │
│            │  RequestContext (Provider)  │                      │
│            ├─────────────────────────────┤                      │
│            │ • incomingRequests[]        │                      │
│            │ • sentRequests[]            │                      │
│            │ • liveStats {}              │                      │
│            │ • Socket listeners          │                      │
│            └──────────────┬──────────────┘                      │
│                           │                                      │
│           ┌───────────────┴───────────────┐                    │
│           │                               │                     │
│    ┌──────▼───────┐          ┌────────────▼────────┐           │
│    │ Socket       │          │ requestService      │           │
│    │ Service      │          │ (API Client)        │           │
│    ├──────────────┤          ├─────────────────────┤           │
│    │ • initSocket │          │ • sendRequest()     │           │
│    │ • emit events│          │ • getIncoming()     │           │
│    │ • listen     │          │ • getSent()         │           │
│    │              │          │ • acceptRequest()   │           │
│    └──────┬───────┘          │ • rejectRequest()   │           │
│           │                  └─────────┬───────────┘           │
│           │                            │                       │
│           └────────────┬───────────────┘                        │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │ Socket.IO Events
                         │ & HTTP Requests
                         │
                    TCP/IP Port 5000
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                         BACKEND (Express + Node.js)              │
│                      http://localhost:5000                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────────────────────────────────────────────┐   │
│   │                  Socket.IO Server                      │   │
│   ├────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │  ┌─────────────────────────────────────────────────┐  │   │
│   │  │ User Online Tracking (activeUsers Map)        │  │   │
│   │  │ {                                              │  │   │
│   │  │   userId: { socketId, role, isOnline,        │  │   │
│   │  │             isInSession }                     │  │   │
│   │  │ }                                              │  │   │
│   │  └─────────────────────────────────────────────────┘  │   │
│   │                                                         │   │
│   │  Socket Event Handlers:                               │   │
│   │  ├─ user_online (register user)                       │   │
│   │  ├─ send_request (route to tutor)                     │   │
│   │  ├─ accept_request (update status)                    │   │
│   │  ├─ reject_request (notify learner)                   │   │
│   │  ├─ session_ended (clear status)                      │   │
│   │  ├─ disconnect (cleanup)                              │   │
│   │  └─ broadcast: live_stats_update                      │   │
│   └────────────────────────────────────────────────────────┘   │
│                           │                                     │
│           ┌───────────────┼───────────────┐                    │
│           │               │               │                     │
│      ┌────▼─────┐   ┌─────▼──────┐  ┌───▼───────┐             │
│      │Auth      │   │Request API │  │ Other API │             │
│      │Routes    │   │Routes      │  │ Routes    │             │
│      ├──────────┤   ├────────────┤  ├───────────┤             │
│      │ POST /   │   │POST /      │  │           │             │
│      │ signup   │   │requests    │  │ /tutors   │             │
│      │ POST /   │   │GET /       │  │ /chat     │             │
│      │ login    │   │requests/   │  │ /bookings │             │
│      │ GET /    │   │tutor/      │  │           │             │
│      │ verify   │   │incoming    │  │           │             │
│      │          │   │PUT /       │  │           │             │
│      │          │   │requests/:id│  │           │             │
│      │          │   │/accept     │  │           │             │
│      │          │   │PUT /       │  │           │             │
│      │          │   │requests/:id│  │           │             │
│      │          │   │/reject     │  │           │             │
│      └──────────┘   └────────────┘  └───────────┘             │
│                           │                                     │
│                    ┌──────▼──────────┐                          │
│                    │   Middleware    │                          │
│                    ├─────────────────┤                          │
│                    │ • authMiddleware│                          │
│                    │ • CORS          │                          │
│                    │ • JSON parser   │                          │
│                    └──────┬──────────┘                          │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ Mongoose
                            │ 
┌───────────────────────────▼─────────────────────────────────────┐
│                    MongoDB Atlas                                 │
│                   (MongoDB Cloud)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐       ┌─────────────────────────┐   │
│  │ User Collection      │       │ Request Collection      │   │
│  ├──────────────────────┤       ├─────────────────────────┤   │
│  │ _id (ObjectId)       │       │ _id (ObjectId)          │   │
│  │ email                │       │ learnerId (ref User)    │   │
│  │ name                 │       │ tutorId (ref User)      │   │
│  │ role (tutor/learner) │       │ subject                 │   │
│  │ profilePhoto         │       │ message                 │   │
│  │ skills[]             │       │ status (pending/...     │   │
│  │ ...                  │       │ rejectionReason         │   │
│  │                      │       │ createdAt               │   │
│  │                      │       │ updatedAt               │   │
│  └──────────────────────┘       └─────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Learner Sends Request

```
Learner                   Frontend                Backend              Tutor
  │                           │                       │                 │
  ├─ Clicks Send Request ──→ ┤                       │                 │
  │                           ├─ API POST /requests──→ ┤                │
  │                           │                       ├─ Save to DB    │
  │                           │                       │                │
  │                           ├─ Socket: send_request→ ┤                │
  │                           │                       ├─ Find tutor   │
  │                           │                       ├─ Socket.emit─→ ┤
  │                           │                       │ receive_request│
  │                           │ (socket event) ←─────┤                │
  │                           │ receive_request       │                │
  │                           ├─ Update state  ────────────→ Card     │
  │                           │ incomingRequests.push │                │
  │                           │                       │                │
  └─ State: "Pending" ────── ┤                       │                │
                              │                       │                └─ New card appears!
```

### Flow 2: Tutor Accepts Request

```
Tutor                     Frontend                Backend           Learner
  │                           │                       │                 │
  ├─ Clicks Accept ────────→ ┤                       │                 │
  │                           ├─ API PUT /accept ───→ ┤                │
  │                           │                       ├─ Update DB    │
  │                           │                       ├─ Mark session │
  │                           │                       │                │
  │                           ├─ Socket: ────────────→ ┤                │
  │                           │ accept_request        ├─ Find learner │
  │                           │                       ├─ Socket.emit─→ ┤
  │                           │                       │ request_accepted│
  │                           │ (socket event) ←─────┤                │
  │                           │ request_accepted      │                │
  │                           ├─ Update state  ────────────→ Status: │
  │                           │ status: "accepted"    │  "Accepted"  │
  │                           │                       │                │
  │                           ├─ Broadcast live ─────→ ┤────────────→ ┤
  │                           │ stats_update          │ Push event     │
  │                           │                       ├─ Update stats  │
  │                           ├─ Stats updated ←─────┤                │
  │                           │                       │                │
  └─ Card updated: ────────┤                       │                └─ No refresh
    "Accepted" (no refresh)  │                       │                  needed!
```

### Flow 3: Broadcast Live Stats Update

```
Anyone changes status (online/offline/session)
         │
         ▼
    Backend detects change
         │
         ├─ Updates activeUsers Map
         │
         ├─ Calls getLiveStats()
         │
         ├─ Broadcasts: io.emit('live_stats_update', stats)
         │
         └─────┬───────────────────────────────────┬──────────────┐
               │                                   │              │
               ▼                                   ▼              ▼
        Tutor Dashboard              Learner Dashboard    Other Users
        updates Live Stats           updates Live Stats    see updates
        in real-time                 in real-time          in real-time
```

---

## 📡 Socket.IO Events Reference

### Events Sent FROM Frontend TO Backend

#### 1. `user_online`
```javascript
socket.emit('user_online', {
  userId: "user123",
  role: "tutor" // or "learner"
})
```
**Purpose:** Register user as online
**When:** On dashboard load
**Handler:** Stores in activeUsers Map

---

#### 2. `send_request`
```javascript
socket.emit('send_request', {
  tutorId: "tutor456",
  learnerId: "learner123",
  request: {
    _id: "req789",
    subject: "JavaScript",
    message: "Help with async",
    status: "pending",
    createdAt: "2024-01-23..."
  }
})
```
**Purpose:** Route request to specific tutor
**When:** Learner submits request form
**Handler:** io.to(tutorSocket).emit('receive_request')

---

#### 3. `accept_request`
```javascript
socket.emit('accept_request', {
  requestId: "req789",
  tutorId: "tutor456",
  learnerId: "learner123"
})
```
**Purpose:** Accept a request
**When:** Tutor clicks "Accept" button
**Handler:** Updates DB, marks session, notifies learner

---

#### 4. `reject_request`
```javascript
socket.emit('reject_request', {
  requestId: "req789",
  tutorId: "tutor456",
  learnerId: "learner123",
  reason: "Fully booked this week"
})
```
**Purpose:** Reject a request
**When:** Tutor clicks "Reject" button
**Handler:** Updates DB, notifies learner with reason

---

#### 5. `session_ended`
```javascript
socket.emit('session_ended', {
  userId: "user123"
})
```
**Purpose:** Mark session as finished
**When:** Session ends
**Handler:** Clears isInSession flag

---

### Events Received BY Frontend FROM Backend

#### 1. `receive_request`
```javascript
socket.on('receive_request', (data) => {
  const { request, learnerId } = data;
  // Add to incomingRequests array
  // Show in UI immediately
})
```
**Sent to:** Tutor only (when learner sends request)
**Trigger:** `send_request` event

---

#### 2. `request_accepted`
```javascript
socket.on('request_accepted', (data) => {
  const { requestId, tutorId } = data;
  // Update request status to "accepted"
  // Update in sentRequests array
})
```
**Sent to:** Learner only (when tutor accepts)
**Trigger:** `accept_request` event

---

#### 3. `request_rejected`
```javascript
socket.on('request_rejected', (data) => {
  const { requestId, tutorId, reason } = data;
  // Update request status to "rejected"
  // Store rejection reason
  // Update in sentRequests array
})
```
**Sent to:** Learner only (when tutor rejects)
**Trigger:** `reject_request` event

---

#### 4. `live_stats_update` (BROADCAST)
```javascript
socket.on('live_stats_update', (stats) => {
  const { 
    onlineTutors,
    onlineLearners,
    tutorsInSession,
    learnersInSession,
    totalOnline
  } = stats;
  // Update live stats throughout app
})
```
**Sent to:** ALL connected clients
**Trigger:** Any status change (online/offline/session)
**Frequency:** After every: user_online, accept_request, reject_request, session_ended, disconnect

---

## 🔐 Security Considerations

### Authentication
```
All API endpoints require JWT token:
├─ Verified via authMiddleware
└─ Prevents unauthorized access

Socket.IO doesn't verify per-event (currently)
├─ Relies on session/token during API call
├─ Could be enhanced with socket authentication
└─ Consider adding socket token verification
```

### Authorization
```
Request ownership checks:
├─ Tutor can only accept/reject their own requests
├─ Learner can only see their own requests
├─ Backend validates req.user.id
└─ Prevents cross-user access
```

### Data Validation
```
All inputs validated before DB insert:
├─ Required fields checked
├─ Request count limits (no duplicate active)
├─ Reason field length restricted
└─ Status enum values only
```

---

## 🎯 Key Design Decisions

### 1. Real-Time Instead of Polling
**Why?** 
- Instant updates (< 100ms vs 5s+ polling)
- Lower server load
- Better user experience
- No refresh cycles

### 2. Context API for State
**Why?**
- Centralized request/stats state
- Avoids prop drilling
- Custom hooks for easy consumption
- Efficient re-renders

### 3. Map for Active Users
**Why?**
- O(1) lookup by userId
- Fast disconnection cleanup
- Efficient iteration for stats
- Memory efficient

### 4. Broadcast Stats to All
**Why?**
- Everyone sees same numbers
- No stale data
- Learner sees available tutors
- Tutor sees demand

### 5. Rejection with Reason
**Why?**
- Better UX for learner
- Tutor can explain constraints
- Reduces confusion
- Improves platform feedback

---

## 📊 State Management

### RequestContext State
```javascript
{
  incomingRequests: [      // For tutors
    { _id, learnerId, tutorId, subject, message, status, createdAt }
  ],
  sentRequests: [          // For learners
    { _id, learnerId, tutorId, subject, message, status, rejectionReason, createdAt }
  ],
  liveStats: {             // For all
    onlineTutors: 12,
    onlineLearners: 18,
    tutorsInSession: 5,
    learnersInSession: 8,
    totalOnline: 30
  },
  loading: false,          // Fetch states
  error: null,
  userRole: "tutor"        // Current user's role
}
```

### Component-Level State
```
TutorDashboard:
├─ userName (from localStorage)
├─ tutorData (from API)
├─ loading (fetch state)
└─ error (error message)

LearnerDashboard:
├─ userName (from localStorage)
├─ learnerData (from API)
├─ loading (fetch state)
└─ error (error message)

RequestCard:
└─ (all from props, no local state)

LiveTutorStats:
├─ isExpanded (UI state)
└─ liveStats (from context)

LiveLearnerStats:
├─ isExpanded (UI state)
└─ liveStats, incomingRequests (from context)
```

---

## 🎨 Component Tree

```
App
├─ ThemeProvider
└─ RequestProvider
   └─ AppContent
      └─ AppRoutes
         ├─ HomePage
         ├─ Login
         ├─ Signup
         ├─ ...
         └─ DashboardLayout
            ├─ TutorDashboard
            │  ├─ LiveLearnerStats
            │  └─ RequestCard (grid)
            │     ├─ Accept button
            │     └─ Reject button
            │
            └─ LearnerDashboard
               ├─ LiveTutorStats
               └─ RequestStatus
                  └─ Request items
```

---

## 💾 Database Queries

### Get Incoming Requests (Tutor)
```javascript
db.requests.find({ 
  tutorId: ObjectId(...),
  // Tutors see all, but UI filters by status
})
.populate('learnerId')
.sort({ createdAt: -1 })
```

### Get Sent Requests (Learner)
```javascript
db.requests.find({ 
  learnerId: ObjectId(...)
})
.populate('tutorId')
.sort({ createdAt: -1 })
```

### Accept/Reject Single Request
```javascript
db.requests.updateOne(
  { _id: ObjectId(...) },
  { $set: { status: 'accepted'|'rejected', rejectionReason: '...' } }
)
```

---

## 🔄 Reconnection Logic

```javascript
// Socket.IO auto-reconnect settings:
{
  reconnection: true,
  reconnectionDelay: 1000,      // Start at 1s
  reconnectionDelayMax: 5000,   // Max 5s
  reconnectionAttempts: 5       // Try 5 times
}

// Exponential backoff: 1s → 2s → 3s → 4s → 5s
```

---

## 📈 Scalability Notes

### Current Limitations
- Single Node.js process
- All users in one activeUsers Map
- No persistent Socket.IO storage
- Stats recalculated on each event

### Future Improvements
- Redis for distributed user tracking
- Socket.IO adapter for multiple servers
- Persistent request history
- Queue system for high volume
- Database aggregation for stats
- Caching layer for frequently accessed data

---

## ✅ Testing Checklist

- [x] Socket connects on user_online event
- [x] Requests sent via API and Socket
- [x] Tutor receives request instantly
- [x] Request cards display correctly
- [x] Accept/reject updates both sides
- [x] Live stats broadcast to all
- [x] Status changes without page refresh
- [x] Reconnection works after disconnect
- [x] No console errors in happy path
- [x] Dark mode styling applied
- [x] Mobile responsiveness works
- [x] Error states handled
- [x] Loading states visible
- [x] Rejection reasons stored/displayed

---

This is a production-ready real-time system! 🚀
