# WhatsApp Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp integration allowing users to connect via QR code with session persistence per user

**Architecture:** Backend module using Baileys library with SSE for QR streaming, filesystem session storage, MongoDB for status tracking. Frontend adds WhatsApp section to profile page.

**Tech Stack:** Baileys, Express SSE, MongoDB, React Query

---

## File Structure

```
backend/src/modules/WhatsApp/
├── types.ts           # IWhatsAppSession, WhatsAppStatus types
├── service.ts        # Baileys integration, session management
├── controller.ts      # Request handlers
├── route.ts          # API routes

backend/src/modules/WhatsApp/index.ts   # Module export

backend/src/models/User.ts              # Modify - add whatsappConnected fields
backend/src/app.ts                      # Modify - add WhatsApp routes
backend/package.json                     # Modify - add baileys dependency

frontend/src/query/whatsapp.query.ts    # Create - API hooks
frontend/src/pages/dashboard/profile/index.tsx  # Modify - add WhatsApp section
```

---

## Tasks

### Task 1: Install Baileys Library

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Add baileys dependency**

Run in backend folder:
```bash
npm install baileys @types/qrcode
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add baileys for WhatsApp integration"
```

---

### Task 2: Add WhatsApp Fields to User Model

**Files:**
- Modify: `backend/src/models/User.ts`
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: Add WhatsApp fields to User model**

In `backend/src/models/User.ts`, add after `twoFactorEnabled` field:
```typescript
whatsappConnected: {
  type: Boolean,
  default: false,
},
whatsappConnectedAt: {
  type: Date,
},
whatsappPhoneNumber: {
  type: String,
  default: '',
},
```

- [ ] **Step 2: Add types to IUser interface**

In `backend/src/types/index.ts`, add:
```typescript
whatsappConnected: boolean;
whatsappConnectedAt?: Date;
whatsappPhoneNumber: string;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/User.ts backend/src/types/index.ts
git commit -m "feat: add whatsappConnected fields to User model"
```

---

### Task 3: Create WhatsApp Types

**Files:**
- Create: `backend/src/modules/WhatsApp/types.ts`

- [ ] **Step 1: Create types file**

```typescript
import { Request } from 'express';
import { IApiResponse } from '../../types';

export interface IWhatsAppSession {
  userId: string;
  phoneNumber?: string;
  isConnected: boolean;
  connectedAt?: Date;
}

export interface WhatsAppStatusResponse extends IApiResponse {
  data?: {
    connected: boolean;
    phoneNumber?: string;
    connectedAt?: string;
  };
}

export interface WhatsAppQRResponse extends IApiResponse {
  data?: {
    qrCode?: string;
    message?: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/WhatsApp/types.ts
git commit -m "feat: add WhatsApp types"
```

---

### Task 4: Create WhatsApp Service

**Files:**
- Create: `backend/src/modules/WhatsApp/service.ts`

- [ ] **Step 1: Create service with Baileys integration**

```typescript
import makeWASocket, { AnyWASocket, DisconnectReason } from 'baileys';
import { Boom } from 'hono/node';
import * as fs from 'fs';
import * as path from 'path';
import User from '../../models/User';
import { IWhatsAppSession } from './types';

const SESSION_DIR = './whatsapp-sessions';

class WhatsAppService {
  private sockets: Map<string, AnyWASocket> = new Map();

  private getSessionDir(userId: string): string {
    return path.join(SESSION_DIR, `session_${userId}`);
  }

  private ensureSessionDir(userId: string): void {
    const dir = this.getSessionDir(userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getStatus(userId: string): Promise<IWhatsAppSession> {
    const sessionDir = this.getSessionDir(userId);
    const sessionExists = fs.existsSync(sessionDir);
    const user = await User.findById(userId).select('whatsappConnected whatsappConnectedAt whatsappPhoneNumber');

    return {
      userId,
      phoneNumber: user?.whatsappPhoneNumber || undefined,
      isConnected: user?.whatsappConnected || false,
      connectedAt: user?.whatsappConnectedAt,
    };
  }

  async startConnection(userId: string, onQR: (qr: string) => void): Promise<AnyWASocket> {
    this.ensureSessionDir(userId);

    const existingSocket = this.sockets.get(userId);
    if (existingSocket) {
      return existingSocket;
    }

    const sock = makeWASocket({
      auth: {
        creds: {},
        keys: {},
      },
      printQRInTerminal: false,
    });

    this.sockets.set(userId, sock);

    sock.ev.on('creds.update', async () => {
      const dir = this.getSessionDir(userId);
      // Save auth state
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        const phoneNumber = sock.user?.id?.split(':')[0] || '';
        await User.findByIdAndUpdate(userId, {
          whatsappConnected: true,
          whatsappConnectedAt: new Date(),
          whatsappPhoneNumber: phoneNumber,
        });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (!shouldReconnect) {
          await this.handleLogout(userId);
        }
      }
    });

    sock.ev.on('qr', (qr) => {
      onQR(qr);
    });

    return sock;
  }

  async logout(userId: string): Promise<void> {
    const sock = this.sockets.get(userId);
    if (sock) {
      try {
        await sock.logout();
      } catch {
        // Ignore errors during logout
      }
      sock.end(undefined);
      this.sockets.delete(userId);
    }
    await this.handleLogout(userId);
  }

  private async handleLogout(userId: string): Promise<void> {
    const dir = this.getSessionDir(userId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    await User.findByIdAndUpdate(userId, {
      whatsappConnected: false,
      whatsappConnectedAt: undefined,
      whatsappPhoneNumber: '',
    });
  }

  getSocket(userId: string): AnyWASocket | undefined {
    return this.sockets.get(userId);
  }
}

export const whatsappService = new WhatsAppService();
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/WhatsApp/service.ts
git commit -m "feat: add WhatsApp service with Baileys integration"
```

