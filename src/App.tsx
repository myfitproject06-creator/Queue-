import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { QueueBoard } from './components/QueueBoard';
import { MachineSelectModal } from './components/MachineSelectModal';
import { AddQueueModal } from './components/AddQueueModal';
import { QuickReasonModal } from './components/QuickReasonModal';
import { SwitchSideModal } from './components/SwitchSideModal';
import { AuditLogModal } from './components/AuditLogModal';
import { EmployeeManagerModal } from './components/EmployeeManagerModal';
import { ItemsHandledTodayModal } from './components/ItemsHandledTodayModal';
import { MoveQueueModal } from './components/MoveQueueModal';
import { Employee, MachineId, QueueEntry, Side, SideSwitchRecord } from './types';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const MACHINE_SIDE_STORAGE_KEY = 'paint_queue_machine_side';

export default function App() {
  // Machine Designated Side (LEFT or RIGHT) - persistent per PC
  const [machineSide, setMachineSide] = useState<Side | null>(() => {
    const saved = localStorage.getItem(MACHINE_SIDE_STORAGE_KEY);
    if (saved === 'LEFT' || saved === 'RIGHT') return saved as Side;
    // Migration fallback from old key if exists
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
  const [lastSwitch, setLastSwitch] = useState<SideSwitchRecord | null>(null);
  const [canUndoSwitch, setCanUndoSwitch] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Modals state
  const [addQueueSide, setAddQueueSide] = useState<Side | null>(null);
  const [removeTargetEntry, setRemoveTargetEntry] = useState<QueueEntry | null>(null);
  const [moveTargetEntry, setMoveTargetEntry] = useState<QueueEntry | null>(null);
  const [moveInitialDirection, setMoveInitialDirection] = useState<'UP' | 'DOWN' | undefined>(
    undefined
  );
  const [isSwitchSidesOpen, setIsSwitchSidesOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isEmployeeMgrOpen, setIsEmployeeMgrOpen] = useState(false);
  const [isHandledStatsOpen, setIsHandledStatsOpen] = useState(false);

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

  // If no machine side set on first open, prompt user to select side
  useEffect(() => {
    if (!machineSide) {
      setIsMachineModalOpen(true);
    }
  }, [machineSide]);

  const handleSelectSide = (side: Side) => {
    localStorage.setItem(MACHINE_SIDE_STORAGE_KEY, side);
    setMachineSide(side);
    setIsMachineModalOpen(false);
    showToast(
      `กำหนดเครื่องนี้เป็น: ${side === 'LEFT' ? '🟦 ฝั่ง LEFT (ซ้าย)' : '🟩 ฝั่ง RIGHT (ขวา)'}`,
      'success'
    );
  };

  // Fallback REST fetch function
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/queue/state');
      if (res.ok) {
        const data = await res.json();
        setLeftQueue(data.leftQueue || []);
        setRightQueue(data.rightQueue || []);
        setLastSwitch(data.lastSwitch || null);
        setCanUndoSwitch(!!data.canUndoSwitch);
        if (data.employees) setEmployees(data.employees);
        setIsConnected(true);
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  // SSE Real-time Synchronization
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/queue/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('INIT', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLeftQueue(data.leftQueue || []);
          setRightQueue(data.rightQueue || []);
          setLastSwitch(data.lastSwitch || null);
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
          if (data.employees) setEmployees(data.employees);
          setIsConnected(true);
        } catch (err) {
          console.error('SSE QUEUE_STATE parse error:', err);
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

    // Secondary polling safety interval (every 10s) in case SSE disconnects silently
    const pollingTimer = setInterval(fetchState, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollingTimer);
    };
  }, [fetchState]);

  // Operations
  const activeMachine = machineId || 'PC_LEFT';

  const handleAddQueue = async (employeeId: string, side: Side) => {
    const res = await fetch('/api/queue/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId,
        side,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถลงคิวได้');
    }

    showToast(`ลงคิว ${data.entry.employeeName} ฝั่ง ${side} สำเร็จ`, 'success');
  };

  const handleStartServe = async (entryId: string) => {
    const res = await fetch('/api/queue/serve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'ไม่สามารถเริ่มบริการได้', 'error');
      return;
    }

    showToast(`▶ ${data.entry.employeeName} เริ่มบริการลูกค้าแล้ว`, 'info');
  };

  const handleCompleteServe = async (entryId: string) => {
    const res = await fetch('/api/queue/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'ไม่สามารถจบลูกค้าได้', 'error');
      return;
    }

    showToast(`✓ จบลูกค้าแล้ว (${data.requeuedEntry.employeeName} กลับไปต่อท้ายคิว)`, 'success');
  };

  const handleConfirmRemove = async (
    entryId: string,
    reasonKey: string,
    reasonText?: string
  ) => {
    const res = await fetch('/api/queue/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        reasonKey,
        reasonText,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถนำออกจากคิวได้');
    }

    showToast(
      `นำ ${data.removedEntry.employeeName} ออกจากคิวแล้ว (บันทึกประวัติแล้ว)`,
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
    const res = await fetch('/api/queue/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId,
        targetRank,
        reason,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถเลื่อนลำดับคิวได้');
    }

    showToast(
      `↕️ ${data.details || 'เลื่อนลำดับคิวสำเร็จ'} (บันทึกประวัติ Audit Log เรียบร้อย)`,
      'success'
    );
  };

  const handleSwitchSides = async () => {
    const res = await fetch('/api/queue/switch-sides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: activeMachine,
      }),
    });

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
      const res = await fetch('/api/queue/undo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: activeMachine }),
      });

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
    const res = await fetch('/api/employees', {
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
    const res = await fetch(`/api/employees/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        machineId: activeMachine,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลพนักงานได้');
    }

    showToast(`อัปเดตข้อมูล ${data.employee.name} เรียบร้อยแล้ว`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation & Status */}
      <Header
        machineId={machineId}
        machineSide={machineSide}
        onOpenMachineSelect={() => setIsMachineModalOpen(true)}
        isConnected={isConnected}
        onOpenSwitchSides={() => setIsSwitchSidesOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenEmployeeManager={() => setIsEmployeeMgrOpen(true)}
        onOpenHandledStats={() => setIsHandledStatsOpen(true)}
        lastSwitch={lastSwitch}
        canUndoSwitch={canUndoSwitch}
        onUndoSwitch={handleUndoSwitch}
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
          onOpenAddQueue={(side) => setAddQueueSide(side)}
          onStartServe={handleStartServe}
          onCompleteServe={handleCompleteServe}
          onOpenRemove={(entry) => setRemoveTargetEntry(entry)}
          onOpenMoveQueue={handleOpenMoveQueue}
          onDragReorderQueue={handleConfirmMoveQueue}
          onChangeMachineSide={() => setIsMachineModalOpen(true)}
        />
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-[11px] text-slate-600">
        PAINT QUEUE • ระบบจัดคิวพนักงานขายแผนกสี • ใครมาถึงก่อนได้คิวก่อน • Real-time Sync
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

      <SwitchSideModal
        isOpen={isSwitchSidesOpen}
        leftQueue={leftQueue}
        rightQueue={rightQueue}
        machineId={activeMachine}
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
        machineId={activeMachine}
        onClose={() => setIsEmployeeMgrOpen(false)}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
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
    </div>
  );
}
