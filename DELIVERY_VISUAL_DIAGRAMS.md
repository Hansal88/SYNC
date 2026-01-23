# Message Delivery & Read Receipts - Visual Diagrams

## Component Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      Chat Component                            │
│                    (frontend/pages/Chat.jsx)                   │
└────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
        │  useMessage  │  │useMessageVis   │  │ Socket Listeners │
        │  Delivery()  │  │ibility()       │  │                  │
        │              │  │                │  │ onMessageDeliv   │
        │ - get        │  │ - Viewport     │  │ onMessageRead    │
        │ - mark*      │  │   detection    │  │                  │
        └──────────────┘  └────────────────┘  └──────────────────┘
                │              │                       │
                │              │                       │
                ▼              ▼                       ▼
        ┌──────────────────────────────────────────────────────┐
        │        Message Rendering Loop                        │
        │                                                       │
        │  For each message:                                   │
        │  1. Check status in messageStatuses Map             │
        │  2. Render MessageStatusIndicator                   │
        │  3. On hover → emitMessageRead()                    │
        └──────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ MessageStatus        │
                    │ Indicator Component  │
                    │                      │
                    │ Props:               │
                    │ - status             │
                    │ - timestamp          │
                    │ - isCurrentUser      │
                    │ - messageId          │
                    │ - onRetry            │
                    │                      │
                    │ Render:              │
                    │ ⏱️ ✓ ✓✓ ⚠️           │
                    └──────────────────────┘
```

## Data Flow: Sending Message

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SENDER SIDE (Tutor A)                           │
└─────────────────────────────────────────────────────────────────────┘

User Types Message
       │
       ▼
Click Send Button
       │
       ├─► tempMessage = { _id: 'temp-123', content: '...', }
       │
       ├─► markAsSending(tempMessage._id)
       │
       ├─► setMessages(prev => [...prev, tempMessage])
       │
       ▼
UI Shows: "14:32 ⏱️" (spinning)
       │
       ▼
POST /api/messages/send (Content, ReceiverId)
       │
       │ (Network delay ~1-2 seconds)
       │
       ▼
✅ Server Response: { _id: 'actual-123', isRead: false, ... }
       │
       ├─► markAsDelivered(actual-123)
       │
       ├─► setMessageStatuses.set('actual-123', 'delivered')
       │
       ▼
UI Shows: "14:32 ✓"
       │
       ├─► emit('message_delivered', {
       │     conversationId: 'userId1_userId2',
       │     messageId: 'actual-123',
       │     receiverId: 'userId2'
       │   })
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (server.js)                              │
└─────────────────────────────────────────────────────────────────────┘

socket.on('message_delivered')
       │
       ├─► receiverUser = activeUsers.get('userId2')
       │
       ├─► io.to(receiverUser.socketId).emit(
       │     'message_delivered_confirmation',
       │     { messageId, conversationId, deliveredAt }
       │   )
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SENDER (Back to Frontend)                        │
└─────────────────────────────────────────────────────────────────────┘

socket.on('message_delivered_confirmation')
       │
       ├─► Confirm message reached server
       │   (Status stays ✓, no update needed)
       │
       ▼
WAITING FOR READ RECEIPT...

       ▼ (When receiver reads)

socket.on('message_read_confirmation')
       │
       ├─► markAsRead(messageId)
       │
       ├─► setMessageStatuses.set(messageId, 'read')
       │
       ▼
UI Shows: "14:32 ✓✓" (double check)
```

## Data Flow: Reading Message

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RECEIVER SIDE (Learner B)                         │
└─────────────────────────────────────────────────────────────────────┘

Message Appears in Chat
       │
       ▼
Recipient Hovers/Enters Message Area
       │
       ├─► onMouseEnter() fires
       │
       ├─► if (!isCurrentUser && !msg.isRead)
       │   {
       │     emit('message_read', {
       │       conversationId: 'userId1_userId2',
       │       messageId: 'actual-123',
       │       receiverId: 'userId1'  /* original sender */
       │     })
       │   }
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (server.js)                              │
└─────────────────────────────────────────────────────────────────────┘

socket.on('message_read')
       │
       ├─► senderUser = activeUsers.get('userId1')
       │
       ├─► if (senderUser.isOnline)
       │   {
       │     io.to(senderUser.socketId).emit(
       │       'message_read_confirmation',
       │       { messageId, conversationId, readAt }
       │     )
       │   }
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SENDER (Frontend Updated)                        │
└─────────────────────────────────────────────────────────────────────┘