---

### Task 5: Create WhatsApp Controller

**Files:**
- Create: `backend/src/modules/WhatsApp/controller.ts`

- [ ] **Step 1: Create controller with SSE for QR**

```typescript
import { Response } from 'express';
import { whatsappService } from './service';
import { AuthenticatedRequest } from './types';

export const getQRCode = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let qrSent = false;
  let timeout: NodeJS.Timeout;

  const cleanup = () => {
    if (timeout) clearTimeout(timeout);
  };

  try {
    await whatsappService.startConnection(userId, async (qrCode) => {
      if (!qrSent) {
        qrSent = true;
        res.write(`data: ${JSON.stringify({ qr: qrCode })}\n\n`);
        timeout = setTimeout(() => {
          res.write(`data: ${JSON.stringify({ timeout: true })}\n\n`);
          res.end();
        }, 60000); // 60 second timeout for QR scan
      }
    });

    req.on('close', () => {
      cleanup();
    });
  } catch (error) {
    cleanup();
    res.write(`data: ${JSON.stringify({ error: 'Failed to start connection' })}\n\n`);
    res.end();
  }
};

export const getStatus = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const status = await whatsappService.getStatus(userId);
    res.json({
      success: true,
      data: {
        connected: status.isConnected,
        phoneNumber: status.phoneNumber,
        connectedAt: status.connectedAt?.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await whatsappService.logout(userId);
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await whatsappService.logout(userId);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/WhatsApp/controller.ts
git commit -m "feat: add WhatsApp controller with SSE for QR streaming"
```

---

### Task 6: Create WhatsApp Route

**Files:**
- Create: `backend/src/modules/WhatsApp/route.ts`
- Create: `backend/src/modules/WhatsApp/index.ts`

- [ ] **Step 1: Create route file**

```typescript
import { Router } from 'express';
import { authenticate } from '../../middleware';
import { getQRCode, getStatus, logout, deleteSession } from './controller';

const router = Router();

router.use(authenticate);

router.get('/qr', getQRCode);
router.get('/status', getStatus);
router.post('/logout', logout);
router.delete('/session', deleteSession);

export default router;
```

- [ ] **Step 2: Create index file**

```typescript
export { default } from './route';
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/WhatsApp/route.ts backend/src/modules/WhatsApp/index.ts
git commit -m "feat: add WhatsApp routes"
```

---

### Task 7: Add WhatsApp Route to App

**Files:**
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Import and add WhatsApp route**

Add import:
```typescript
import whatsappRoutes from './modules/WhatsApp';
```

Add route:
```typescript
app.use('/api/whatsapp', whatsappRoutes);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/app.ts
git commit -m "feat: add WhatsApp routes to app"
```

---

### Task 8: Create Frontend WhatsApp Query Hooks

**Files:**
- Create: `frontend/src/query/whatsapp.query.ts`

- [ ] **Step 1: Create query hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/service/api';

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  connectedAt?: string;
}

interface QREvent {
  qr?: string;
  timeout?: boolean;
  error?: string;
}

export const useWhatsAppStatus = () => {
  return useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api.get('/whatsapp/status').then(res => res.data.data),
    refetchInterval: 30000,
  });
};

export const useWhatsAppQR = () => {
  return useMutation<void, Error, (event: QREvent) => void>({
    mutationFn: async (onQR) => {
      const eventSource = new EventSource('/api/whatsapp/qr', {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as QREvent;
          onQR(data);
          if (data.qr || data.timeout || data.error) {
            eventSource.close();
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        onQR({ error: 'Connection lost' });
        eventSource.close();
      };

      return new Promise<void>((resolve, reject) => {
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as QREvent;
            onQR(data);
            if (data.qr || data.timeout || data.error) {
              eventSource.close();
              if (data.error) {
                reject(new Error(data.error));
              } else {
                resolve();
              }
            }
          } catch {
            // Ignore parse errors
          }
        };
      });
    },
  });
};

