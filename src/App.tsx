import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { QueueBoard } from './components/QueueBoard';
import { MachineSelectModal } from './components/MachineSelectModal';
import { AddQueueModal } from './components/AddQueueModal';
import { QuickReasonModal } from './components/QuickReasonModal';
import { ReturnQueueModal } from './components/ReturnQueueModal';
import { SwitchSideModal } from './components/SwitchSideModal';
import { AuditLogModal } from './components/AuditLogModal';
import { EmployeeManagerModal } from './components/EmployeeManagerModal';
import { BrandManagerModal } from './components/BrandManagerModal';
import { ResetModal } from './components/ResetModal';
import { ItemsHandledTodayModal } from './components/ItemsHandledTodayModal';
import { MoveQueueModal } from './components/MoveQueueModal';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';
import { PairDeviceModal } from './components/PairDeviceModal';
import { DeviceManagementModal } from './components/DeviceManagementModal';
import {
  checkDeviceAuthStatus,
  fetchWithAuth,
  getStoredDeviceToken,
  clearStoredDeviceToken,
  createBrandApi,
  updateBrandApi,
  deleteBrandApi,
  deleteEmployeeApi,
  toggleActiveEmployeeApi,
  resetQueueOnly,
  resetAllExceptTheme,
  returnQueueApi,
} from './api';
import {
  AuthorizedDevice,
  BrandItem,
  Employee,
  MachineId,
  QueueEntry,
  Side,
  SideSwitchRecord,
} from './types';
import { MAIN_THEME } from './constants';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const MACHINE_SIDE_STORAGE_KEY = 'paint_queue_machine_side';