socket.on('message_read_confirmation')
       │
       ├─► markAsRead(messageId)
       │
       ├─► setMessageStatuses.set(messageId, 'read')
       │
       ▼
UI Updates: "14:32 ✓✓"  (animation: scale 0.8→1.0 over 200ms)
```

## State Transitions Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              MESSAGE STATUS STATE MACHINE                       │
└─────────────────────────────────────────────────────────────────┘

                            Created
                              │
                              ▼
                   ┌───────────────────┐
                   │  SENDING (⏱️)      │
                   │  Rotating clock   │
                   └───────────────────┘
                              │
                (Server confirms receipt)
                              │
                              ▼
                   ┌───────────────────┐
                   │ DELIVERED (✓)     │
                   │  Single check     │
                   └───────────────────┘
                    /                 \
                   /                   \
          (Recipient reads)      (Recipient offline)
              /                        \
             ▼                          ▼
    ┌───────────────────┐    ┌──────────────────┐
    │  READ (✓✓)        │    │ Stays DELIVERED  │
    │ Double check      │    │ until read       │
    └───────────────────┘    └──────────────────┘
                                      │
                                (Later, recipient
                                 hovers message)
                                      │
                                      ▼
                                  READ (✓✓)

ALTERNATIVE PATH (Failure):

                            Created
                              │
                              ▼
                   ┌───────────────────┐
                   │  SENDING (⏱️)      │
                   └───────────────────┘
                              │
                        (Network error)
                              │
                              ▼
                   ┌───────────────────┐
                   │ FAILED (⚠️)        │
                   │ Alert circle      │
                   │ + Retry button    │
                   └───────────────────┘
                              │
                        (User clicks retry)
                              │
                              ▼
                   ┌───────────────────┐
                   │  SENDING (⏱️)      │
                   │  (try again)      │
                   └───────────────────┘
                              │
                        ... (continues)
```

## Socket Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   SOCKET.IO EVENT FLOW                               │
└──────────────────────────────────────────────────────────────────────┘

FRONTEND (Sender)          BACKEND            FRONTEND (Receiver)
┌─────────────────┐    ┌──────────────┐     ┌──────────────────┐
│  Chat Component │    │ socket.io    │     │  Chat Component  │
└─────────────────┘    │   server     │     └──────────────────┘
        │              └──────────────┘              │
        │                                           │
1. emit('message_delivered') ──────────►            │
        │                                           │
2.       ◄────────── re-emit confirmation           │
        │                                           │
        │         (Receiver reads message)          │
        │                                           │
        │              ◄─── emit('message_read')────┤
        │                                           │
3. receive('message_read_confirmation')◄────────────┤
        │                                           │
        ▼                                           │
   UI Updates                                      │
   (✓ ──► ✓✓)                            ┌────────┘
                                         │
                                         ▼
                                    Message marked read
                                    in backend (eventual)
```

## Memory State Diagram

```
┌──────────────────────────────────────────────────────────┐
│  messageStatuses = new Map()                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Key: Message ID          │  Value: Status              │
│  ───────────────────────────────────────────────        │
│  'msg-001'                │  'sending'                  │
│  'msg-002'                │  'delivered'                │
│  'msg-003'                │  'delivered'                │
│  'msg-004'                │  'read'                     │
│  'msg-005'                │  'failed'                   │
│                                                           │
│  Size: ~5 entries × 50 bytes = ~250 bytes              │
│                                                           │
│  Memory per chat: <1KB                                 │
│  Performance impact: Negligible                         │
│                                                           │
└──────────────────────────────────────────────────────────┘

Cleanup on Conversation Change:
    
    useEffect(() => {
      resetAllStatuses();  // Clear all statuses
    }, [selectedConversation]);

    messageStatuses.clear()  // Empty the Map
    messageStatuses size: 0
