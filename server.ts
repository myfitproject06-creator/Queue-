import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import {
  AuditLogEntry,
  AuthorizedDevice,
  BrandItem,
  Employee,
  MachineId,
  QueueEntry,
  Side,
  SideSwitchRecord,
} from './src/types.ts';

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'queue_db.json');
const SETUP_PAIRING_CODE = process.env.SETUP_PAIRING_CODE || 'PQ-CENTRAL-2026';

export interface StoredDeviceRecord extends AuthorizedDevice {
  tokenHash: string; // SHA-256 hash of device token
}

export const DEFAULT_BRANDS: BrandItem[] = [
  { id: 'b_toa', name: 'TOA', code: 'TOA', color: '#2563eb' },
  { id: 'b_beger', name: 'BEGER', code: 'BGR', color: '#ea580c' },
  { id: 'b_nippon', name: 'NIPPON', code: 'NPT', color: '#dc2626' },
  { id: 'b_captain', name: 'CAPTAIN', code: 'CPT', color: '#0284c7' },
  { id: 'b_jotun', name: 'JOTUN', code: 'JTN', color: '#d97706' },
  { id: 'b_dulux', name: 'DULUX', code: 'DLX', color: '#7c3aed' },
  { id: 'b_delta', name: 'DELTA', code: 'DLT', color: '#10b981' },
  { id: 'b_jbp', name: 'JBP', code: 'JBP', color: '#16a34a' },
  { id: 'b_woodtect', name: 'WOODTECT', code: 'WDT', color: '#854d0e' },
];

interface DatabaseSchema {
  employees: Employee[];
  brands: BrandItem[];
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  lastSwitch: SideSwitchRecord | null;
  lastSwitchUndoSnapshot: {
    leftQueue: QueueEntry[];
    rightQueue: QueueEntry[];
    themeSwapped?: boolean;
    timestamp: string;
  } | null;
  lastDailyResetDate?: string;
  activeThemeId?: string;
  themeSwapped?: boolean;
  auditLogs: AuditLogEntry[];
  devices: StoredDeviceRecord[];
}

function getInitialState(): DatabaseSchema {
  const now = Date.now();
  return {
    employees: [],
    brands: DEFAULT_BRANDS,
    leftQueue: [],
    rightQueue: [],
    lastSwitch: null,
    lastSwitchUndoSnapshot: null,
    themeSwapped: false,
    auditLogs: [
      {
        id: 'log_init',
        timestamp: new Date(now).toISOString(),
        action: 'SYSTEM_RESET',
        machineId: 'PC_LEFT',
        details: 'เริ่มต้นระบบ PAINT QUEUE แผนกสี',
      },
    ],
    devices: [],
  };
}

let db: DatabaseSchema = getInitialState();

// Ensure DB directory and load or save
function initDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('Loaded database from', DB_FILE);

      let modified = false;

      // Ensure employees array exists
      if (!Array.isArray(db.employees)) {
        db.employees = [];
        modified = true;
      }

      // Ensure brands array exists
      if (!Array.isArray(db.brands) || db.brands.length === 0) {
        db.brands = JSON.parse(JSON.stringify(DEFAULT_BRANDS));
        modified = true;
      }

      // Ensure themeSwapped exists
      if (typeof db.themeSwapped !== 'boolean') {
        db.themeSwapped = false;
        modified = true;
      }

      if (!Array.isArray(db.leftQueue)) {
        db.leftQueue = [];
        modified = true;
      }

      if (!Array.isArray(db.rightQueue)) {
        db.rightQueue = [];
        modified = true;
      }

      if (!Array.isArray(db.devices)) {
        db.devices = [];
        modified = true;
      }

      if (!db.activeThemeId) {
        db.activeThemeId = 'demon-slayer';
        modified = true;
      }

      if (modified) {
        saveDatabase();
      }
      // Ensure daily reset check runs on startup
      checkAndPerformDailyReset('SERVER_BOOT');
    } else {
      db.lastDailyResetDate = getBangkokDateString();
      db.activeThemeId = 'demon-slayer';
      saveDatabase();
      console.log('Initialized new database at', DB_FILE);
    }
  } catch (err) {
    console.error('Error initializing database, using in-memory state:', err);
  }
}

function saveDatabase() {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Compute dynamic statuses for a queue
// MULTI-SERVING WORKFLOW:
// Any entry that is 'SERVING' stays 'SERVING'. Multiple employees can be SERVING simultaneously!
// Among the remaining entries that are waiting:
// The first one in line gets status 'NEXT' (eligible to click "🔥 ขึ้นคิว").
// All other waiting entries get status 'WAITING'.
function updateQueueStatuses(queue: QueueEntry[]): QueueEntry[] {
  let nextFound = false;

  return queue.map((entry) => {
    if (entry.status === 'SERVING') {
      return entry;
    }
    if (!nextFound) {
      nextFound = true;
      return { ...entry, status: 'NEXT' };
    }
    return { ...entry, status: 'WAITING' };
  });
}

function recomputeQueues() {
  db.leftQueue = updateQueueStatuses(db.leftQueue);
  db.rightQueue = updateQueueStatuses(db.rightQueue);
}

// Real-time SSE subscriber registry
const sseClients = new Set<Response>();

function broadcast(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Thailand (Bangkok) current date string: YYYY-MM-DD
function getBangkokDateString(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

// Automatic Daily Queue Reset when reaching a new day (00:00 Bangkok time)
function checkAndPerformDailyReset(triggeredBy: string = 'SCHEDULED_CHECK'): boolean {
  const todayStr = getBangkokDateString();

  if (!db.lastDailyResetDate) {
    db.lastDailyResetDate = todayStr;
    saveDatabase();
    return false;
  }

  if (db.lastDailyResetDate !== todayStr) {
    const previousDate = db.lastDailyResetDate;
    const leftCount = db.leftQueue.length;
    const rightCount = db.rightQueue.length;
    console.log(
      `🌅 [PAINT QUEUE] Automatic Daily Queue Reset triggered: ${previousDate} -> ${todayStr} (${triggeredBy})`
    );

    // Reset active queues for the new day
    db.leftQueue = [];
    db.rightQueue = [];
    db.lastSwitch = null;
    db.lastSwitchUndoSnapshot = null;
    db.themeSwapped = false;
    db.lastDailyResetDate = todayStr;

    addAuditLog({
      action: 'SYSTEM_RESET',
      machineId: 'PC_LEFT',
      details: `🌅 รีเซตคิวอัตโนมัติเมื่อขึ้นวันใหม่ (${todayStr}) ล้างคิวค้างวันก่อนหน้า (${previousDate}) [ฝั่งซ้าย: ${leftCount} คิว, ฝั่งขวา: ${rightCount} คิว]`,
    });

    saveDatabase();
    broadcastQueueState();
    return true;
  }

  return false;
}

function broadcastQueueState() {
  recomputeQueues();
  const state = {
    leftQueue: db.leftQueue,
    rightQueue: db.rightQueue,
    lastSwitch: db.lastSwitch,
    lastDailyResetDate: db.lastDailyResetDate,
    activeThemeId: db.activeThemeId || 'demon-slayer',
    themeSwapped: !!db.themeSwapped,
    brands: db.brands || [],
    serverTime: new Date().toISOString(),
    employees: db.employees,
  };
  broadcast('QUEUE_STATE', state);
}

function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const log: AuditLogEntry = {
    ...entry,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log); // newest first
  // keep up to 2000 log entries
  if (db.auditLogs.length > 2000) {
    db.auditLogs.pop();
  }
  broadcast('AUDIT_LOG_ADDED', log);
  return log;
}

// Cryptographic token hashing and verification
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// Extract and verify authorized device from incoming request
function getDeviceFromRequest(req: Request): StoredDeviceRecord | null {
  let rawToken: string | undefined;

  const headerToken = req.headers['x-device-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    rawToken = headerToken.trim();
  } else if (req.headers['authorization']?.startsWith('Bearer ')) {
    rawToken = req.headers['authorization'].slice(7).trim();
  } else if (req.cookies?.paint_queue_device_token) {
    rawToken = String(req.cookies.paint_queue_device_token).trim();
  } else if (typeof req.query.device_token === 'string' && req.query.device_token.trim()) {
    rawToken = req.query.device_token.trim();
  }

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const device = db.devices.find(
    (d) => d.tokenHash === tokenHash && d.status === 'AUTHORIZED'
  );

  if (device) {
    device.lastSeenAt = new Date().toISOString();
    return device;
  }

  return null;
}

// Backend Middleware: Enforce Device Authorization for all sensitive queue routes
function requireDeviceAuth(req: Request, res: Response, next: NextFunction) {
  const device = getDeviceFromRequest(req);
  if (!device) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    addAuditLog({
      action: 'UNAUTHORIZED_API_REQUEST',
      machineId: 'PC_LEFT',
      details: `ปฏิเสธคำขอ (403 ACCESS DENIED): ${req.method} ${req.originalUrl || req.path} (IP: ${clientIp})`,
    });
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'อุปกรณ์นี้ไม่ได้รับอนุญาตให้ใช้งานหรือแก้ไขระบบ PAINT QUEUE',
    });
    return;
  }

  (req as any).authorizedDevice = device;
  next();
}

