import React, { useState, useEffect } from 'react';
import {
  Flame,
  Check,
  X,
  Clock,
  Plus,
  UserCheck,
  Sparkles,
  Users,
  Timer,
  AlertCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  GripVertical,
} from 'lucide-react';
import { QueueEntry, Side, MachineId } from '../types';

interface QueueBoardProps {
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  machineId: MachineId;
  machineSide: Side;
  onOpenAddQueue: (side: Side) => void;
  onStartServe: (entryId: string) => Promise<void>;
  onCompleteServe: (entryId: string) => Promise<void>;
  onOpenRemove: (entry: QueueEntry) => void;
  onOpenMoveQueue: (entry: QueueEntry, direction?: 'UP' | 'DOWN') => void;
  onDragReorderQueue?: (entryId: string, targetRank: number, reason?: string) => Promise<void>;
  onChangeMachineSide?: () => void;
}

export const QueueBoard: React.FC<QueueBoardProps> = ({
  leftQueue,
  rightQueue,
  machineId,
  machineSide,
  onOpenAddQueue,
  onStartServe,
  onCompleteServe,
  onOpenRemove,
  onOpenMoveQueue,
  onDragReorderQueue,
  onChangeMachineSide,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Drag-and-drop reordering state (กดค้างแล้วลาก)
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [draggedSide, setDraggedSide] = useState<Side | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const [touchCoords, setTouchCoords] = useState<{ x: number; y: number } | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const longPressTimerRef = React.useRef<any>(null);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const draggedEntryObjRef = React.useRef<QueueEntry | null>(null);
  const draggedSideRef = React.useRef<Side | null>(null);
  const dragOverIndexRef = React.useRef<number | null>(null);

  const resetDragState = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
    draggedEntryObjRef.current = null;
    draggedSideRef.current = null;
    dragOverIndexRef.current = null;
    setDraggedEntryId(null);
    setDraggedSide(null);
    setDragOverIndex(null);
    setIsDraggingTouch(false);
    setTouchCoords(null);
  };

  const executeReorder = async (
    entryId: string,
    side: Side,
    targetRank: number
  ) => {
    if (!onDragReorderQueue || isReordering) return;
    const targetQueue = side === 'LEFT' ? leftQueue : rightQueue;
    const waiting = targetQueue.filter((q) => q.status !== 'SERVING');
    const currentIndex = waiting.findIndex((q) => q.id === entryId);
    if (currentIndex === -1) return;
    const currentRank = currentIndex + 1;
    if (currentRank === targetRank) return; // Same position, no reorder needed

    setIsReordering(true);
    setActionInProgress(entryId);
    try {
      await onDragReorderQueue(
        entryId,
        targetRank,
        'กดค้างแล้วลากเลื่อนคิว (Drag & Drop)'
      );
    } finally {
      setIsReordering(false);
      setActionInProgress(null);
      resetDragState();
    }
  };

  // Global touch listeners while touch-dragging
  useEffect(() => {
    if (!isDraggingTouch) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDraggingTouch) return;
      if (e.cancelable) {
        e.preventDefault(); // Prevent background page scrolling while dragging
      }
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX;
      const y = touch.clientY;
      setTouchCoords({ x, y });

      const el = document.elementFromPoint(x, y);
      const side = draggedSideRef.current;
      if (!side) return;
      const cardEl = el?.closest(`[data-queue-side="${side}"][data-waiting-index]`);
      if (cardEl) {
        const idx = parseInt(cardEl.getAttribute('data-waiting-index') || '-1', 10);
        if (idx >= 0 && idx !== dragOverIndexRef.current) {
          dragOverIndexRef.current = idx;
          setDragOverIndex(idx);
        }
      }
    };

    const handleGlobalTouchEnd = () => {
      const activeEntryId = draggedEntryObjRef.current?.id;
      const activeSide = draggedSideRef.current;
      const targetIdx = dragOverIndexRef.current;

      if (activeEntryId && activeSide && targetIdx !== null) {
        executeReorder(activeEntryId, activeSide, targetIdx + 1);
      } else {
        resetDragState();
      }
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [isDraggingTouch, leftQueue, rightQueue]);

  // Live clock tick every second for real-time elapsed timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleServe = async (entryId: string) => {
    setActionInProgress(entryId);
    try {
      await onStartServe(entryId);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleComplete = async (entryId: string) => {
    setActionInProgress(entryId);
    try {
      await onCompleteServe(entryId);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatElapsedTimer = (servedAtIso?: string) => {
    if (!servedAtIso) return '00:00';
    const elapsedSeconds = Math.max(
      0,
      Math.floor((currentTime - new Date(servedAtIso).getTime()) / 1000)
    );
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const renderQueueSide = (
    side: Side,
    queue: QueueEntry[],
    title: string,
    colorScheme: 'blue' | 'emerald'
  ) => {
    const isLeft = side === 'LEFT';
    const isCurrentMachineSide =
      (machineId === 'PC_LEFT' && isLeft) || (machineId === 'PC_RIGHT' && !isLeft);

    // Strictly separate SERVING vs WAITING
    const servingEntries = queue.filter((q) => q.status === 'SERVING');
    const waitingEntries = queue.filter((q) => q.status !== 'SERVING');

    return (
      <div
        id={`queue-side-${side.toLowerCase()}`}
        className={`flex-1 rounded-3xl border flex flex-col bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
          isLeft
            ? 'border-blue-500/40 shadow-blue-950/40 ring-1 ring-blue-500/20'
            : 'border-emerald-500/40 shadow-emerald-950/40 ring-1 ring-emerald-500/20'
        }`}
      >
        {/* Main Column Header */}
        <div
          className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
            isLeft
              ? 'bg-gradient-to-r from-blue-950/90 via-blue-900/50 to-slate-900 border-blue-800/60'
              : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-slate-900 border-emerald-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                isLeft
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-emerald-600 text-white shadow-emerald-500/30'
              }`}
            >
              {isLeft ? '🟦' : '🟩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-xl font-black tracking-tight ${
                    isLeft ? 'text-blue-300' : 'text-emerald-300'
                  }`}
                >
                  {title}
                </h2>
                {isCurrentMachineSide && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isLeft
                        ? 'bg-blue-500/25 text-blue-300 border-blue-500/40'
                        : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    เครื่องนี้
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                <span>
                  ทั้งหมด <strong className="text-white font-mono">{queue.length}</strong> คน
                </span>
                <span>•</span>
                <span className="text-orange-400">
                  🔥 ติดลูกค้า <strong>{servingEntries.length}</strong>
                </span>
                <span>•</span>
                <span className="text-blue-300">
                  ⏳ รอลูกค้า <strong>{waitingEntries.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Enqueue Button */}
          <button
            id={`btn-add-queue-${side.toLowerCase()}`}
            onClick={() => onOpenAddQueue(side)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm shadow-lg active:scale-95 transition cursor-pointer ${
              isLeft
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ ลงคิวฝั่ง {side}</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* =========================================================================
              ZONE 1: 🔥 ขึ้นคิว / กำลังติดลูกค้า (SERVING AREA)
              Large Square Cards arranged horizontally with prominent profile pictures
             ========================================================================= */}
          {servingEntries.length > 0 && (
            <div
              id={`serving-zone-${side.toLowerCase()}`}
              className="rounded-2xl border-2 border-orange-500/50 bg-gradient-to-b from-orange-950/30 via-slate-900/70 to-slate-900/95 p-3.5 sm:p-4 shadow-xl shadow-orange-950/30 animate-in fade-in duration-200"
            >
              {/* Serving Zone Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-orange-500/30">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
                    <Flame className="w-4 h-4 fill-orange-400 text-orange-400 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-orange-300 uppercase tracking-wider flex items-center gap-2">
                      กำลังติดลูกค้า
                      <span className="bg-orange-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                        {servingEntries.length} คน
                      </span>
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:inline">
                  กด <span className="text-emerald-400 font-bold">"✓ จบคิว"</span> เมื่อเสร็จเพื่อกลับไปต่อท้ายแถวอัตโนมัติ
                </p>
              </div>

              {/* Large Square Serving Cards: Arranged Horizontally */}
              <div className="flex flex-wrap gap-4 items-stretch overflow-x-auto pb-1 pt-1">
                {servingEntries.map((entry) => {
                  const timerText = formatElapsedTimer(entry.servedAt);
                  const enteredTime = entry.servedAt
                    ? new Date(entry.servedAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <div
                      key={entry.id}
                      id={`serving-card-${entry.id}`}
                      className="group relative w-56 sm:w-64 rounded-2xl border-2 border-orange-500/60 bg-gradient-to-b from-slate-900 via-orange-950/25 to-slate-950 p-4 shadow-xl shadow-orange-950/40 ring-1 ring-orange-400/30 hover:border-orange-400 transition-all flex flex-col items-center justify-between text-center flex-shrink-0"
                    >
                      {/* Top Fire Indicator Badge */}
                      <div className="absolute -top-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5 fill-slate-950" />
                        <span>กำลังติดลูกค้า</span>
                      </div>

                      {/* 1. LARGE SQUARE PROFILE PICTURE */}
                      <div className="mt-2 relative">
                        {entry.employeeAvatarUrl ? (
                          <img
                            src={entry.employeeAvatarUrl}
                            alt={entry.employeeName}
                            className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-orange-400 shadow-xl shadow-black/70 group-hover:scale-105 transition duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = document.getElementById(
                                `fallback-avatar-${entry.id}`
                              );
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          id={`fallback-avatar-${entry.id}`}
                          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-2xl items-center justify-center font-black text-white text-4xl shadow-xl border-2 border-orange-400 ${
                            entry.employeeAvatarUrl ? 'hidden' : 'flex'
                          }`}
                          style={{
                            backgroundColor: entry.employeeAvatarColor || '#f97316',
                          }}
                        >
                          {entry.employeeNickname || entry.employeeName.charAt(0)}
                        </div>

                        {/* Live pulse dot */}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-slate-900"></span>
                        </span>
                      </div>

                      {/* 2. EMPLOYEE DETAILS & TIMER */}
                      <div className="w-full mt-3 flex flex-col items-center">
                        <h4 className="text-base sm:text-lg font-black text-white tracking-tight truncate max-w-full">
                          {entry.employeeName}
                        </h4>

                        <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                          {entry.employeeBrandCode && (
                            <span className="bg-rose-950/90 border border-rose-500/60 text-rose-300 font-mono font-black px-2 py-0.5 rounded-md text-xs tracking-wider shadow-sm flex items-center gap-1">
                              <span>•</span>
                              <span>{entry.employeeBrandCode}</span>
                            </span>
                          )}

                          {entry.employeeNickname && (
                            <span className="text-xs text-amber-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                              {entry.employeeNickname}
                            </span>
                          )}
                        </div>

                        {/* Timer & Start time */}
                        <div className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-orange-950/50 border border-orange-500/30 text-orange-300 font-mono text-xs font-bold py-1.5 px-3 rounded-xl shadow-inner">
                          <Timer className="w-4 h-4 text-orange-400 animate-pulse" />
                          <span>บริการ {timerText} น.</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-normal text-[11px]">
                            เริ่ม {enteredTime}
                          </span>
                        </div>
                      </div>

                      {/* 3. FULL-WIDTH COMPLETE SERVE BUTTON */}
                      <button
                        id={`btn-complete-${entry.id}`}
                        disabled={actionInProgress === entry.id}
                        onClick={() => handleComplete(entry.id)}
                        title="จบคิวแล้วกลับไปต่อท้ายแถวอัตโนมัติ"
                        className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 border border-emerald-400/40 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>✓ จบคิว (ต่อท้าย)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              ZONE 2: ⏳ คิวรอ (WAITING QUEUE) - การ์ดเล็ก กะทัดรัด ประหยัดพื้นที่
              Compact Cards strictly for employees waiting for customers (01, 02, 03...)
             ========================================================================= */}
          <div id={`waiting-zone-${side.toLowerCase()}`} className="flex-1 flex flex-col">
            {/* Waiting Zone Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    คิวรอรับลูกค้า
                    <span className="bg-slate-800 text-blue-300 border border-slate-700 text-xs font-black px-2 py-0.5 rounded-full">
                      {waitingEntries.length} คน
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    เรียงตามลำดับเวลาที่มาถึง • ลำดับ 01 กด "ขึ้นคิว" เมื่อลูกค้ามาถึง
                  </p>
                </div>
              </div>

              {waitingEntries.length > 1 && (
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-xl px-2.5 py-1 shadow-sm select-none">
                  <GripVertical className="w-3.5 h-3.5 text-cyan-400" />
                  <span>💡 กดค้างแล้วลากเพื่อเลื่อนลำดับคิว</span>
                </div>
              )}
            </div>

            {/* Waiting Queue List */}
            {waitingEntries.length === 0 ? (
              <div
                id={`waiting-empty-${side.toLowerCase()}`}
                className="py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 text-center flex flex-col items-center justify-center flex-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center text-2xl mb-2">
                  ⏳
                </div>
                <div className="text-sm font-bold text-slate-300">
                  ไม่มีพนักงานรอในคิวฝั่ง {side}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  เมื่อพนักงานพร้อมรับลูกค้า ให้กดปุ่มด้านล่างเพื่อลงคิว
                </p>
                <button
                  onClick={() => onOpenAddQueue(side)}
                  className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isLeft
                      ? 'border-blue-500/40 text-blue-300 hover:bg-blue-950/60'
                      : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60'
                  }`}
                >
                  + ลงคิวฝั่ง {side} ตอนนี้
                </button>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {waitingEntries.map((entry, index) => {
                  const rankNumber = String(index + 1).padStart(2, '0');
                  const isRankOne = index === 0;
                  const isThisCardDragged = draggedEntryId === entry.id;
                  const isThisDropTarget =
                    draggedSide === side && dragOverIndex === index && !isThisCardDragged;

                  const enteredTime = new Date(entry.enteredAt);
                  const elapsedWaitMins = Math.max(
                    0,
                    Math.floor((currentTime - enteredTime.getTime()) / 60000)
                  );
                  const timeEnteredString = enteredTime.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={entry.id}>
                      {/* Drop Target Indicator when dragging */}
                      {isThisDropTarget && (
                        <div className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-xl shadow-cyan-950/80 animate-pulse my-1 select-none">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
                            <span>
                              วางที่นี่ ➔ เลื่อน{' '}
                              <strong className="text-white">
                                {draggedEntryObjRef.current?.employeeName || 'พนักงาน'}
                              </strong>{' '}
                              เป็นคิวที่ {rankNumber}
                            </span>
                          </div>
                          <span className="text-[10px] bg-cyan-800/80 text-cyan-100 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/40">
                            ปล่อยเพื่อจัดคิว
                          </span>
                        </div>
                      )}

                      <div
                        id={`waiting-card-${entry.id}`}
                        data-queue-side={side}
                        data-waiting-index={index}
                        draggable={waitingEntries.length > 1 && !isReordering}
                        onDragStart={(e) => {
                          if ((e.target as HTMLElement).closest('button')) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedEntryId(entry.id);
                          draggedEntryObjRef.current = entry;
                          draggedSideRef.current = side;
                          setDraggedSide(side);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', entry.id);
                        }}
                        onDragOver={(e) => {
                          if (draggedSide === side) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverIndex !== index) {
                              dragOverIndexRef.current = index;
                              setDragOverIndex(index);
                            }
                          }
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (draggedSide === side && draggedEntryId) {
                            await executeReorder(draggedEntryId, side, index + 1);
                          } else {
                            resetDragState();
                          }
                        }}
                        onDragEnd={() => {
                          resetDragState();
                        }}
                        onTouchStart={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          if (waitingEntries.length <= 1) return;
                          const touch = e.touches[0];
                          touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                          draggedEntryObjRef.current = entry;
                          draggedSideRef.current = side;

                          const isGrip = Boolean((e.target as HTMLElement).closest('.drag-grip'));
                          const delay = isGrip ? 60 : 220;

                          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = setTimeout(() => {
                            setIsDraggingTouch(true);
                            setDraggedEntryId(entry.id);
                            setDraggedSide(side);
                            dragOverIndexRef.current = index;
                            setDragOverIndex(index);
                            setTouchCoords({ x: touch.clientX, y: touch.clientY });
                            if (window.navigator?.vibrate) {
                              try {
                                window.navigator.vibrate(40);
                              } catch (_) {}
                            }
                          }, delay);
                        }}
                        onTouchMove={(e) => {
                          if (!isDraggingTouch && touchStartPosRef.current) {
                            const touch = e.touches[0];
                            const dx = touch.clientX - touchStartPosRef.current.x;
                            const dy = touch.clientY - touchStartPosRef.current.y;
                            if (Math.hypot(dx, dy) > 10) {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                            }
                          }
                        }}
                        onTouchEnd={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        className={`py-2 px-2.5 sm:px-3 rounded-xl border transition-all ${
                          isThisCardDragged
                            ? 'opacity-30 scale-[0.98] border-dashed border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/20'
                            : isThisDropTarget
                            ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-xl shadow-cyan-950/60 bg-slate-800/90'
                            : isRankOne
                            ? isLeft
                              ? 'bg-slate-850 border-blue-400/60 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                              : 'bg-slate-850 border-emerald-400/60 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                            : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-850/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Left: Drag Grip, Up/Down, Queue Number, Compact Avatar, Name */}
                          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                            {/* Drag Grip Handle (กดค้างแล้วลาก) */}
                            {waitingEntries.length > 1 && (
                              <div
                                className="drag-grip p-1 -ml-1 text-slate-500 hover:text-cyan-300 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-700/60 transition flex items-center justify-center touch-none select-none flex-shrink-0"
                                title="กดค้างแล้วลากเพื่อเลื่อนลำดับคิว"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {/* Queue Number Badge & Up/Down Steppers */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Up/Down Quick Shift Buttons */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  id={`btn-move-up-${entry.id}`}
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  disabled={index === 0 || actionInProgress === entry.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenMoveQueue(entry, 'UP');
                                  }}
                                  title={
                                    index === 0
                                      ? 'อยู่ที่ลำดับแรกแล้ว'
                                      : 'เลื่อนขึ้น 1 ลำดับ'
                                  }
                                  className="p-0.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/70 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  id={`btn-move-down-${entry.id}`}
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  disabled={
                                    index === waitingEntries.length - 1 ||
                                    actionInProgress === entry.id
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenMoveQueue(entry, 'DOWN');
                                  }}
                                  title={
                                    index === waitingEntries.length - 1
                                      ? 'อยู่ที่ลำดับสุดท้ายแล้ว'
                                      : 'เลื่อนลง 1 ลำดับ'
                                  }
                                  className="p-0.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/70 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Compact Queue Number Badge */}
                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm sm:text-base shadow-inner flex-shrink-0 ${
                                  isRankOne
                                    ? isLeft
                                      ? 'bg-blue-600 text-white shadow-blue-800/50'
                                      : 'bg-emerald-600 text-white shadow-emerald-800/50'
                                    : 'bg-slate-950 text-slate-400 border border-slate-750'
                                }`}
                              >
                                {rankNumber}
                              </div>
                            </div>

                            {/* Compact Profile Avatar Thumbnail */}
                            <div className="relative flex-shrink-0">
                              {entry.employeeAvatarUrl ? (
                                <img
                                  src={entry.employeeAvatarUrl}
                                  alt={entry.employeeName}
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-slate-600 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm"
                                  style={{
                                    backgroundColor: entry.employeeAvatarColor || '#3b82f6',
                                  }}
                                >
                                  {entry.employeeNickname || entry.employeeName.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Employee Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                                  {entry.employeeName}
                                </span>

                                {entry.employeeBrandCode && (
                                  <span className="text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50 px-1 py-0.2 rounded shadow-sm flex items-center gap-0.5 flex-shrink-0">
                                    <span>•</span>
                                    <span>{entry.employeeBrandCode}</span>
                                  </span>
                                )}

                                {entry.employeeNickname && (
                                  <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-1 py-0.2 rounded border border-slate-800 hidden sm:inline">
                                    {entry.employeeNickname}
                                  </span>
                                )}

                                {isRankOne && (
                                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>คิวถัดไป</span>
                                  </span>
                                )}
                              </div>

                              {/* Compact Timestamp */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span className="text-slate-400">
                                  รอ {elapsedWaitMins} น.
                                </span>
                                <span className="text-slate-600 hidden sm:inline">•</span>
                                <span className="text-slate-500 hidden sm:inline text-[10px]">
                                  ลงคิว {timeEnteredString} น.
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Rank 01 "ขึ้นคิว" Button: Takes Customer */}
                            {isRankOne && (
                              <button
                                id={`btn-serve-${entry.id}`}
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                touch-action="manipulation"
                                onTouchStart={(e) => e.stopPropagation()}
                                disabled={actionInProgress === entry.id}
                                onClick={() => handleServe(entry.id)}
                                className="flex items-center gap-1.5 font-black text-xs sm:text-sm px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-md bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 shadow-orange-500/30 transition cursor-pointer flex-shrink-0"
                              >
                                <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                                <span>🔥 ขึ้นคิว</span>
                              </button>
                            )}

                            {/* Other Ranks alternative serve button */}
                            {!isRankOne && (
                              <button
                                id={`btn-serve-alt-${entry.id}`}
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                disabled={actionInProgress === entry.id}
                                onClick={() => handleServe(entry.id)}
                                title="กรณีลูกค้าเรียกตัวขึ้นคิว"
                                className="flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-lg border border-slate-700 hover:border-orange-500/50 hover:bg-orange-950/30 text-slate-300 hover:text-orange-300 transition cursor-pointer"
                              >
                                <Flame className="w-3 h-3 text-orange-400" />
                                <span className="hidden sm:inline">ขึ้นคิว</span>
                              </button>
                            )}

                            {/* Reorder / Move Queue button */}
                            <button
                              type="button"
                              id={`btn-reorder-${entry.id}`}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              disabled={actionInProgress === entry.id}
                              onClick={() => onOpenMoveQueue(entry)}
                              title="ปรับเลื่อนลำดับคิว"
                              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-slate-700/80 hover:border-cyan-700/50 rounded-lg transition text-xs cursor-pointer"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove button */}
                            <button
                              id={`btn-remove-${entry.id}`}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              disabled={actionInProgress === entry.id}
                              onClick={() => onOpenRemove(entry)}
                              title="เอาออกจากคิว (พัก/ไปธุระ/กลับบ้าน)"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-700/50 rounded-lg transition text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Drop target at bottom for moving to last position */}
                {draggedSide === side && draggedEntryId && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== waitingEntries.length - 1) {
                        dragOverIndexRef.current = waitingEntries.length - 1;
                        setDragOverIndex(waitingEntries.length - 1);
                      }
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (draggedEntryId) {
                        await executeReorder(draggedEntryId, side, waitingEntries.length);
                      }
                      resetDragState();
                    }}
                    className="text-center py-2.5 px-3 border border-dashed border-cyan-500/50 rounded-xl text-cyan-400 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 transition select-none flex items-center justify-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span>
                      ปล่อยที่นี่เพื่อย้ายไปคิวสุดท้าย (คิวที่{' '}
                      {String(waitingEntries.length).padStart(2, '0')})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>* คิวรันตามเวลาจริง ห้ามลัดคิว</span>
          <span className="text-slate-500">PAINT QUEUE v2 • Multi-Serving</span>
        </div>
      </div>
    );
  };

  const isLeft = machineSide === 'LEFT';
  const activeQueue = isLeft ? leftQueue : rightQueue;
  const activeTitle = isLeft ? '🟦 ฝั่ง LEFT (ซ้าย)' : '🟩 ฝั่ง RIGHT (ขวา)';
  const activeColorScheme = isLeft ? 'blue' : 'emerald';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 relative">
      {/* Display ONLY this machine's designated side queue */}
      {renderQueueSide(machineSide, activeQueue, activeTitle, activeColorScheme)}

      {/* Floating Ghost Chip while Touch Dragging (กดค้างแล้วลาก) */}
      {isDraggingTouch && touchCoords && draggedEntryObjRef.current && (
        <div
          id="touch-drag-ghost"
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-cyan-400 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-md ring-4 ring-cyan-500/30 max-w-xs text-white select-none transition-transform duration-75"
          style={{ left: touchCoords.x, top: touchCoords.y - 50 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow flex-shrink-0"
            style={{
              backgroundColor:
                draggedEntryObjRef.current.employeeAvatarColor || '#06b6d4',
            }}
          >
            {draggedEntryObjRef.current.employeeNickname ||
              draggedEntryObjRef.current.employeeName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight flex items-center gap-1.5 truncate">
              <span>{draggedEntryObjRef.current.employeeName}</span>
              {draggedEntryObjRef.current.employeeBrandCode && (
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-600/40 px-1 rounded flex-shrink-0">
                  {draggedEntryObjRef.current.employeeBrandCode}
                </span>
              )}
            </div>
            <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
              {dragOverIndex !== null
                ? `กำลังเลื่อน ➔ คิวที่ ${String(dragOverIndex + 1).padStart(2, '0')}`
                : 'ลากไปยังตำแหน่งที่ต้องการปล่อย'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