```

## Component Hierarchy Diagram

```
┌──────────────────────────────────────┐
│         App Component                │
│    (with NotificationProvider)       │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│      Chat Page Component             │
│    (pages/Chat.jsx)                  │
│                                      │
│  Hooks:                              │
│  ├─ useMessageDelivery()            │
│  ├─ useState(messageStatuses)       │
│  ├─ useEffect (socket listeners)    │
│  └─ useEffect (fetch messages)      │
└──────────────────────────────────────┘
           │
           ├─────────────────┬──────────────────┐
           │                 │                  │
           ▼                 ▼                  ▼
    ┌────────────────┐  ┌──────────────┐  ┌────────────────┐
    │  ChatSidebar   │  │ ChatHeader   │  │MessagesList    │
    │ (conversations)│  │              │  │                │
    └────────────────┘  └──────────────┘  └────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────┐
                        │    Message (repeating)           │
                        │                                  │
                        │  - Sender avatar                 │
                        │  - Message bubble                │
                        │  - Message content               │
                        │  - MessageStatusIndicator ◄──────┤
                        │                                  │
                        └──────────────────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────┐
                        │  MessageStatusIndicator          │
                        │  (components/*)                  │
                        │                                  │
                        │  Props:                          │
                        │  ├─ status: 'sending'|'read'    │
                        │  ├─ timestamp                    │
                        │  ├─ messageId                    │
                        │  └─ onRetry                      │
                        │                                  │
                        │  Renders:                        │
                        │  ├─ ⏱️ Animated clock          │
                        │  ├─ ✓ Single check              │
                        │  ├─ ✓✓ Double check             │
                        │  └─ ⚠️ Alert + retry            │
                        └──────────────────────────────────┘
```

## Network Diagram

```
┌─────────────────┐                    ┌──────────────────┐
│  Browser Tab A  │                    │  Browser Tab B   │
│  (Sender)       │                    │  (Receiver)      │
│                 │                    │                  │
│  Socket ID: X   │                    │  Socket ID: Y    │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │                WebSocket             │
         │            (Socket.IO)               │
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │   Backend Server   │
              │   (port 5000)      │
              │                    │
              │  activeUsers Map:  │
              │  ┌────────────────┐│
              │  │userId1 → X     ││
              │  │userId2 → Y     ││
              │  └────────────────┘│
              │                    │
              │  Socket Handlers:  │
              │  ├─ message_*      │
              │  ├─ read           │
              │  └─ deliver*       │
              └────────────────────┘

Flow:
A sends → Server → B receives
B sends → Server → A receives
```

## Timing Diagram

```
Time (seconds)  |  Sender Side        |  Network       |  Receiver Side
────────────────┼──────────────────────┼────────────────┼─────────────────
0.0             |  User sends          |                |
                |  Mark: SENDING ⏱️   |                |
                |                      |                |
0.5             |  POST /messages      |────────────►   |
                |                      |                |
1.0             |  Response received   |◄────────────   | Sees message
                |  Mark: DELIVERED ✓  |                |
                |  emit('message_*')  |                |
                |                      |                |
1.2             |                      |────────────►   | Hovers message
                |                      |                | emit('msg_read')
                |                      |                |
1.4             |  ◄─────────────────────────────────  |
                |  Receive confirm     |                |
                |  Mark: READ ✓✓       |                |
                |                      |                |
2.0+            |  [Stable state]      |                |  [Stable state]
```

## Error Flow Diagram

```
NETWORK ERROR SCENARIO:

Send Message
    │
    ├─► Mark SENDING ⏱️
    │
    ├─► POST /messages/send
    │
    │ ✗ Network timeout
    │   OR 500 error
    │
    ▼
catch(error)
    │
    ├─► markAsFailed(messageId)
    │
    ├─► setMessageStatuses.set(messageId, 'failed')
    │
    ▼
UI Shows: "14:32 ⚠️ [↻]"
    │
    ├─► User sees retry button
    │
    ├─► User clicks [↻]
    │   OR
    ├─► Auto-retry after 5 seconds
    │
    ▼
Try again: Mark SENDING ⏱️
    │
    ├─► POST /messages/send (retry)
    │
    ▼ (either succeeds or fails again)
```

## Animation Timeline Diagram

```
STATUS CHANGE ANIMATION (200ms):

                 Initial State              Target State
Timestamp       14:32                      14:32
Status Icon     ✓ (scale 1.0)             ✓✓ (scale 1.0)
                opacity 1.0                opacity 1.0

Timeline:
├─ 0ms:   icon: ✓, scale: 1.0, opacity: 1.0
│
├─ 20ms:  transition START
│         initial: scale 0.8, opacity 0
│
├─ 100ms: midpoint
│         scale 0.9, opacity 0.5
│
├─ 200ms: transition END
│         final: scale 1.0, opacity 1.0
│         icon: ✓✓
│
└─ 200ms+: stable state

SENDING ANIMATION (infinite):

Rotation Timeline:
├─ 0ms-500ms:     0° → 90°
├─ 500ms-1000ms:  90° → 180°
├─ 1000ms-1500ms: 180° → 270°
├─ 1500ms-2000ms: 270° → 360°
└─ Repeat indefinitely until state changes
```

These diagrams should help visualize the complete message delivery and read receipt system from all angles!