// Helper: Enforce that an authorized device can ONLY modify its OWN side.
// Opposite side is strictly READ-ONLY.
function checkDeviceSidePermission(
  req: Request,
  res: Response,
  targetSide: Side
): boolean {
  const device = (req as any).authorizedDevice as StoredDeviceRecord | undefined;
  if (!device) {
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'อุปกรณ์นี้ไม่ได้รับอนุญาตให้ใช้งานระบบ PAINT QUEUE',
    });
    return false;
  }

  if (device.side !== targetSide) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    addAuditLog({
      action: 'UNAUTHORIZED_API_REQUEST',
      machineId: device.side === 'LEFT' ? 'PC_LEFT' : 'PC_RIGHT',
      details: `🛡️ ปฏิเสธคำขอแก้ไขข้ามฝั่ง (403 FORBIDDEN): เครื่อง ${device.deviceId} (ฝั่ง ${device.side}) พยายามแก้ไขคิวฝั่ง ${targetSide} (IP: ${clientIp})`,
    });
    res.status(403).json({
      error: 'FORBIDDEN_OPPOSITE_SIDE',
      message: `เครื่อง ${device.deviceId} (ฝั่ง ${device.side}) ไม่มีสิทธิ์แก้ไขคิวฝั่ง ${targetSide} (อนุญาตเฉพาะฝั่งตัวเองเท่านั้น ฝั่งตรงข้ามดูได้อย่างเดียว)`,
    });
    return false;
  }

  return true;
}

