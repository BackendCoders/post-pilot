# WhatsApp Integration Module Design

## Overview

Add WhatsApp integration allowing users to connect their WhatsApp account via QR code scanning, with session persistence per user.

## Architecture

### Backend Structure

```
backend/src/modules/WhatsApp/
├── controller.ts      # QR generation, connection management, logout
├── service.ts         # Baileys integration, session handling
├── route.ts           # API routes
├── events.ts          # Connection/disconnection events
└── types.ts           # TypeScript types
```

### Session Storage

- **Directory**: `./whatsapp-sessions/session_${userId}/`
- **Deletion triggers**:
  - User logout
  - Session expiration (detected by Baileys events)

### User Model Enhancement

Add to `User` model:
- `whatsappConnected: boolean` (default: false)
- `whatsappConnectedAt: Date`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/qr` | Start connection, returns SSE stream for QR code |
| GET | `/api/whatsapp/status` | Check current connection status |
| POST | `/api/whatsapp/logout` | Disconnect and delete session directory |
| DELETE | `/api/whatsapp/session` | Force delete session |

---

## Flow

### Login Flow

1. User clicks "Connect WhatsApp"
2. Frontend calls `GET /api/whatsapp/qr`
3. Backend starts Baileys with new session dir
4. QR code sent via SSE → frontend displays
5. User scans QR with WhatsApp app
6. On scan success: Baileys emits `connection` event, update MongoDB `whatsappConnected: true`

### Session Expiry Handling

1. Baileys emits `disconnected` or `connection-lost` event
2. Service detects expiration/disconnection
3. Session directory deleted from filesystem
4. MongoDB updated `whatsappConnected: false`

### Restore Flow

1. User visits profile page
2. Frontend calls `GET /api/whatsapp/status`
3. Backend checks:
   - If `session_${userId}` exists AND MongoDB `whatsappConnected: true`
   - Then restore Baileys session
4. Return status: `{ connected: true, phoneNumber: "..." }`

### Logout Flow

1. User clicks "Disconnect"
2. Frontend calls `POST /api/whatsapp/logout`
3. Backend:
   - Calls Baileys logout
   - Deletes `session_${userId}` directory
   - Updates MongoDB `whatsappConnected: false`

---

## Frontend Integration

### Profile Page Section

Add new section `'whatsapp'` to profile sidebar sections array.

**WhatsApp Section States**:

1. **Not Connected**:
   - Display QR code canvas
   - Show countdown timer (20 seconds) for auto-refresh
   - Loading spinner during QR generation

2. **Connected**:
   - Green checkmark icon
   - Display connected phone number
   - "Disconnect" button with confirmation dialog

### QR Auto-Refresh

- 20-second countdown timer displayed
- On expiry: automatically reconnect and show new QR
- On successful scan: stop timer, show connected state

---

## Implementation Steps

1. Install Baileys library
2. Add fields to User model
3. Create WhatsApp module structure
4. Implement service with Baileys integration
5. Create SSE endpoint for QR streaming
6. Implement status check endpoint
7. Implement logout with session deletion
8. Update app.ts with new routes
9. Add frontend WhatsApp section to profile
10. Add query hooks for WhatsApp API
11. Test full flow

---

## Technical Notes

- Use `@whatsapp-web.js/wasock` or `baileys` library
- SSE endpoint keeps connection open until QR scanned or timeout
- Session directories cleaned up on logout OR session expiry
- Baileys handles QR regeneration automatically