export default function App() {
  // Device Authorization State
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedDevice, setAuthorizedDevice] = useState<AuthorizedDevice | null>(null);
  const [registeredDevices, setRegisteredDevices] = useState<{
    side: Side;
    deviceId?: string;
    status: 'AUTHORIZED' | 'REVOKED' | 'NOT_REGISTERED';
    lastSeenAt?: string;
  }[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isDeviceManagementOpen, setIsDeviceManagementOpen] = useState(false);

  // Machine Designated Side (LEFT or RIGHT) - persistent per PC
  const [machineSide, setMachineSide] = useState<Side | null>(() => {
    const saved = localStorage.getItem(MACHINE_SIDE_STORAGE_KEY);
    if (saved === 'LEFT' || saved === 'RIGHT') return saved as Side;
    const legacy = localStorage.getItem('paint_queue_machine_id');
    if (legacy === 'PC_LEFT') return 'LEFT';
    if (legacy === 'PC_RIGHT') return 'RIGHT';
    return null;
  });
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);

  // Derive machineId for audit logging and server calls
  const machineId: MachineId = machineSide === 'RIGHT' ? 'PC_RIGHT' : 'PC_LEFT';

  // Queue state
  const [leftQueue, setLeftQueue] = useState<QueueEntry[]>([]);
  const [rightQueue, setRightQueue] = useState<QueueEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [themeSwapped, setThemeSwapped] = useState<boolean>(false);
  const [lastSwitch, setLastSwitch] = useState<SideSwitchRecord | null>(null);
  const [canUndoSwitch, setCanUndoSwitch] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Modals state
  const [addQueueSide, setAddQueueSide] = useState<Side | null>(null);
  const [removeTargetEntry, setRemoveTargetEntry] = useState<QueueEntry | null>(null);
  const [returnTargetEntry, setReturnTargetEntry] = useState<QueueEntry | null>(null);
  const [moveTargetEntry, setMoveTargetEntry] = useState<QueueEntry | null>(null);
  const [moveInitialDirection, setMoveInitialDirection] = useState<'UP' | 'DOWN' | undefined>(
    undefined
  );
  const [isSwitchSidesOpen, setIsSwitchSidesOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isEmployeeMgrOpen, setIsEmployeeMgrOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isHandledStatsOpen, setIsHandledStatsOpen] = useState(false);

  // Single Standard Theme Configuration
  const activeTheme = MAIN_THEME;

  // Notifications / Toasts
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Device Auth Status Check
  const checkAuth = useCallback(async () => {
    setIsCheckingAuth(true);
    try {
      const data = await checkDeviceAuthStatus();
      setIsAuthorized(data.authorized);
      setAuthorizedDevice(data.device || null);
      setRegisteredDevices(data.registeredDevices || []);
      if (data.themeSwapped !== undefined) {
        setThemeSwapped(!!data.themeSwapped);
      }

      if (data.authorized && data.device?.side) {
        setMachineSide(data.device.side);
        localStorage.setItem(MACHINE_SIDE_STORAGE_KEY, data.device.side);
      }
    } catch (err) {
      console.error('Check auth error:', err);
      setIsAuthorized(false);
    } finally {
      setIsCheckingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSelectSide = (side: Side) => {
    localStorage.setItem(MACHINE_SIDE_STORAGE_KEY, side);
    setMachineSide(side);
    setIsMachineModalOpen(false);
    showToast(
      `กำหนดเครื่องนี้เป็น: ${side === 'LEFT' ? '🟦 ฝั่ง LEFT (ซ้าย)' : '🟩 ฝั่ง RIGHT (ขวา)'}`,
      'success'
    );
  };

  const handlePairedSuccess = (newDevice: AuthorizedDevice) => {
    setAuthorizedDevice(newDevice);
    setIsAuthorized(true);
    setMachineSide(newDevice.side);
    localStorage.setItem(MACHINE_SIDE_STORAGE_KEY, newDevice.side);
    showToast(`ลงทะเบียนเครื่อง ${newDevice.deviceId} (ฝั่ง ${newDevice.side}) สำเร็จ`, 'success');
    checkAuth();
  };

  const handleRevokedSuccess = () => {
    clearStoredDeviceToken();
    setIsAuthorized(false);
    setAuthorizedDevice(null);
    showToast('ถอนการอนุญาตเครื่องนี้แล้ว สามารถ Pair เครื่องใหม่ได้', 'info');
    checkAuth();
  };

  // REST fetch function (only runs when authorized)
  const fetchState = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const res = await fetchWithAuth('/api/queue/state');
      if (res.status === 403) {
        setIsAuthorized(false);
        setAuthorizedDevice(null);
        checkAuth();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLeftQueue(data.leftQueue || []);
        setRightQueue(data.rightQueue || []);
        setLastSwitch(data.lastSwitch || null);
        setCanUndoSwitch(!!data.canUndoSwitch);
        if (data.themeSwapped !== undefined) {
          setThemeSwapped(!!data.themeSwapped);
        }
        if (data.brands) {
          setBrands(data.brands);
        }
        if (data.employees) setEmployees(data.employees);
        setIsConnected(true);
      }
    } catch {
      setIsConnected(false);
    }
  }, [isAuthorized, checkAuth]);

  // SSE Real-time Synchronization (only active when authorized)
  useEffect(() => {
    if (!isAuthorized) return;

    fetchState();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      const token = getStoredDeviceToken();
      const sseUrl = token
        ? `/api/queue/stream?device_token=${encodeURIComponent(token)}`
        : '/api/queue/stream';

      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('INIT', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLeftQueue(data.leftQueue || []);
          setRightQueue(data.rightQueue || []);
          setLastSwitch(data.lastSwitch || null);
          if (data.themeSwapped !== undefined) {
            setThemeSwapped(!!data.themeSwapped);
          }
          if (data.brands) {
            setBrands(data.brands);
          }
          if (data.employees) setEmployees(data.employees);
          setIsConnected(true);
        } catch (err) {
          console.error('SSE INIT parse error:', err);
        }
      });

      eventSource.addEventListener('QUEUE_STATE', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLeftQueue(data.leftQueue || []);
          setRightQueue(data.rightQueue || []);
          setLastSwitch(data.lastSwitch || null);
          if (data.themeSwapped !== undefined) {
            setThemeSwapped(!!data.themeSwapped);
          }
          if (data.brands) {
            setBrands(data.brands);
          }
          if (data.employees) setEmployees(data.employees);
          setIsConnected(true);
        } catch (err) {
          console.error('SSE QUEUE_STATE parse error:', err);
        }
      });

      eventSource.addEventListener('DEVICE_REVOKED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.deviceId === authorizedDevice?.deviceId) {
            clearStoredDeviceToken();
            setIsAuthorized(false);
            setAuthorizedDevice(null);
            showToast(`เครื่องนี้ (${data.deviceId}) ถูกถอนสิทธิ์โดยผู้ดูแลระบบ`, 'error');
            checkAuth();
          } else {
            checkAuth();
          }
        } catch (err) {
          console.error('SSE DEVICE_REVOKED parse error:', err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        // Reconnect after 3 seconds
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Polling interval (every 10s)
    const pollingTimer = setInterval(fetchState, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollingTimer);
    };
  }, [isAuthorized, authorizedDevice?.deviceId, fetchState, checkAuth]);

  // Operations
  const activeMachine = machineId || 'PC_LEFT';

  const handleOpenAddQueue = (side: Side) => {
    if (machineSide && side !== machineSide) {
      showToast(
        `เครื่องนี้เป็นเจ้าของฝั่ง ${machineSide} ไม่สามารถลงคิวให้ฝั่ง ${side} ได้ (ดูได้อย่างเดียว)`,
        'error'
      );
      return;
    }
    setAddQueueSide(side);
  };

  const handleAddQueue = async (employeeId: string, side: Side) => {
    if (machineSide && side !== machineSide) {
      showToast(
        `เครื่องนี้เป็นเจ้าของฝั่ง ${machineSide} ไม่สามารถลงคิวให้ฝั่ง ${side} ได้ (ดูได้อย่างเดียว)`,
        'error'
      );
      throw new Error('ไม่มีสิทธิ์ลงคิวให้ฝั่งตรงข้าม');
    }

    const res = await fetchWithAuth('/api/queue/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId,
        side,
        machineId: activeMachine,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      if (data.error === 'FORBIDDEN_OPPOSITE_SIDE') {
        showToast(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        throw new Error(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม');
      }
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถลงคิวได้');
    }

    showToast(`ลงคิว ${data.entry.employeeName} ฝั่ง ${side} สำเร็จ`, 'success');
  };

  const handleStartServe = async (entryId: string) => {
    const res = await fetchWithAuth('/api/queue/serve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        machineId: activeMachine,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      if (data.error === 'FORBIDDEN_OPPOSITE_SIDE') {
        showToast(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        return;
      }
      setIsAuthorized(false);
      checkAuth();
      showToast('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ', 'error');
      return;
    }

    if (!res.ok) {
      showToast(data.error || 'ไม่สามารถเริ่มบริการได้', 'error');
      return;
    }

    showToast(`▶ ${data.entry.employeeName} เริ่มบริการลูกค้าแล้ว`, 'info');
  };

  const handleCompleteServe = async (entryId: string) => {
    const res = await fetchWithAuth('/api/queue/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        machineId: activeMachine,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      if (data.error === 'FORBIDDEN_OPPOSITE_SIDE') {
        showToast(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        return;
      }
      setIsAuthorized(false);
      checkAuth();
      showToast('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ', 'error');
      return;
    }

    if (!res.ok) {
      showToast(data.error || 'ไม่สามารถจบลูกค้าได้', 'error');
      return;
    }

    showToast(`✓ จบลูกค้าแล้ว (${data.requeuedEntry.employeeName} กลับไปต่อท้ายคิว)`, 'success');
  };

  const handleConfirmReturnQueue = async (entryId: string, reason?: string) => {
    try {
      const data = await returnQueueApi(entryId, activeMachine, reason);
      showToast(`↩ คืนคิว ${data.entry.employeeName} กลับสู่คิวรอลำดับแรกแล้ว`, 'success');
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN_OPPOSITE_SIDE')) {
        showToast('ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        throw err;
      }
      showToast(err.message || 'ไม่สามารถคืนคิวได้', 'error');
      throw err;
    }
  };

  const handleConfirmRemove = async (
    entryId: string,
    reasonKey: string,
    reasonText?: string
  ) => {
    const res = await fetchWithAuth('/api/queue/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        reasonKey,
        reasonText,
        machineId: activeMachine,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      if (data.error === 'FORBIDDEN_OPPOSITE_SIDE') {
        showToast(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        throw new Error(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม');
      }
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    if (res.status === 404) {
      showToast('คิวนี้ถูกนำออกหรืออัปเดตไปแล้ว', 'info');
      fetchState();
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถนำออกจากคิวได้');
    }

    const empName = data.removedEntry?.employeeName || 'พนักงาน';
    showToast(
      `นำ ${empName} ออกจากคิวแล้ว (บันทึกประวัติแล้ว)`,
      'info'
    );
  };

  const handleOpenMoveQueue = (entry: QueueEntry, direction?: 'UP' | 'DOWN') => {
    setMoveTargetEntry(entry);
    setMoveInitialDirection(direction);
  };

  const handleConfirmMoveQueue = async (
    entryId: string,
    targetRank: number,
    reason: string = 'กดค้างแล้วลากเลื่อนคิว (Drag & Drop)'
  ) => {
    const res = await fetchWithAuth('/api/queue/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        targetRank,
        reason,
        machineId: activeMachine,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      if (data.error === 'FORBIDDEN_OPPOSITE_SIDE') {
        showToast(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม (ดูได้อย่างเดียว)', 'error');
        throw new Error(data.message || 'ไม่มีสิทธิ์แก้ไขคิวฝั่งตรงข้าม');
      }
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถเลื่อนลำดับคิวได้');
    }

    showToast(
      `↕️ ${data.details || 'เลื่อนลำดับคิวสำเร็จ'} (บันทึกประวัติ Audit Log เรียบร้อย)`,
      'success'
    );
  };

  const handleSwitchSides = async () => {
    const res = await fetchWithAuth('/api/queue/switch-sides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: activeMachine,
      }),
    });

    if (res.status === 403) {
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถสลับฝั่งได้');
    }

    showToast('🔄 สลับฝั่ง LEFT ↔ RIGHT สำเร็จทั้งสองฝั่งพร้อมกันแล้ว', 'success');
    setCanUndoSwitch(true);
  };

  const handleUndoSwitch = async () => {
    if (!confirm('ต้องการย้อนกลับการสลับฝั่งครั้งล่าสุดใช่หรือไม่?')) return;

    try {
      const res = await fetchWithAuth('/api/queue/undo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: activeMachine }),
      });

      if (res.status === 403) {
        setIsAuthorized(false);
        checkAuth();
        showToast('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ', 'error');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'ไม่สามารถย้อนกลับได้', 'error');
        return;
      }

      showToast('↩️ ย้อนกลับการสลับฝั่งสำเร็จแล้ว', 'success');
      setCanUndoSwitch(false);
    } catch {
      showToast('เกิดข้อผิดพลาดในการย้อนกลับการสลับฝั่ง', 'error');
    }
  };

  const handleAddEmployee = async (
    name: string,
    nickname?: string,
    avatarUrl?: string,
    brand?: string,
    brandCode?: string
  ) => {
    const res = await fetchWithAuth('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        nickname,
        avatarUrl,
        brand,
        brandCode,
        machineId: activeMachine,
      }),
    });

    if (res.status === 403) {
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถเพิ่มพนักงานได้');
    }
  };

  const handleUpdateEmployee = async (
    id: string,
    updates: {
      name?: string;
      nickname?: string;
      avatarUrl?: string;
      brand?: string;
      brandCode?: string;
    }
  ) => {
    const res = await fetchWithAuth(`/api/employees/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        machineId: activeMachine,
      }),
    });

    if (res.status === 403) {
      setIsAuthorized(false);
      checkAuth();
      throw new Error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้ทำรายการ');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลพนักงานได้');
    }

    showToast(`อัปเดตข้อมูล ${data.employee.name} เรียบร้อยแล้ว`, 'success');
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployeeApi(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      showToast('ลบพนักงานเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      showToast(err.message || 'ลบพนักงานไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleToggleActiveEmployee = async (id: string) => {
    try {
      const data = await toggleActiveEmployeeApi(id);
      if (data.employee) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? data.employee : e))
        );
        showToast(
          `เปลี่ยนสถานะ ${data.employee.name} เป็น ${
            data.employee.isActive !== false ? 'พร้อมปฏิบัติงาน' : 'พักการปฏิบัติงาน'
          }`,
          'info'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'เปลี่ยนสถานะไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleCreateBrand = async (name: string, code: string, color?: string) => {
    try {
      const data = await createBrandApi(name, code, color);
      if (data.brands) {
        setBrands(data.brands);
      }
      showToast(`เพิ่มแบรนด์ "${name}" สำเร็จ`, 'success');
    } catch (err: any) {
      showToast(err.message || 'เพิ่มแบรนด์ไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleUpdateBrand = async (id: string, name: string, code: string, color?: string) => {
    try {
      const data = await updateBrandApi(id, name, code, color);
      if (data.brands) {
        setBrands(data.brands);
      }
      showToast(`อัปเดตแบรนด์ "${name}" สำเร็จ`, 'success');
    } catch (err: any) {
      showToast(err.message || 'แก้ไขแบรนด์ไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      const data = await deleteBrandApi(id);
      if (data.brands) {
        setBrands(data.brands);
      }
      showToast('ลบแบรนด์เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      showToast(err.message || 'ลบแบรนด์ไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleResetQueueOnly = async () => {
    try {
      await resetQueueOnly();
      setLeftQueue([]);
      setRightQueue([]);
      setThemeSwapped(false);
      setLastSwitch(null);
      setCanUndoSwitch(false);
      setIsResetModalOpen(false);
      showToast('🔄 รีเซ็ตคิวสำเร็จ (ล้างคิวทั้ง 2 ฝั่งเรียบร้อย)', 'success');
    } catch (err: any) {
      showToast(err.message || 'รีเซ็ตคิวไม่สำเร็จ', 'error');
      throw err;
    }
  };

  const handleResetAllExceptTheme = async () => {
    try {
      await resetAllExceptTheme();
      setLeftQueue([]);
      setRightQueue([]);
      setEmployees([]);
      setThemeSwapped(false);
      setLastSwitch(null);
      setCanUndoSwitch(false);
      setIsResetModalOpen(false);
      showToast('⚠️ รีเซ็ตข้อมูลระบบเริ่มต้นใหม่สำเร็จ', 'success');
    } catch (err: any) {
      showToast(err.message || 'รีเซ็ตข้อมูลทั้งหมดไม่สำเร็จ', 'error');
      throw err;
    }
  };

  // 1. Loading screen while verifying initial device status
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 selection:bg-blue-600 selection:text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">กำลังตรวจสอบสิทธิ์เครื่องกลางของระบบ PAINT QUEUE...</p>
      </div>
    );
  }

  // 2. Machine Lock Screen for Unauthorized Devices
  if (!isAuthorized) {
    return (
      <>
        <UnauthorizedScreen
          registeredDevices={registeredDevices}
          themeSwapped={themeSwapped}
          onOpenPairModal={() => setIsPairModalOpen(true)}
          onRefresh={checkAuth}
          isChecking={isCheckingAuth}
          onRevokedSuccess={checkAuth}
        />
        <PairDeviceModal
          isOpen={isPairModalOpen}
          onClose={() => setIsPairModalOpen(false)}
          onPairedSuccess={handlePairedSuccess}
          registeredDevices={registeredDevices}
          themeSwapped={themeSwapped}
        />
      </>
    );
  }

  // 3. Authorized Central Machine Main Application
  return (
    <div
      id="app-main-canvas"
      className={`min-h-screen ${activeTheme.pageBg} text-slate-100 flex flex-col transition-all duration-500 relative overflow-x-hidden ${activeTheme.pageWallpaperPattern || ''}`}
    >
      {/* Top Navigation & Status */}
      <Header
        machineId={machineId}
        machineSide={machineSide}
        onOpenMachineSelect={() => setIsMachineModalOpen(true)}
        isConnected={isConnected}
        onOpenSwitchSides={() => setIsSwitchSidesOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenEmployeeManager={() => setIsEmployeeMgrOpen(true)}
        onOpenBrandManager={() => setIsBrandModalOpen(true)}
        onOpenHandledStats={() => setIsHandledStatsOpen(true)}
        onOpenReset={() => setIsResetModalOpen(true)}
        activeTheme={activeTheme}
        lastSwitch={lastSwitch}
        canUndoSwitch={canUndoSwitch}
        onUndoSwitch={handleUndoSwitch}
        themeSwapped={themeSwapped}
        authorizedDevice={authorizedDevice}
        onOpenDeviceManagement={() => setIsDeviceManagementOpen(true)}
      />

      {/* Main Queue Dashboard */}
      <main className="flex-1 flex flex-col">
        {!isConnected && (
          <div
            id="offline-warning-banner"
            className="bg-rose-900/90 text-rose-100 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b border-rose-700"
          >
            <AlertCircle className="w-4 h-4" />
            <span>
              🔴 ไม่สามารถเชื่อมต่อระบบกลางได้ กำลังพยายามเชื่อมต่อใหม่...
              (ห้ามสร้างข้อมูลเทียมเพื่อความถูกต้องของคิว)
            </span>
          </div>
        )}

        <QueueBoard
          leftQueue={leftQueue}
          rightQueue={rightQueue}
          machineId={activeMachine}
          machineSide={machineSide || 'LEFT'}
          activeTheme={activeTheme}
          themeSwapped={themeSwapped}
          onOpenAddQueue={handleOpenAddQueue}
          onStartServe={handleStartServe}
          onCompleteServe={handleCompleteServe}
          onOpenReturnQueue={(entry) => setReturnTargetEntry(entry)}
          onOpenRemove={(entry) => setRemoveTargetEntry(entry)}
          onOpenMoveQueue={handleOpenMoveQueue}
          onDragReorderQueue={handleConfirmMoveQueue}
        />
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md py-3 text-center text-[11px] text-slate-500">
        PAINT QUEUE • ระบบจัดคิวพนักงานขายแผนกสี • ใครมาถึงก่อนได้คิวก่อน
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-message"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-600 text-rose-200'
              : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <MachineSelectModal
        isOpen={isMachineModalOpen}
        currentSide={machineSide}
        onSelectSide={handleSelectSide}
        onClose={machineSide ? () => setIsMachineModalOpen(false) : undefined}
        isFirstTime={!machineSide}
      />

      <AddQueueModal
        isOpen={addQueueSide !== null}
        side={addQueueSide}
        employees={employees}
        leftQueue={leftQueue}
        rightQueue={rightQueue}
        onClose={() => setAddQueueSide(null)}
        onAdd={handleAddQueue}
      />

      <QuickReasonModal
        isOpen={removeTargetEntry !== null}
        entry={removeTargetEntry}
        onClose={() => setRemoveTargetEntry(null)}
        onConfirmRemove={handleConfirmRemove}
      />

      <ReturnQueueModal
        isOpen={returnTargetEntry !== null}
        entry={returnTargetEntry}
        machineId={activeMachine}
        onClose={() => setReturnTargetEntry(null)}
        onConfirmReturn={handleConfirmReturnQueue}
      />

      <SwitchSideModal
        isOpen={isSwitchSidesOpen}
        leftQueue={leftQueue}
        rightQueue={rightQueue}
        machineId={activeMachine}
        themeSwapped={themeSwapped}
        onClose={() => setIsSwitchSidesOpen(false)}
        onConfirmSwitch={handleSwitchSides}
      />

      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <EmployeeManagerModal
        isOpen={isEmployeeMgrOpen}
        employees={employees}
        brands={brands}
        machineId={activeMachine}
        onClose={() => setIsEmployeeMgrOpen(false)}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onToggleActiveEmployee={handleToggleActiveEmployee}
        onOpenBrandManager={() => setIsBrandModalOpen(true)}
      />

      <BrandManagerModal
        isOpen={isBrandModalOpen}
        brands={brands}
        employees={employees}
        machineId={activeMachine}
        onClose={() => setIsBrandModalOpen(false)}
        onAddBrand={handleCreateBrand}
        onUpdateBrand={handleUpdateBrand}
        onDeleteBrand={handleDeleteBrand}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        machineId={activeMachine}
        onClose={() => setIsResetModalOpen(false)}
        onResetQueueOnly={handleResetQueueOnly}
        onResetAllExceptTheme={handleResetAllExceptTheme}
      />

      <MoveQueueModal
        isOpen={moveTargetEntry !== null}
        entry={moveTargetEntry}
        initialDirection={moveInitialDirection}
        waitingEntries={
          moveTargetEntry
            ? (moveTargetEntry.side === 'LEFT' ? leftQueue : rightQueue).filter(
                (q) => q.status !== 'SERVING'
              )
            : []
        }
        onClose={() => {
          setMoveTargetEntry(null);
          setMoveInitialDirection(undefined);
        }}
        onConfirmMove={handleConfirmMoveQueue}
      />

      <ItemsHandledTodayModal
        isOpen={isHandledStatsOpen}
        onClose={() => setIsHandledStatsOpen(false)}
      />

      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onPairedSuccess={handlePairedSuccess}
        registeredDevices={registeredDevices}
      />

      <DeviceManagementModal
        isOpen={isDeviceManagementOpen}
        onClose={() => setIsDeviceManagementOpen(false)}
        device={authorizedDevice}
        onRevokedSuccess={handleRevokedSuccess}
      />
    </div>
  );
}