export const useWhatsAppLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/whatsapp/logout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/query/whatsapp.query.ts
git commit -m "feat: add WhatsApp query hooks for frontend"
```

---

### Task 9: Add WhatsApp Section to Profile Page

**Files:**
- Modify: `frontend/src/pages/dashboard/profile/index.tsx`

- [ ] **Step 1: Add WhatsApp import**

Add to imports:
```typescript
import { useWhatsAppStatus, useWhatsAppQR, useWhatsAppLogout } from '@/query/whatsapp.query';
import { toast } from 'sonner';
```

- [ ] **Step 2: Add WhatsApp section to sections array**

Add after security section:
```typescript
{ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
```

Add MessageCircle to lucide imports:
```typescript
import { ..., MessageCircle } from 'lucide-react';
```

- [ ] **Step 3: Add WhatsApp section component**

Add inside the sections div (after security section):
```typescript
{activeSection === 'whatsapp' && (
  <section className='border border-border rounded-lg bg-card overflow-hidden'>
    <div className='px-6 py-4 border-b border-border bg-card/50'>
      <h2 className='font-medium flex items-center gap-2'>
        <MessageCircle size={18} />
        WhatsApp Connection
      </h2>
    </div>

    <div className='p-6 space-y-4'>
      {statusQuery.isLoading ? (
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
        </div>
      ) : statusQuery.data?.connected ? (
        <div className='space-y-4'>
          <div className='flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
            <div className='w-3 h-3 bg-green-500 rounded-full' />
            <div>
              <p className='font-medium text-green-600'>Connected</p>
              <p className='text-sm text-muted-foreground'>
                {statusQuery.data.phoneNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={logoutMutation.isPending}
            className='px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium disabled:opacity-50'
          >
            {logoutMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex flex-col items-center gap-4'>
            <div className='border-2 border-dashed border-border rounded-lg p-8 text-center'>
              {qrMutation.isPending ? (
                <>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
                  <p className='text-muted-foreground'>Generating QR code...</p>
                </>
              ) : qrData ? (
                <>
                  <p className='font-medium mb-2'>Scan with WhatsApp</p>
                  <img src={qrData} alt='WhatsApp QR Code' className='mx-auto' style={{ width: 200, height: 200 }} />
                  <p className='text-sm text-muted-foreground mt-2'>
                    QR refreshes automatically in {countdown}s
                  </p>
                </>
              ) : (
                <>
                  <p className='text-muted-foreground mb-4'>Click to connect WhatsApp</p>
                  <button
                    onClick={startQR}
                    className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium'
                  >
                    Connect WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </section>
)}
```

- [ ] **Step 4: Add WhatsApp hooks and state**

Add after existing hooks:
```typescript
const statusQuery = useWhatsAppStatus();
const qrMutation = useWhatsAppQR();
const logoutMutation = useWhatsAppLogout();

const [qrData, setQrData] = useState<string | null>(null);
const [countdown, setCountdown] = useState(20);
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
```

- [ ] **Step 5: Add WhatsApp handlers**

Add after handleChangePassword:
```typescript
const startQR = () => {
  setCountdown(20);
  qrMutation.mutate(undefined, {
    onSuccess: () => {
      setQrData(null);
      statusQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to generate QR code');
    },
  });
};

useEffect(() => {
  if (!qrMutation.isPending && qrData) {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          startQR();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }
}, [qrData, qrMutation.isPending]);

useEffect(() => {
  if (qrMutation.variables) {
    qrMutation.mutate(undefined, {
      onSuccess: () => {
        setQrData(null);
        statusQuery.refetch();
      },
    });
  }
}, [qrMutation.variables]);

const handleQR = (event: { qr?: string; timeout?: boolean; error?: string }) => {
  if (event.qr) {
    setQrData(event.qr);
  }
  if (event.timeout) {
    startQR();
  }
  if (event.error) {
    toast.error(event.error);
  }
};

const handleDisconnect = () => {
  if (confirm('Are you sure you want to disconnect WhatsApp?')) {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('WhatsApp disconnected');
        setQrData(null);
      },
    });
  }
};
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/dashboard/profile/index.tsx frontend/src/query/whatsapp.query.ts
git commit -m "feat: add WhatsApp section to profile page"
```

---

## Verification

After all tasks:

1. Run backend: `npm run dev`
2. Run frontend: `npm run dev`
3. Navigate to profile → WhatsApp section
4. Click "Connect WhatsApp" - should see QR code
5. Scan with WhatsApp app
6. Verify status shows "Connected" with phone number
7. Click "Disconnect" - verify session deleted

---

**Plan saved to:** `docs/superpowers/plans/2026-04-15-whatsapp-implementation.md`

**Two execution options:**

**1. Subagent-Driven (recommended)** - Dispatch fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session with checkpoints

**Which approach?**