async function startServer() {
  initDatabase();
  recomputeQueues();

  const app = express();
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));
  app.use(cookieParser());

  // SSE Real-time Endpoint (Protected: Only Authorized Central Machines receive queue stream)
  app.get('/api/queue/stream', (req: Request, res: Response) => {
    const device = getDeviceFromRequest(req);
    if (!device) {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      addAuditLog({
        action: 'UNAUTHORIZED_ACCESS',
        machineId: 'PC_LEFT',
        details: `ปฏิเสธการเชื่อมต่อ Realtime Stream (403 ACCESS DENIED): อุปกรณ์ไม่ได้รับอนุญาต (IP: ${clientIp})`,
      });
      res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'อุปกรณ์นี้ไม่ได้รับอนุญาตให้รับ Realtime Stream ข้อมูล Queue',
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    sseClients.add(res);
    checkAndPerformDailyReset('SSE_STREAM_CONNECT');
    recomputeQueues();

    // Send initial snapshot with authorized device info
    const initialData = {
      leftQueue: db.leftQueue,
      rightQueue: db.rightQueue,
      lastSwitch: db.lastSwitch,
      lastDailyResetDate: db.lastDailyResetDate,
      activeThemeId: db.activeThemeId || 'demon-slayer',
      themeSwapped: !!db.themeSwapped,
      brands: db.brands || [],
      serverTime: new Date().toISOString(),
      employees: db.employees,
      device: {
        deviceId: device.deviceId,
        side: device.side,
        status: device.status,
      },
    };
    res.write(`event: INIT\ndata: ${JSON.stringify(initialData)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Heartbeat ping every 15s to keep SSE alive through proxies
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(':ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 15000);

  // =========================================================================
  // DEVICE AUTHORIZATION & SECURITY APIS
  // =========================================================================

  // API: Get current device authorization status & registration slots
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const currentDevice = getDeviceFromRequest(req);

    const leftDevice = db.devices.find(
      (d) => d.side === 'LEFT' && d.status === 'AUTHORIZED'
    );
    const rightDevice = db.devices.find(
      (d) => d.side === 'RIGHT' && d.status === 'AUTHORIZED'
    );

    res.json({
      authorized: !!currentDevice,
      device: currentDevice
        ? {
            id: currentDevice.id,
            deviceId: currentDevice.deviceId,
            side: currentDevice.side,
            status: currentDevice.status,
            createdAt: currentDevice.createdAt,
            lastSeenAt: currentDevice.lastSeenAt,
          }
        : null,
      registeredDevices: [
        {
          side: 'LEFT' as Side,
          deviceId: leftDevice?.deviceId,
          status: (leftDevice ? 'AUTHORIZED' : 'NOT_REGISTERED') as 'AUTHORIZED' | 'NOT_REGISTERED',
          lastSeenAt: leftDevice?.lastSeenAt,
        },
        {
          side: 'RIGHT' as Side,
          deviceId: rightDevice?.deviceId,
          status: (rightDevice ? 'AUTHORIZED' : 'NOT_REGISTERED') as 'AUTHORIZED' | 'NOT_REGISTERED',
          lastSeenAt: rightDevice?.lastSeenAt,
        },
      ],
      pairingCodeHint: 'รหัสติดตั้งสำหรับแอดมินหรือช่างประจำแผนก',
    });
  });

  // API: Pair/Register a central machine (Requires Admin Setup Pairing Code)
  app.post('/api/auth/pair-device', (req: Request, res: Response) => {
    const { side, pairingCode } = req.body as {
      side: Side;
      pairingCode: string;
    };

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';

    if (!side || !pairingCode) {
      res.status(400).json({ error: 'กรุณาระบุฝั่งของเครื่อง (side) และรหัส Pairing Code' });
      return;
    }

    if (side !== 'LEFT' && side !== 'RIGHT') {
      res.status(400).json({ error: 'ฝั่งของเครื่องต้องเป็น LEFT หรือ RIGHT เท่านั้น' });
      return;
    }

    // Verify Master Setup Pairing Code
    if (pairingCode.trim() !== SETUP_PAIRING_CODE) {
      addAuditLog({
        action: 'DEVICE_AUTH_FAILED',
        machineId: side === 'LEFT' ? 'PC_LEFT' : 'PC_RIGHT',
        details: `พยายามลงทะเบียนเครื่องฝั่ง ${side} ด้วยรหัสไม่ถูกต้อง (IP: ${clientIp})`,
      });
      res.status(401).json({ error: 'รหัส Pairing Code ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ' });
      return;
    }

    // Check if an authorized machine is already active for this side
    const existingActive = db.devices.find(
      (d) => d.side === side && d.status === 'AUTHORIZED'
    );

    if (existingActive) {
      res.status(400).json({
        error: `ฝั่ง ${side} มีเครื่องกลางที่ลงทะเบียนอยู่แล้ว (${existingActive.deviceId}) ไม่อนุญาตให้ลงทะเบียนเครื่องซ้ำซ้อน หากเปลี่ยนเครื่องกรุณา Revoke เครื่องเดิมก่อน`,
      });
      return;
    }

    // Generate next device ID for this side (e.g. LEFT-01, LEFT-02)
    const sideHistoryCount = db.devices.filter((d) => d.side === side).length;
    const nextSeq = String(sideHistoryCount + 1).padStart(2, '0');
    const deviceId = `${side}-${nextSeq}`;

    // Cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    const nowIso = new Date().toISOString();
    const newDevice: StoredDeviceRecord = {
      id: 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      deviceId,
      side,
      tokenHash,
      status: 'AUTHORIZED',
      createdAt: nowIso,
      lastSeenAt: nowIso,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      ip: clientIp,
    };

    db.devices.push(newDevice);

    addAuditLog({
      action: 'DEVICE_REGISTERED',
      machineId: side === 'LEFT' ? 'PC_LEFT' : 'PC_RIGHT',
      details: `🔑 ลงทะเบียนเครื่อง ${deviceId} (ฝั่ง ${side}) สำเร็จ ได้รับสิทธิ์ใช้งานระบบ Queue`,
    });

    saveDatabase();

    // Set secure HttpOnly cookie
    res.cookie('paint_queue_device_token', rawToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 365 * 24 * 3600 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      message: `ลงทะเบียนเครื่อง ${deviceId} เรียบร้อยแล้ว`,
      device: {
        id: newDevice.id,
        deviceId: newDevice.deviceId,
        side: newDevice.side,
        status: newDevice.status,
        createdAt: newDevice.createdAt,
        lastSeenAt: newDevice.lastSeenAt,
      },
      token: rawToken,
    });
  });

  // API: Revoke machine authorization (For machine replacement or security revocation)
  app.post('/api/auth/revoke-device', (req: Request, res: Response) => {
    const { deviceId, pairingCode } = req.body as {
      deviceId: string;
      pairingCode: string;
    };

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';

    if (!deviceId || !pairingCode) {
      res.status(400).json({ error: 'กรุณาระบุ Device ID และรหัสยืนยัน Pairing Code' });
      return;
    }

    if (pairingCode.trim() !== SETUP_PAIRING_CODE) {
      res.status(401).json({ error: 'รหัส Pairing Code ไม่ถูกต้อง ไม่สามารถถอนการอนุญาตได้' });
      return;
    }

    const device = db.devices.find((d) => d.deviceId === deviceId);
    if (!device) {
      res.status(404).json({ error: 'ไม่พบ Device ID นี้ในระบบ' });
      return;
    }

    if (device.status === 'REVOKED') {
      res.status(400).json({ error: `เครื่อง ${deviceId} ถูกถอนการอนุญาตไปแล้วก่อนหน้านี้` });
      return;
    }

    device.status = 'REVOKED';
    device.revokedAt = new Date().toISOString();

    addAuditLog({
      action: 'DEVICE_REVOKED',
      machineId: device.side === 'LEFT' ? 'PC_LEFT' : 'PC_RIGHT',
      details: `🚫 ถอนการอนุญาตเครื่อง ${device.deviceId} (ฝั่ง ${device.side}) แล้ว จะไม่สามารถเข้าถึงคิวได้อีก`,
    });

    saveDatabase();

    // Check if current caller is this device, clear cookie
    const currentDevice = getDeviceFromRequest(req);
    if (currentDevice?.deviceId === deviceId) {
      res.clearCookie('paint_queue_device_token', { path: '/' });
    }

    // Broadcast REVOCATION to all SSE clients so any browser open with this device gets invalidated
    broadcast('DEVICE_REVOKED', { deviceId });

    res.json({
      success: true,
      message: `ถอนการอนุญาตเครื่อง ${deviceId} สำเร็จ เครื่องนี้จะไม่สามารถใช้งาน Queue ได้อีก สามารถ Pair เครื่องใหม่ได้แล้ว`,
    });
  });

  // API: Get current queue state (Protected: Unauthorized devices get 403 Forbidden)
  app.get('/api/queue/state', requireDeviceAuth, (_req: Request, res: Response) => {
    checkAndPerformDailyReset('GET_STATE');
    recomputeQueues();
    res.json({
      leftQueue: db.leftQueue,
      rightQueue: db.rightQueue,
      lastSwitch: db.lastSwitch,
      lastDailyResetDate: db.lastDailyResetDate,
      activeThemeId: db.activeThemeId || 'demon-slayer',
      themeSwapped: !!db.themeSwapped,
      brands: db.brands || [],
      canUndoSwitch: !!(
        db.lastSwitchUndoSnapshot &&
        Date.now() - new Date(db.lastSwitchUndoSnapshot.timestamp).getTime() < 60000
      ),
      serverTime: new Date().toISOString(),
      employees: db.employees,
    });
  });

  // API: Set Active Theme Preset (Real-time synchronization across all devices)
  app.post('/api/theme/set', requireDeviceAuth, (req: Request, res: Response) => {
    const { themeId } = req.body as { themeId?: string };
    if (!themeId) {
      res.status(400).json({ error: 'กรุณาระบุ Theme ID' });
      return;
    }

    db.activeThemeId = themeId;
    const device = (req as any).authorizedDevice as StoredDeviceRecord | undefined;
    addAuditLog({
      action: 'SYSTEM_RESET',
      machineId: device?.side === 'RIGHT' ? 'PC_RIGHT' : 'PC_LEFT',
      details: `🎨 เปลี่ยนธีมระบบเป็น "${themeId}" โดยเครื่อง ${device?.deviceId || 'PC'}`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({
      success: true,
      activeThemeId: db.activeThemeId,
      message: `เปลี่ยนธีมระบบเป็น ${themeId} เรียบร้อยแล้ว`,
    });
  });

  // API: Manual Daily Queue Reset (Requires Device Auth)
  app.post('/api/queue/reset-daily', requireDeviceAuth, (req: Request, res: Response) => {
    const todayStr = getBangkokDateString();
    const leftCount = db.leftQueue.length;
    const rightCount = db.rightQueue.length;
    const device = (req as any).authorizedDevice as StoredDeviceRecord | undefined;

    db.leftQueue = [];
    db.rightQueue = [];
    db.lastSwitch = null;
    db.lastSwitchUndoSnapshot = null;
    db.lastDailyResetDate = todayStr;

    addAuditLog({
      action: 'SYSTEM_RESET',
      machineId: device?.side === 'RIGHT' ? 'PC_RIGHT' : 'PC_LEFT',
      details: `🔄 รีเซตคิวเริ่มต้นวันใหม่โดยเครื่อง ${device?.deviceId || 'PC'} วันที่ ${todayStr} [ล้างฝั่งซ้าย: ${leftCount} คิว, ล้างฝั่งขวา: ${rightCount} คิว]`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({
      success: true,
      message: `รีเซตคิวเริ่มต้นวันใหม่ (${todayStr}) เรียบร้อยแล้ว`,
      lastDailyResetDate: todayStr,
    });
  });

  // API: Add to Queue (+ ลงคิว)
  // Rule 2 & 3: Authoritative timestamp, strictly sorted by time entered
  // Prevent duplicate queueing
  app.post('/api/queue/add', requireDeviceAuth, (req: Request, res: Response) => {
    const { employeeId, side, machineId } = req.body as {
      employeeId: string;
      side: Side;
      machineId: MachineId;
    };

    if (!employeeId || !side || !machineId) {
      res.status(400).json({ error: 'Missing required parameters (employeeId, side, machineId)' });
      return;
    }

    // Backend Enforcement: Machine can only modify its own side
    if (!checkDeviceSidePermission(req, res, side)) {
      return;
    }

    const employee = db.employees.find((e) => e.id === employeeId);
    if (!employee) {
      res.status(404).json({ error: 'ไม่พบข้อมูลพนักงาน' });
      return;
    }

    // Check if already in queue or serving on ANY side
    const inLeft = db.leftQueue.some((q) => q.employeeId === employeeId);
    const inRight = db.rightQueue.some((q) => q.employeeId === employeeId);

    if (inLeft || inRight) {
      res.status(400).json({ error: `${employee.name} มีรายชื่ออยู่ในคิวแล้ว ไม่สามารถลงซ้ำได้` });
      return;
    }

    const nowIso = new Date().toISOString();
    const newEntry: QueueEntry = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNickname: employee.nickname,
      employeeBrand: employee.brand,
      employeeBrandCode: employee.brandCode,
      employeeAvatarUrl: employee.avatarUrl,
      employeeAvatarColor: employee.avatarColor,
      side,
      status: 'WAITING',
      enteredAt: nowIso,
    };

    if (side === 'LEFT') {
      db.leftQueue.push(newEntry);
    } else {
      db.rightQueue.push(newEntry);
    }

    recomputeQueues();

    addAuditLog({
      action: 'ENQUEUE',
      employeeId: employee.id,
      employeeName: employee.name,
      side,
      machineId,
      details: `ลงคิวฝั่ง ${side} สำเร็จ`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, entry: newEntry });
  });

  // API: Start Serving Customer (🔥 ขึ้นคิว / รับลูกค้า)
  // MULTI-SERVING: Multiple employees can serve customers concurrently!
  // When employee clicks "ขึ้นคิว", they move to the SERVING pool.
  // The waiting queue advances so the next person can also serve if another customer arrives.
  app.post('/api/queue/serve', requireDeviceAuth, (req: Request, res: Response) => {
    const { entryId, machineId } = req.body as {
      entryId: string;
      machineId: MachineId;
    };

    if (!entryId || !machineId) {
      res.status(400).json({ error: 'Missing entryId or machineId' });
      return;
    }

    const targetQueue = db.leftQueue.some((q) => q.id === entryId)
      ? db.leftQueue
      : db.rightQueue.some((q) => q.id === entryId)
      ? db.rightQueue
      : null;

    if (!targetQueue) {
      res.status(404).json({ error: 'ไม่พบคิวนี้ในระบบ' });
      return;
    }

    const entry = targetQueue.find((q) => q.id === entryId)!;

    // Backend Enforcement: Machine can only modify its own side
    if (!checkDeviceSidePermission(req, res, entry.side)) {
      return;
    }

    const nowIso = new Date().toISOString();
    entry.status = 'SERVING';
    entry.servedAt = nowIso;
    entry.servingMachineId = machineId;

    recomputeQueues();

    addAuditLog({
      action: 'START_SERVICE',
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      side: entry.side,
      machineId,
      details: `🔥 ขึ้นคิวบริการลูกค้า (ฝั่ง ${entry.side})`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, entry });
  });

  // API: Complete Service (✓ จบคิว)
  // MULTI-SERVING & AUTO-REQUEUE:
  // When employee finishes serving, they click "จบคิว".
  // The system automatically removes them from "กำลังติดลูกค้า"
  // and re-queues them at the TAIL of the waiting queue on their current side!
  app.post('/api/queue/complete', requireDeviceAuth, (req: Request, res: Response) => {
    const { entryId, machineId } = req.body as {
      entryId: string;
      machineId: MachineId;
    };

    if (!entryId || !machineId) {
      res.status(400).json({ error: 'Missing entryId or machineId' });
      return;
    }

    const isLeft = db.leftQueue.some((q) => q.id === entryId);
    const isRight = db.rightQueue.some((q) => q.id === entryId);

    if (!isLeft && !isRight) {
      res.status(404).json({ error: 'ไม่พบคิวนี้ในระบบ' });
      return;
    }

    const entrySide: Side = isLeft ? 'LEFT' : 'RIGHT';
    // Backend Enforcement: Machine can only modify its own side
    if (!checkDeviceSidePermission(req, res, entrySide)) {
      return;
    }

    const targetList = isLeft ? db.leftQueue : db.rightQueue;
    const index = targetList.findIndex((q) => q.id === entryId);
    const [servingEntry] = targetList.splice(index, 1);

    // Calculate duration
    let durationText = '';
    if (servingEntry.servedAt) {
      const durationSeconds = Math.round(
        (Date.now() - new Date(servingEntry.servedAt).getTime()) / 1000
      );
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      durationText = `${minutes} นาที ${seconds} วินาที`;
    }

    // Auto re-queue at the TAIL of the queue with authoritative current time
    const nowIso = new Date().toISOString();
    const empData = db.employees.find((e) => e.id === servingEntry.employeeId);
    const requeuedEntry: QueueEntry = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      employeeId: servingEntry.employeeId,
      employeeName: servingEntry.employeeName,
      employeeNickname: servingEntry.employeeNickname,
      employeeBrand: servingEntry.employeeBrand || empData?.brand,
      employeeBrandCode: servingEntry.employeeBrandCode || empData?.brandCode,
      employeeAvatarUrl: servingEntry.employeeAvatarUrl,
      employeeAvatarColor: servingEntry.employeeAvatarColor,
      side: servingEntry.side,
      status: 'WAITING',
      enteredAt: nowIso,
    };

    targetList.push(requeuedEntry);

    recomputeQueues();

    addAuditLog({
      action: 'COMPLETE_SERVICE',
      employeeId: servingEntry.employeeId,
      employeeName: servingEntry.employeeName,
      side: servingEntry.side,
      machineId,
      details: `จบคิวเรียบร้อย${durationText ? ` (ใช้เวลา ${durationText})` : ''} ➔ ต่อท้ายคิวอัตโนมัติ`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, requeuedEntry });
  });

  // API: Remove from Queue (❌ เอาออกจากคิว)
  // Rule 6, 7, 8: Instant removal from active queue, quick reason preserved in audit log
  app.post('/api/queue/remove', requireDeviceAuth, (req: Request, res: Response) => {
    const { entryId, reasonKey, reasonText, machineId } = req.body as {
      entryId: string;
      reasonKey?: string;
      reasonText?: string;
      machineId?: MachineId;
    };

    if (!entryId) {
      res.status(400).json({ error: 'กรุณาระบุ entryId ของคิวที่ต้องการนำออก' });
      return;
    }

    const device = (req as any).authorizedDevice as StoredDeviceRecord | undefined;
    const effectiveReasonKey = (reasonKey && String(reasonKey).trim()) || 'อื่น ๆ';
    const effectiveMachineId: MachineId =
      machineId || (device?.side === 'RIGHT' ? 'PC_RIGHT' : 'PC_LEFT');

    const isLeft = db.leftQueue.some((q) => q.id === entryId);
    const isRight = db.rightQueue.some((q) => q.id === entryId);

    if (!isLeft && !isRight) {
      res.status(404).json({ error: 'ไม่พบคิวนี้ในระบบ หรืออาจถูกนำออกไปแล้ว' });
      return;
    }

    const entrySide: Side = isLeft ? 'LEFT' : 'RIGHT';
    // Backend Enforcement: Machine can only modify its own side
    if (!checkDeviceSidePermission(req, res, entrySide)) {
      return;
    }

    const targetList = isLeft ? db.leftQueue : db.rightQueue;
    const index = targetList.findIndex((q) => q.id === entryId);
    const [removedEntry] = targetList.splice(index, 1);

    const fullReason = reasonText ? `${effectiveReasonKey}: ${reasonText}` : effectiveReasonKey;

    recomputeQueues();

    addAuditLog({
      action: 'REMOVE_QUEUE',
      employeeId: removedEntry.employeeId,
      employeeName: removedEntry.employeeName,
      side: removedEntry.side,
      machineId: effectiveMachineId,
      reason: fullReason,
      details: `นำออกจากคิวฝั่ง ${removedEntry.side} (เหตุผล: ${fullReason})`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, removedEntry });
  });

  // API: Move / Reorder Queue Position (↕️ เลื่อนลำดับคิว กรณีลำดับคิวผิด)
  app.post('/api/queue/move', requireDeviceAuth, (req: Request, res: Response) => {
    const { entryId, direction, targetRank, reason, machineId } = req.body as {
      entryId: string;
      direction?: 'UP' | 'DOWN';
      targetRank?: number; // 1-based index among waiting entries
      reason?: string;
      machineId: MachineId;
    };

    if (!entryId || !machineId) {
      res.status(400).json({ error: 'Missing required parameters (entryId, machineId)' });
      return;
    }

    const isLeft = db.leftQueue.some((q) => q.id === entryId);
    const isRight = db.rightQueue.some((q) => q.id === entryId);

    if (!isLeft && !isRight) {
      res.status(404).json({ error: 'ไม่พบคิวนี้ในระบบ' });
      return;
    }

    const entrySide: Side = isLeft ? 'LEFT' : 'RIGHT';
    // Backend Enforcement: Machine can only modify its own side
    if (!checkDeviceSidePermission(req, res, entrySide)) {
      return;
    }

    const targetList = isLeft ? db.leftQueue : db.rightQueue;
    const currentEntry = targetList.find((q) => q.id === entryId)!;

    if (currentEntry.status === 'SERVING') {
      res.status(400).json({ error: 'ไม่สามารถเลื่อนคิวพนักงานที่กำลังบริการลูกค้าได้' });
      return;
    }

    // Separate serving entries and waiting entries
    const servingEntries = targetList.filter((q) => q.status === 'SERVING');
    const waitingEntries = targetList.filter((q) => q.status !== 'SERVING');

    const currentIndex = waitingEntries.findIndex((q) => q.id === entryId);
    if (currentIndex === -1) {
      res.status(404).json({ error: 'ไม่พบคิวในสถานะรอรับลูกค้า' });
      return;
    }

    let newIndex = currentIndex;
    if (typeof targetRank === 'number') {
      newIndex = Math.max(0, Math.min(waitingEntries.length - 1, targetRank - 1));
    } else if (direction === 'UP') {
      newIndex = currentIndex - 1;
    } else if (direction === 'DOWN') {
      newIndex = currentIndex + 1;
    } else {
      res.status(400).json({ error: 'กรุณาระบุทิศทาง (direction UP/DOWN) หรือ targetRank' });
      return;
    }

    if (newIndex === currentIndex) {
      res.status(400).json({ error: 'ลำดับใหม่อยู่ที่ตำแหน่งเดิม ไม่มีการเปลี่ยนแปลง' });
      return;
    }

    if (newIndex < 0 || newIndex >= waitingEntries.length) {
      res.status(400).json({ error: 'ไม่สามารถเลื่อนคิวออกนอกขอบเขตคิวรอได้' });
      return;
    }

    // Keep chronological timestamps sorted so board times remain logical
    const timestamps = waitingEntries
      .map((e) => new Date(e.enteredAt).getTime())
      .sort((a, b) => a - b);

    // Reorder waiting entries
    const [movedEntry] = waitingEntries.splice(currentIndex, 1);
    waitingEntries.splice(newIndex, 0, movedEntry);

    // Assign sorted timestamps to preserve visual and chronological order
    waitingEntries.forEach((entry, idx) => {
      entry.enteredAt = new Date(timestamps[idx]).toISOString();
    });

    // Recombine serving and waiting
    const newCombinedQueue = [...servingEntries, ...waitingEntries];
    if (isLeft) {
      db.leftQueue = newCombinedQueue;
    } else {
      db.rightQueue = newCombinedQueue;
    }

    recomputeQueues();

    const fromRankStr = String(currentIndex + 1).padStart(2, '0');
    const toRankStr = String(newIndex + 1).padStart(2, '0');
    const dirText = newIndex < currentIndex ? 'ขึ้น' : 'ลง';
    const otherPerson = waitingEntries[currentIndex]?.employeeName;

    const details = `เลื่อนลำดับคิว${dirText}: ${movedEntry.employeeName} จากลำดับ ${fromRankStr} ➔ ${toRankStr}${
      otherPerson ? ` (สลับกับ ${otherPerson})` : ''
    }`;

    addAuditLog({
      action: 'MOVE_QUEUE',
      employeeId: movedEntry.employeeId,
      employeeName: movedEntry.employeeName,
      side: movedEntry.side,
      machineId,
      reason: reason || 'ลำดับคิวผิด (จัดลำดับใหม่)',
      details,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({
      success: true,
      movedEntry,
      fromRank: currentIndex + 1,
      toRank: newIndex + 1,
      details,
    });
  });

  // API: Switch Sides (🔄 สลับฝั่งตอน 12:00)
  // Rule 10, 11, 12, 13, 14, 16:
  // Atomic, preserves relative queue order, protects against rapid double-clicks
  // Preserves active customer serving session!
  app.post('/api/queue/switch-sides', requireDeviceAuth, (req: Request, res: Response) => {
    const { machineId } = req.body as { machineId: MachineId };

    if (!machineId) {
      res.status(400).json({ error: 'Missing machineId' });
      return;
    }

    const now = Date.now();
    // Guard against rapid duplicate clicks (within 10 seconds)
    if (db.lastSwitch) {
      const elapsedSinceLastSwitch = now - new Date(db.lastSwitch.switchedAt).getTime();
      if (elapsedSinceLastSwitch < 10000) {
        res.status(429).json({
          error: `ระบบเพิ่งสลับฝั่งไปเมื่อ ${Math.round(elapsedSinceLastSwitch / 1000)} วินาทีที่แล้ว เพื่อป้องกันการกดซ้ำ กรุณารอสักครู่`,
        });
        return;
      }
    }

    // Save snapshot for undo
    db.lastSwitchUndoSnapshot = {
      leftQueue: JSON.parse(JSON.stringify(db.leftQueue)),
      rightQueue: JSON.parse(JSON.stringify(db.rightQueue)),
      themeSwapped: db.themeSwapped,
      timestamp: new Date().toISOString(),
    };

    const leftCountBefore = db.leftQueue.length;
    const rightCountBefore = db.rightQueue.length;

    // ATOMIC SWAP:
    // Left members move to Right with side='RIGHT'
    const newRightQueue = db.leftQueue.map((entry) => ({
      ...entry,
      side: 'RIGHT' as Side,
    }));

    // Right members move to Left with side='LEFT'
    const newLeftQueue = db.rightQueue.map((entry) => ({
      ...entry,
      side: 'LEFT' as Side,
    }));

    db.leftQueue = newLeftQueue;
    db.rightQueue = newRightQueue;

    // Also toggle theme assigned to sides! (e.g. หน่วยพิฆาตอสูร ↔ สิบสองจันทราอสูร)
    db.themeSwapped = !db.themeSwapped;

    db.lastSwitch = {
      switchedAt: new Date().toISOString(),
      machineId,
      leftCountBefore,
      rightCountBefore,
    };

    recomputeQueues();

    addAuditLog({
      action: 'SWITCH_SIDES',
      machineId,
      details: `🔄 สลับฝั่งสำเร็จ: LEFT (${leftCountBefore} คน) ↔ RIGHT (${rightCountBefore} คน) พร้อมสลับธีมประจำฝั่ง`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({
      success: true,
      lastSwitch: db.lastSwitch,
      themeSwapped: db.themeSwapped,
      leftCount: db.leftQueue.length,
      rightCount: db.rightQueue.length,
    });
  });

  // API: Undo Last Switch
  app.post('/api/queue/undo-switch', requireDeviceAuth, (req: Request, res: Response) => {
    const { machineId } = req.body as { machineId: MachineId };

    if (!db.lastSwitchUndoSnapshot) {
      res.status(400).json({ error: 'ไม่มีประวัติการสลับฝั่งที่สามารถย้อนกลับได้' });
      return;
    }

    const elapsed = Date.now() - new Date(db.lastSwitchUndoSnapshot.timestamp).getTime();
    if (elapsed > 60000) {
      res.status(400).json({ error: 'หมดเวลาย้อนกลับการสลับฝั่งแล้ว (ทำได้ภายใน 60 วินาที)' });
      return;
    }

    db.leftQueue = db.lastSwitchUndoSnapshot.leftQueue;
    db.rightQueue = db.lastSwitchUndoSnapshot.rightQueue;
    db.themeSwapped = !!db.lastSwitchUndoSnapshot.themeSwapped;
    db.lastSwitchUndoSnapshot = null;

    recomputeQueues();

    addAuditLog({
      action: 'UNDO_SWITCH',
      machineId,
      details: '↩️ ย้อนกลับการสลับฝั่งและธีมครั้งล่าสุดสำเร็จ',
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, message: 'ย้อนกลับการสลับฝั่งสำเร็จ' });
  });

  // API: Get Audit Logs with search & date filtering
  app.get('/api/audit-logs', requireDeviceAuth, (req: Request, res: Response) => {
    const { date, employeeName, action, limit } = req.query as {
      date?: string;
      employeeName?: string;
      action?: string;
      limit?: string;
    };

    let logs = [...db.auditLogs];

    if (date) {
      logs = logs.filter((log) => log.timestamp.startsWith(date));
    }

    if (employeeName && employeeName.trim()) {
      const q = employeeName.trim().toLowerCase();
      logs = logs.filter(
        (log) =>
          log.employeeName?.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q) ||
          log.reason?.toLowerCase().includes(q)
      );
    }

    if (action && action !== 'ALL') {
      logs = logs.filter((log) => log.action === action);
    }

    const maxItems = limit ? parseInt(limit, 10) : 200;
    res.json({ logs: logs.slice(0, maxItems), total: logs.length });
  });

  // API: Get Handled Items Stats per Employee Today
  app.get('/api/stats/handled-today', requireDeviceAuth, (req: Request, res: Response) => {
    const targetDate =
      (req.query.date as string) || new Date().toISOString().split('T')[0];

    // Filter COMPLETE_SERVICE audit logs for target date
    const completedLogs = db.auditLogs.filter(
      (log) =>
        log.action === 'COMPLETE_SERVICE' &&
        log.timestamp &&
        log.timestamp.startsWith(targetDate)
    );

    // Map stats by employeeId
    const statsMap: Record<
      string,
      {
        handledCount: number;
        leftSideCount: number;
        rightSideCount: number;
        lastHandledAt?: string;
      }
    > = {};

    completedLogs.forEach((log) => {
      const empId = log.employeeId || 'unknown';
      if (!statsMap[empId]) {
        statsMap[empId] = {
          handledCount: 0,
          leftSideCount: 0,
          rightSideCount: 0,
          lastHandledAt: undefined,
        };
      }
      statsMap[empId].handledCount += 1;
      if (log.side === 'LEFT') {
        statsMap[empId].leftSideCount += 1;
      } else if (log.side === 'RIGHT') {
        statsMap[empId].rightSideCount += 1;
      }
      if (
        !statsMap[empId].lastHandledAt ||
        new Date(log.timestamp).getTime() >
          new Date(statsMap[empId].lastHandledAt!).getTime()
      ) {
        statsMap[empId].lastHandledAt = log.timestamp;
      }
    });

    const employeeStats = db.employees.map((emp) => {
      const stats = statsMap[emp.id] || {
        handledCount: 0,
        leftSideCount: 0,
        rightSideCount: 0,
        lastHandledAt: undefined,
      };
      return {
        id: emp.id,
        name: emp.name,
        nickname: emp.nickname,
        brand: emp.brand,
        brandCode: emp.brandCode,
        avatarUrl: emp.avatarUrl,
        avatarColor: emp.avatarColor,
        handledCount: stats.handledCount,
        leftSideCount: stats.leftSideCount,
        rightSideCount: stats.rightSideCount,
        lastHandledAt: stats.lastHandledAt,
      };
    });

    // Also include any employee that might have logs but isn't in active employees list
    Object.keys(statsMap).forEach((empId) => {
      if (!employeeStats.some((e) => e.id === empId)) {
        const sampleLog = completedLogs.find((l) => l.employeeId === empId);
        employeeStats.push({
          id: empId,
          name: sampleLog?.employeeName || `พนักงาน (${empId})`,
          nickname: undefined,
          brand: undefined,
          brandCode: undefined,
          avatarUrl: undefined,
          avatarColor: '#64748b',
          handledCount: statsMap[empId].handledCount,
          leftSideCount: statsMap[empId].leftSideCount,
          rightSideCount: statsMap[empId].rightSideCount,
          lastHandledAt: statsMap[empId].lastHandledAt,
        });
      }
    });

    // Sort by handledCount descending
    employeeStats.sort((a, b) => b.handledCount - a.handledCount);

    const totalHandled = completedLogs.length;
    const activeEmployeesCount = employeeStats.filter(
      (e) => e.handledCount > 0
    ).length;
    const topPerformer =
      employeeStats.length > 0 && employeeStats[0].handledCount > 0
        ? {
            name: employeeStats[0].name,
            nickname: employeeStats[0].nickname,
            brandCode: employeeStats[0].brandCode,
            handledCount: employeeStats[0].handledCount,
          }
        : null;

    res.json({
      success: true,
      date: targetDate,
      totalHandled,
      activeEmployeesCount,
      topPerformer,
      employees: employeeStats,
    });
  });

  // API: Get & Add Employees
  app.get('/api/employees', requireDeviceAuth, (_req: Request, res: Response) => {
    res.json({ employees: db.employees });
  });

  app.post('/api/employees', requireDeviceAuth, (req: Request, res: Response) => {
    const { name, nickname, brand, brandCode, avatarUrl, machineId } = req.body as {
      name: string;
      nickname?: string;
      brand?: string;
      brandCode?: string;
      avatarUrl?: string;
      machineId: MachineId;
    };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'กรุณากรอกชื่อพนักงาน' });
      return;
    }

    const colors = ['#dc2626', '#2563eb', '#16a34a', '#ea580c', '#0284c7', '#7c3aed', '#0d9488', '#d97706'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newEmp: Employee = {
      id: 'emp_' + Date.now(),
      name: name.trim(),
      nickname: nickname?.trim(),
      brand: brand?.trim() || undefined,
      brandCode: brandCode?.trim()?.toUpperCase() || undefined,
      active: true,
      avatarColor: randomColor,
      avatarUrl: avatarUrl?.trim() || undefined,
    };

    db.employees.push(newEmp);

    addAuditLog({
      action: 'EMPLOYEE_ADDED',
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      machineId: machineId || 'PC_LEFT',
      details: `เพิ่มพนักงานใหม่: ${newEmp.name}${newEmp.brandCode ? ` (${newEmp.brandCode})` : ''}`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, employee: newEmp });
  });

  // API: Update Employee (e.g. change avatar picture, nickname, brand, brandCode)
  app.post('/api/employees/:id/update', requireDeviceAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, nickname, brand, brandCode, avatarUrl, machineId } = req.body as {
      name?: string;
      nickname?: string;
      brand?: string;
      brandCode?: string;
      avatarUrl?: string;
      machineId?: MachineId;
    };

    const emp = db.employees.find((e) => e.id === id);
    if (!emp) {
      res.status(404).json({ error: 'ไม่พบพนักงาน' });
      return;
    }

    if (name && name.trim()) emp.name = name.trim();
    if (nickname !== undefined) emp.nickname = nickname.trim() || undefined;
    if (brand !== undefined) emp.brand = brand.trim() || undefined;
    if (brandCode !== undefined) emp.brandCode = brandCode.trim()?.toUpperCase() || undefined;
    if (avatarUrl !== undefined) emp.avatarUrl = avatarUrl;

    // Synchronize to queues if currently queued
    const syncInQueue = (queue: QueueEntry[]) => {
      for (const q of queue) {
        if (q.employeeId === id) {
          if (name) q.employeeName = emp.name;
          if (nickname !== undefined) q.employeeNickname = emp.nickname;
          if (brand !== undefined) q.employeeBrand = emp.brand;
          if (brandCode !== undefined) q.employeeBrandCode = emp.brandCode;
          if (avatarUrl !== undefined) q.employeeAvatarUrl = emp.avatarUrl;
        }
      }
    };
    syncInQueue(db.leftQueue);
    syncInQueue(db.rightQueue);

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, employee: emp });
  });

  // API: Delete Employee permanently
  app.delete('/api/employees/:id', requireDeviceAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { machineId } = req.body as { machineId?: MachineId };

    const empIndex = db.employees.findIndex((e) => e.id === id);
    if (empIndex === -1) {
      res.status(404).json({ error: 'ไม่พบพนักงาน' });
      return;
    }

    const removed = db.employees.splice(empIndex, 1)[0];
    db.leftQueue = db.leftQueue.filter((q) => q.employeeId !== id);
    db.rightQueue = db.rightQueue.filter((q) => q.employeeId !== id);

    addAuditLog({
      action: 'EMPLOYEE_REMOVED',
      employeeId: removed.id,
      employeeName: removed.name,
      machineId: machineId || 'PC_LEFT',
      details: `ลบพนักงานออกจากระบบ: ${removed.name}`,
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, removedEmployee: removed });
  });

  // API: Toggle Employee active status
  app.post('/api/employees/:id/toggle-active', requireDeviceAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const emp = db.employees.find((e) => e.id === id);
    if (!emp) {
      res.status(404).json({ error: 'ไม่พบพนักงาน' });
      return;
    }

    emp.active = !emp.active;
    if (!emp.active) {
      db.leftQueue = db.leftQueue.filter((q) => q.employeeId !== id);
      db.rightQueue = db.rightQueue.filter((q) => q.employeeId !== id);
    }

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, employee: emp });
  });

  // API: Get Brands
  app.get('/api/brands', requireDeviceAuth, (_req: Request, res: Response) => {
    res.json({ brands: db.brands || [] });
  });

  // API: Add Brand
  app.post('/api/brands', requireDeviceAuth, (req: Request, res: Response) => {
    const { name, code, color } = req.body as { name: string; code?: string; color?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'กรุณากรอกชื่อแบรนด์' });
      return;
    }
    const brandCode = (code || name.slice(0, 3)).trim().toUpperCase();
    const newBrand: BrandItem = {
      id: 'brand_' + Date.now(),
      name: name.trim(),
      code: brandCode,
      color: color || '#2563eb',
    };
    if (!db.brands) db.brands = [];
    db.brands.push(newBrand);

    saveDatabase();
    broadcastQueueState();
    res.json({ success: true, brand: newBrand });
  });

  // API: Update Brand
  app.put('/api/brands/:id', requireDeviceAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, color } = req.body as { name?: string; code?: string; color?: string };
    const brand = (db.brands || []).find((b) => b.id === id);
    if (!brand) {
      res.status(404).json({ error: 'ไม่พบแบรนด์' });
      return;
    }
    const oldName = brand.name;
    if (name) brand.name = name.trim();
    if (code) brand.code = code.trim().toUpperCase();
    if (color) brand.color = color;

    // Sync to employees with this brand
    db.employees.forEach((emp) => {
      if (emp.brand === oldName) {
        if (name) emp.brand = brand.name;
        if (code) emp.brandCode = brand.code;
      }
    });
    const syncQueueBrand = (queue: QueueEntry[]) => {
      queue.forEach((q) => {
        if (q.employeeBrand === oldName) {
          if (name) q.employeeBrand = brand.name;
          if (code) q.employeeBrandCode = brand.code;
        }
      });
    };
    syncQueueBrand(db.leftQueue);
    syncQueueBrand(db.rightQueue);

    saveDatabase();
    broadcastQueueState();
    res.json({ success: true, brand });
  });

  // API: Delete Brand
  app.delete('/api/brands/:id', requireDeviceAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!db.brands) db.brands = [];
    const idx = db.brands.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'ไม่พบแบรนด์' });
      return;
    }
    const removed = db.brands.splice(idx, 1)[0];
    saveDatabase();
    broadcastQueueState();
    res.json({ success: true, removedBrand: removed });
  });

  // API: Reset Mode 1 - Reset Queue Only
  app.post('/api/queue/reset-queue', requireDeviceAuth, (req: Request, res: Response) => {
    const { machineId } = req.body as { machineId: MachineId };

    db.leftQueue = [];
    db.rightQueue = [];
    db.lastSwitch = null;
    db.lastSwitchUndoSnapshot = null;
    db.themeSwapped = false;

    addAuditLog({
      action: 'SYSTEM_RESET',
      machineId: machineId || 'PC_LEFT',
      details: '🧹 รีเซตคิวเฉยๆ (ล้างเฉพาะแถวคิวฝั่งซ้ายและขวา รายชื่อพนักงานและแบรนด์ยังคงเดิม)',
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, message: 'รีเซ็ตคิวสำเร็จ' });
  });

  // API: Reset Mode 2 - Reset All Except Theme
  app.post('/api/queue/reset-all-except-theme', requireDeviceAuth, (req: Request, res: Response) => {
    const { machineId } = req.body as { machineId: MachineId };

    db.leftQueue = [];
    db.rightQueue = [];
    db.lastSwitch = null;
    db.lastSwitchUndoSnapshot = null;
    db.themeSwapped = false;
    db.employees = [];
    db.brands = JSON.parse(JSON.stringify(DEFAULT_BRANDS));

    addAuditLog({
      action: 'SYSTEM_RESET',
      machineId: machineId || 'PC_LEFT',
      details: '⚠️ รีเซตระบบทั้งหมดยกเว้นธีม (ล้างพนักงานและคิวทั้งหมด ตั้งค่าเริ่มต้นแบรนด์ใหม่)',
    });

    saveDatabase();
    broadcastQueueState();

    res.json({ success: true, message: 'รีเซ็ตข้อมูลทั้งหมดยกเว้นธีมสำเร็จ' });
  });

  // API: Upload Avatar
  app.post('/api/upload-avatar', requireDeviceAuth, (req: Request, res: Response) => {
    const { imageBase64 } = req.body as { imageBase64: string };
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'กรุณาอัปโหลดรูปภาพ' });
      return;
    }
    res.json({ success: true, avatarUrl: imageBase64 });
  });

  // API: Server Time for precise clock sync
  app.get('/api/time', (_req: Request, res: Response) => {
    res.json({ serverTime: new Date().toISOString() });
  });

  // Vite Middleware for development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background interval: Check every 30 seconds for automatic daily reset (midnight Bangkok time)
  setInterval(() => {
    checkAndPerformDailyReset('SCHEDULED_TIMER');
  }, 30000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PAINT QUEUE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
