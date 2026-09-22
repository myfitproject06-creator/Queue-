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
  Monitor,
  Lock,
  Eye,
  Palette,
  RotateCcw,
  ZoomIn,
  Maximize2,
} from 'lucide-react';
import { QueueEntry, Side, MachineId, ThemePreset } from '../types';
import { ImageViewerModal, ImageViewerData } from './ImageViewerModal';
import { getBrandVisual } from '../constants';

interface QueueBoardProps {
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  machineId: MachineId;
  machineSide: Side;
  activeTheme?: ThemePreset;
  themeSwapped?: boolean;
  onOpenThemeSelect?: () => void;
  onOpenAddQueue: (side: Side) => void;
  onStartServe: (entryId: string) => Promise<void>;
  onCompleteServe: (entryId: string) => Promise<void>;
  onOpenReturnQueue: (entry: QueueEntry) => void;
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
  activeTheme,
  themeSwapped = false,
  onOpenThemeSelect,
  onOpenAddQueue,
  onStartServe,
  onCompleteServe,
  onOpenReturnQueue,
  onOpenRemove,
  onOpenMoveQueue,
  onDragReorderQueue,
  onChangeMachineSide,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [desktopViewMode, setDesktopViewMode] = useState<'CURRENT' | 'OPPOSITE' | 'DUAL'>('CURRENT');
  const [viewerData, setViewerData] = useState<ImageViewerData | null>(null);

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
    // Guard: Only allow reordering on own side and not in DUAL view
    if (desktopViewMode === 'DUAL' || side !== machineSide) return;
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
    colorScheme: 'red' | 'blue' | 'emerald'
  ) => {
    const isLeft = side === 'LEFT';
    // If theme is swapped via side-switching, swap which theme side config applies
    const isThemedAsLeft = themeSwapped ? !isLeft : isLeft;
    const sideTheme = activeTheme ? (isThemedAsLeft ? activeTheme.left : activeTheme.right) : null;
    const isCurrentMachineSide =
      (machineId === 'PC_LEFT' && isLeft) || (machineId === 'PC_RIGHT' && !isLeft);
    // Strict Scope: Only the machine's assigned side is editable. Opposite side and Dual Side are strictly Read-Only.
    const isSideEditable = desktopViewMode !== 'DUAL' && side === machineSide;

    // Strictly separate SERVING vs WAITING
    const servingEntries = queue.filter((q) => q.status === 'SERVING');
    const waitingEntries = queue.filter((q) => q.status !== 'SERVING');

    const borderGlowClass = isLeft
      ? 'border-red-500/50 shadow-xl shadow-red-950/30'
      : 'border-blue-500/50 shadow-xl shadow-blue-950/30';

    const headerBgClass = isLeft
      ? 'bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 border-b border-red-500/40'
      : 'bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-900 border-b border-blue-500/40';

    return (
      <div
        id={`queue-side-${side.toLowerCase()}`}
        style={{
          borderTop: isLeft ? '5px solid #dc2626' : '5px solid #2563eb',
        }}
        className={`flex-1 rounded-3xl border flex flex-col bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-md transition-all ${borderGlowClass}`}
      >
        {/* Main Column Header - Clean, High Contrast, Red Team vs Blue Team Identity */}
        <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${headerBgClass}`}>
          <div className="flex items-center gap-3.5">
            {/* Side Indicator Badge */}
            <div
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-md border flex-shrink-0 ${
                isLeft
                  ? 'bg-red-600 text-white border-red-400/40 shadow-red-600/30'
                  : 'bg-blue-600 text-white border-blue-400/40 shadow-blue-600/30'
              }`}
            >
              <span className="text-[9px] font-bold tracking-widest opacity-90 leading-none">
                {isLeft ? 'ทีม' : 'ทีม'}
              </span>
              <span className="text-base font-black leading-tight">
                {isLeft ? 'RED' : 'BLUE'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className={isLeft ? 'text-red-300' : 'text-blue-300'}>
                    {isLeft ? '🔴 ทีมแดง (LEFT)' : '🔵 ทีมน้ำเงิน (RIGHT)'}
                  </span>
                </h2>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-sm ${
                    isLeft
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {isLeft ? 'เครื่องผสมสี 1 (A)' : 'เครื่องผสมสี 2 (B)'}
                </span>

                {isSideEditable ? (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm flex items-center gap-1.5 ${
                      isLeft
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>เครื่องนี้ (บันทึกได้)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>ดูอย่างเดียว (READ ONLY)</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-medium flex-wrap">
                <span>
                  ทั้งหมด <strong className="text-white font-mono">{queue.length}</strong> คน
                </span>
                <span className="text-slate-600">•</span>
                <span className={isLeft ? 'text-red-300 font-semibold' : 'text-blue-300 font-semibold'}>
                  กำลังผสม <strong>{servingEntries.length}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">
                  ⏳ รอลำดับ <strong>{waitingEntries.length}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline" title="ระบบจะล้างคิวเริ่มต้นวันใหม่อัตโนมัติทุกเที่ยงคืน (00:00 น.)">
                  🔄 รีเซต 00:00 น.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Enqueue Button or Read-Only Notice */}
          {isSideEditable ? (
            <button
              id={`btn-add-queue-${side.toLowerCase()}`}
              onClick={() => onOpenAddQueue(side)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm shadow-md active:scale-95 transition cursor-pointer text-white ${
                isLeft
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ ลงคิว{isLeft ? 'ทีมแดง' : 'ทีมน้ำเงิน'} ({side})</span>
            </button>
          ) : (
            <div
              id={`badge-readonly-${side.toLowerCase()}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold select-none shadow-sm"
              title="ฝั่งนี้เป็นโหมดดูอย่างเดียว ไม่สามารถแก้ไขได้จากเครื่องนี้"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>โหมดดูอย่างเดียว (Read Only)</span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* =========================================================================
              ZONE 1: 🔥 ขึ้นคิว / กำลังติดลูกค้า (SERVING AREA) - ปรับขนาดให้กะทัดรัดขึ้น
              Compact Cards arranged horizontally with proportional profile pictures
             ========================================================================= */}
          {servingEntries.length > 0 && (
            <div
              id={`serving-zone-${side.toLowerCase()}`}
              className={`rounded-2xl border-2 ${
                sideTheme?.servingBorder || 'border-orange-500/50'
              } ${
                sideTheme?.servingBg ||
                'bg-gradient-to-b from-orange-950/25 via-slate-900/70 to-slate-900/90'
              } p-3 sm:p-3.5 shadow-lg shadow-orange-950/20 animate-in fade-in duration-200`}
            >
              {/* Serving Zone Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-orange-500/30">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
                    <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-orange-300 uppercase tracking-wider flex items-center gap-2">
                      กำลังติดลูกค้า
                      <span className="bg-orange-500 text-slate-950 text-[11px] font-black px-2 py-0.2 rounded-full shadow-sm">
                        {servingEntries.length} คน
                      </span>
                    </h3>
                  </div>
                </div>
                {isSideEditable ? (
                  <p className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    กด <span className="text-emerald-400 font-bold">"✓ จบคิว"</span> เพื่อไปต่อท้าย • กด <span className="text-amber-300 font-bold">"↩ คืนคิว"</span> กรณีขึ้นผิด
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>โหมดดูอย่างเดียว</span>
                  </p>
                )}
              </div>

              {/* Compact Serving Cards: Reduced Size */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 items-stretch overflow-x-auto pb-1 pt-0.5">
                {servingEntries.map((entry) => {
                  const brandVisual = getBrandVisual(entry.employeeBrand, entry.employeeBrandCode);
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
                      style={{
                        borderTop: `5px solid ${brandVisual.color}`,
                      }}
                      className="group relative w-48 sm:w-56 md:w-60 rounded-2xl border-2 border-orange-500/70 bg-gradient-to-b from-slate-900 via-orange-950/25 to-slate-950 p-3 sm:p-3.5 shadow-lg shadow-orange-950/30 ring-1 ring-orange-400/30 hover:border-orange-400 transition-all flex flex-col items-center justify-between text-center flex-shrink-0"
                    >
                      {/* Top Fire Indicator Badge */}
                      <div className="absolute -top-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                        <Flame className="w-3 h-3 fill-slate-950" />
                        <span>กำลังติดลูกค้า</span>
                      </div>

                      {/* Quick remove button if needed */}
                      {isSideEditable && (
                        <button
                          type="button"
                          id={`btn-remove-serving-${entry.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRemove(entry);
                          }}
                          title="นำออกจากคิว / ยกเลิก"
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* 1. LARGE PROFILE PICTURE (Enlarged with Click-to-View Full Image) */}
                      <div
                        className="mt-1.5 relative group/avatar cursor-pointer"
                        onClick={() => {
                          setViewerData({
                            imageUrl: entry.employeeAvatarUrl,
                            name: entry.employeeName,
                            nickname: entry.employeeNickname,
                            brand: entry.employeeBrand,
                            brandCode: entry.employeeBrandCode,
                            avatarColor: entry.employeeAvatarColor,
                            isServing: true,
                            side: entry.side,
                            statusText: `เริ่มบริการเวลา ${enteredTime} น. (ผ่านไป ${timerText} น.)`,
                          });
                        }}
                        title="คลิกเพื่อดูรูปภาพแบบเต็มๆ"
                      >
                        {entry.employeeAvatarUrl ? (
                          <img
                            src={entry.employeeAvatarUrl}
                            alt={entry.employeeName}
                            style={{ borderColor: brandVisual.color }}
                            className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 shadow-xl shadow-black/80 group-hover/avatar:scale-[1.03] transition duration-200"
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
                          className={`w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl items-center justify-center font-black text-white text-4xl sm:text-5xl shadow-xl border-4 group-hover/avatar:scale-[1.03] transition duration-200 ${
                            entry.employeeAvatarUrl ? 'hidden' : 'flex'
                          }`}
                          style={{
                            backgroundColor: entry.employeeAvatarColor || brandVisual.color,
                            borderColor: brandVisual.color,
                          }}
                        >
                          {entry.employeeNickname || entry.employeeName.charAt(0)}
                        </div>

                        {/* Hover overlay hint: คลิกดูรูปเต็ม */}
                        <div className="absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-[1px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 select-none pointer-events-none">
                          <Maximize2 className="w-6 h-6 text-amber-300 drop-shadow" />
                          <span className="text-[11px] font-black bg-slate-900/90 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/50 shadow-md">
                            ดูรูปเต็ม
                          </span>
                        </div>

                        {/* Live pulse dot */}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-slate-900"></span>
                        </span>
                      </div>

                      {/* Prominent Solid Brand Tag under Avatar */}
                      <div
                        className={`mt-2 px-3 py-1 rounded-lg ${brandVisual.badgeBg} ${brandVisual.badgeText} text-xs font-black tracking-wider shadow-md flex items-center justify-center gap-1.5 border border-white/20 uppercase w-full max-w-[90%]`}
                        title={`แบรนด์: ${brandVisual.brand}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm flex-shrink-0 animate-pulse" />
                        <span className="truncate">{brandVisual.brand}</span>
                        {brandVisual.brandCode && brandVisual.brandCode !== brandVisual.brand && (
                          <span className="text-[10px] opacity-90 font-mono">({brandVisual.brandCode})</span>
                        )}
                      </div>

                      {/* Quick button to view full photo */}
                      <button
                        type="button"
                        id={`btn-view-avatar-${entry.id}`}
                        onClick={() => {
                          setViewerData({
                            imageUrl: entry.employeeAvatarUrl,
                            name: entry.employeeName,
                            nickname: entry.employeeNickname,
                            brand: entry.employeeBrand,
                            brandCode: entry.employeeBrandCode,
                            avatarColor: entry.employeeAvatarColor,
                            isServing: true,
                            side: entry.side,
                            statusText: `เริ่มบริการเวลา ${enteredTime} น. (ผ่านไป ${timerText} น.)`,
                          });
                        }}
                        className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/70 hover:bg-slate-800 text-amber-300/90 hover:text-amber-200 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                        title="คลิกดูรูปภาพแบบเต็มๆ"
                      >
                        <ZoomIn className="w-3 h-3 text-amber-400" />
                        <span>กดดูรูปเต็ม</span>
                      </button>

                      {/* 2. EMPLOYEE DETAILS & TIMER */}
                      <div className="w-full mt-1.5 flex flex-col items-center">
                        <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate max-w-full">
                          {entry.employeeName}
                        </h4>

                        <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                          {entry.employeeNickname && (
                            <span className="text-[10px] sm:text-[11px] text-amber-300 bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded font-semibold">
                              ชื่อเล่น: {entry.employeeNickname}
                            </span>
                          )}
                        </div>

                        {/* Compact Timer & Start time */}
                        <div className="mt-1.5 w-full flex items-center justify-center gap-1 bg-orange-950/40 border border-orange-500/30 text-orange-300 font-mono text-[10px] sm:text-[11px] font-bold py-0.5 px-1.5 rounded-lg shadow-inner">
                          <Timer className="w-3 h-3 text-orange-400 animate-pulse" />
                          <span>{timerText} น.</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-normal text-[9px]">
                            {enteredTime}
                          </span>
                        </div>
                      </div>

                      {/* 3. COMPLETE SERVE & RETURN QUEUE BUTTONS OR READ-ONLY STATUS */}
                      {isSideEditable ? (
                        <div className="w-full mt-2 flex flex-col gap-1.5">
                          <button
                            id={`btn-complete-${entry.id}`}
                            disabled={actionInProgress === entry.id}
                            onClick={() => handleComplete(entry.id)}
                            title="จบคิวแล้วกลับไปต่อท้ายแถวอัตโนมัติ"
                            className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>✓ จบคิว</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-return-${entry.id}`}
                            disabled={actionInProgress === entry.id}
                            onClick={() => onOpenReturnQueue(entry)}
                            title="คืนคิวกลับสู่คิวรอ (กรณีขึ้นคิวผิด)"
                            className="w-full py-1 px-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>↩ คืนคิว (ขึ้นผิด)</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          id={`status-serving-readonly-${entry.id}`}
                          className="w-full mt-2 py-1 px-1.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-400 text-[10px] font-semibold flex items-center justify-center gap-1 select-none"
                        >
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>ดูอย่างเดียว</span>
                        </div>
                      )}
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
                <span className={`p-1.5 rounded-lg border ${
                  isLeft
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    คิวรอรับลูกค้า
                    <span className={`border text-xs font-black px-2 py-0.5 rounded-full ${
                      isLeft
                        ? 'bg-red-950/80 text-red-300 border-red-500/40'
                        : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                    }`}>
                      {waitingEntries.length} คน
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    เรียงตามลำดับเวลาที่มาถึง • ลำดับ 01 กด "ขึ้นคิว" เมื่อเริ่มบริการ
                  </p>
                </div>
              </div>

              {isSideEditable && waitingEntries.length > 1 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-xl px-2.5 py-1 shadow-sm select-none">
                  <GripVertical className="w-3.5 h-3.5 text-cyan-400" />
                  <span>💡 กดค้างแล้วลากเพื่อเลื่อนลำดับคิว</span>
                </div>
              ) : !isSideEditable ? (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1 shadow-sm select-none">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>ดูได้อย่างเดียว (ห้ามแก้ไข)</span>
                </div>
              ) : null}
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
                  {isSideEditable
                    ? 'เมื่อพนักงานพร้อมรับลูกค้า ให้กดปุ่มด้านล่างเพื่อลงคิว'
                    : `คิวฝั่ง ${side} ว่างอยู่ (ลงคิวได้ที่เครื่องฝั่ง ${side})`}
                </p>
                {isSideEditable && (
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
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:gap-2.5 flex-1 w-full">
                {waitingEntries.map((entry, index) => {
                  const brandVisual = getBrandVisual(entry.employeeBrand, entry.employeeBrandCode);
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
                        <div className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-xl shadow-cyan-950/80 animate-pulse my-1 select-none">
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
                        draggable={isSideEditable && waitingEntries.length > 1 && !isReordering}
                        onDragStart={(e) => {
                          if (!isSideEditable) return;
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
                          if (!isSideEditable) return;
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
                          if (!isSideEditable) return;
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
                          if (!isSideEditable) return;
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
                            ? (isLeft
                                ? 'bg-slate-850/95 border-2 border-red-500/70 shadow-md shadow-red-950/40 ring-1 ring-red-500/30'
                                : 'bg-slate-850/95 border-2 border-blue-500/70 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30')
                            : `bg-slate-900/75 border-slate-700/60 ${isLeft ? 'hover:border-red-500/40' : 'hover:border-blue-500/40'} hover:bg-slate-850/80`
                        }`}
                        style={{
                          borderLeft: `6px solid ${brandVisual.color}`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Left: Drag Grip, Up/Down, Queue Number, Compact Avatar, Name */}
                          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                            {/* Drag Grip Handle (กดค้างแล้วลาก) - เฉพาะฝั่งที่เครื่องนี้แก้ไขได้ */}
                            {isSideEditable && waitingEntries.length > 1 && (
                              <div
                                className="drag-grip p-1 -ml-1 text-slate-500 hover:text-cyan-300 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-700/60 transition flex items-center justify-center touch-none select-none flex-shrink-0"
                                title="กดค้างแล้วลากเพื่อเลื่อนลำดับคิว"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {/* Queue Number Badge & Up/Down Steppers */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Up/Down Quick Shift Buttons - เฉพาะฝั่งที่เครื่องนี้แก้ไขได้ */}
                              {isSideEditable && (
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
                              )}

                              {/* Compact Queue Number Badge */}
                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm sm:text-base shadow-inner flex-shrink-0 transition-transform ${
                                  isRankOne
                                    ? (isLeft
                                        ? 'bg-red-600 text-white shadow-red-800/50'
                                        : 'bg-blue-600 text-white shadow-blue-800/50')
                                    : (isLeft
                                        ? 'bg-slate-950 text-red-300/90 border border-red-500/30'
                                        : 'bg-slate-950 text-blue-300/90 border border-blue-500/30')
                                }`}
                              >
                                {rankNumber}
                              </div>
                            </div>

                            {/* Profile Avatar Thumbnail - clickable to view full image */}
                            <div
                              className="relative flex-shrink-0 cursor-pointer group/thumb"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewerData({
                                  imageUrl: entry.employeeAvatarUrl,
                                  name: entry.employeeName,
                                  nickname: entry.employeeNickname,
                                  brand: entry.employeeBrand,
                                  brandCode: entry.employeeBrandCode,
                                  avatarColor: entry.employeeAvatarColor,
                                  isServing: false,
                                  side: entry.side,
                                  statusText: `คิวรอลำดับที่ ${rankNumber} (รอมาแล้ว ${elapsedWaitMins} นาที)`,
                                });
                              }}
                              title="คลิกเพื่อดูรูปภาพแบบเต็มๆ"
                            >
                              {entry.employeeAvatarUrl ? (
                                <img
                                  src={entry.employeeAvatarUrl}
                                  alt={entry.employeeName}
                                  style={{ borderColor: brandVisual.color }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 shadow-sm group-hover/thumb:ring-2 group-hover/thumb:scale-105 transition"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm border-2 group-hover/thumb:scale-105 transition"
                                  style={{
                                    backgroundColor: entry.employeeAvatarColor || brandVisual.color,
                                    borderColor: brandVisual.color,
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

                                {/* High-Visibility Brand Badge */}
                                <span
                                  className={`text-[11px] font-mono font-black ${brandVisual.badgeBg} ${brandVisual.badgeText} px-2 py-0.5 rounded-md shadow flex items-center gap-1 flex-shrink-0 tracking-wide border border-white/20`}
                                  title={`สังกัดแบรนด์: ${brandVisual.brand}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/90 flex-shrink-0"></span>
                                  <span>{brandVisual.brandCode || brandVisual.brand}</span>
                                </span>

                                {entry.employeeBrand && entry.employeeBrand !== (brandVisual.brandCode || brandVisual.brand) && (
                                  <span className="text-[10px] text-slate-400 font-medium hidden md:inline truncate max-w-[90px]">
                                    ({entry.employeeBrand})
                                  </span>
                                )}

                                {entry.employeeNickname && (
                                  <span className="text-[10px] font-medium text-slate-300 bg-slate-950 px-1 py-0.2 rounded border border-slate-800 hidden sm:inline">
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
                          {isSideEditable ? (
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
                                  className={`flex items-center gap-1.5 font-black text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md ${
                                    isLeft
                                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                                  } active:scale-95 transition cursor-pointer flex-shrink-0`}
                                >
                                  <Flame className="w-3.5 h-3.5 fill-current" />
                                  <span>ขึ้นคิว</span>
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
                                  className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg border ${
                                    isLeft
                                      ? 'border-red-500/40 hover:border-red-400 hover:bg-red-950/40 text-red-300'
                                      : 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/40 text-blue-300'
                                  } transition cursor-pointer`}
                                >
                                  <Flame className="w-3 h-3 text-amber-400" />
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
                                type="button"
                                id={`btn-remove-${entry.id}`}
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                disabled={actionInProgress === entry.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenRemove(entry);
                                }}
                                title="เอาออกจากคิว (พัก/ไปธุระ/กลับบ้าน)"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 border border-slate-700/80 hover:border-rose-600/60 rounded-lg transition text-xs cursor-pointer active:scale-95"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isRankOne && (
                                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
                                  <span>คิวถัดไป</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Drop target at bottom for moving to last position (only when editable) */}
                {isSideEditable && draggedSide === side && draggedEntryId && (
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
                    className="w-full text-center py-2.5 px-3 border border-dashed border-cyan-500/50 rounded-xl text-cyan-400 text-xs sm:text-sm bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 transition select-none flex items-center justify-center gap-2"
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
          <span className={isSideEditable ? 'text-slate-500' : 'text-amber-400/90 font-bold flex items-center gap-1'}>
            {!isSideEditable && <Lock className="w-3 h-3 text-amber-400" />}
            {isSideEditable ? 'PAINT QUEUE • จัดการคิวฝั่ง ' + side : 'โหมดดูอย่างเดียว (READ ONLY)'}
          </span>
        </div>
      </div>
    );
  };

  const isLeft = machineSide === 'LEFT';
  const activeQueue = isLeft ? leftQueue : rightQueue;

  const effectiveLeftSideTheme = themeSwapped ? activeTheme?.right : activeTheme?.left;
  const effectiveRightSideTheme = themeSwapped ? activeTheme?.left : activeTheme?.right;

  const leftSideTitle = effectiveLeftSideTheme
    ? `${effectiveLeftSideTheme.iconEmoji} ${effectiveLeftSideTheme.name} (LEFT)`
    : '🔴 ทีมแดง (LEFT)';
  const rightSideTitle = effectiveRightSideTheme
    ? `${effectiveRightSideTheme.iconEmoji} ${effectiveRightSideTheme.name} (RIGHT)`
    : '🔵 ทีมน้ำเงิน (RIGHT)';

  const activeTitle = isLeft ? leftSideTitle : rightSideTitle;
  const activeColorScheme = isLeft ? 'red' : 'blue';

  const oppositeSide = isLeft ? 'RIGHT' : 'LEFT';
  const oppositeQueue = isLeft ? rightQueue : leftQueue;
  const oppositeTitle = isLeft ? rightSideTitle : leftSideTitle;
  const oppositeColorScheme = isLeft ? 'blue' : 'red';

  return (
    <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 relative">
      {/* Desktop / Counter Screen View Switcher */}
      <div className="mb-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 px-2 font-medium">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">โหมดแสดงผล:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="view-mode-current"
            onClick={() => setDesktopViewMode('CURRENT')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              desktopViewMode === 'CURRENT'
                ? isLeft
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📌 ฝั่งเครื่องนี้ ({isLeft ? '🔴 ทีมแดง LEFT' : '🔵 ทีมน้ำเงิน RIGHT'})</span>
          </button>

          <button
            type="button"
            id="view-mode-opposite"
            onClick={() => setDesktopViewMode('OPPOSITE')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              desktopViewMode === 'OPPOSITE'
                ? !isLeft
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 opacity-80" />
            <span>↔️ ฝั่งตรงข้าม ({isLeft ? '🔵 ทีมน้ำเงิน RIGHT' : '🔴 ทีมแดง LEFT'})</span>
          </button>

          <button
            type="button"
            id="view-mode-dual"
            onClick={() => setDesktopViewMode('DUAL')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              desktopViewMode === 'DUAL'
                ? 'bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white shadow-md shadow-purple-950/50 ring-1 ring-purple-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 opacity-80" />
            <span>⚔️ จอคู่ แดง VS น้ำเงิน</span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onChangeMachineSide && (
            <button
              type="button"
              onClick={onChangeMachineSide}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="เปลี่ยนการตั้งค่าเครื่องนี้ (Terminal Setup)"
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>สลับเครื่อง</span>
            </button>
          )}
        </div>
      </div>

      {/* Informative Banner when in Opposite or Dual Side view */}
      {desktopViewMode === 'OPPOSITE' && (
        <div
          id="banner-opposite-view"
          className="mb-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-200 shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              กำลังดู <strong>{oppositeTitle}</strong> ใน<strong>โหมดดูอย่างเดียว (READ ONLY)</strong>: เครื่องนี้เป็นเจ้าของฝั่ง <strong>{isLeft ? 'ทีมแดง (ซ้าย)' : 'ทีมน้ำเงิน (ขวา)'}</strong> แก้ไขได้เฉพาะฝั่งตัวเองเท่านั้น
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDesktopViewMode('CURRENT')}
            className="text-[11px] font-bold bg-amber-900/90 hover:bg-amber-800 text-amber-100 px-3 py-1 rounded-xl border border-amber-500/60 transition cursor-pointer flex-shrink-0"
          >
            กลับฝั่งเครื่องนี้ ➔
          </button>
        </div>
      )}

      {desktopViewMode === 'DUAL' && (
        <div
          id="banner-dual-view"
          className="mb-4 bg-slate-900/80 border border-purple-500/40 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-purple-200 shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 font-medium">
            <Eye className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>
              <strong>⚔️ จอภาพรวม แดง VS น้ำเงิน (Dual Side):</strong> แสดงคิวเปรียบเทียบทั้ง 2 ฝั่ง (โหมดดูอย่างเดียว หากต้องการจัดการคิวให้สลับไปที่ "ฝั่งเครื่องนี้")
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDesktopViewMode('CURRENT')}
            className="text-[11px] font-bold bg-purple-900/90 hover:bg-purple-800 text-purple-100 px-3 py-1 rounded-xl border border-purple-500/60 transition cursor-pointer flex-shrink-0"
          >
            ไปที่ฝั่งเครื่องนี้ ➔
          </button>
        </div>
      )}

      {/* Main Queue View */}
      {desktopViewMode === 'DUAL' ? (
        <div className="flex flex-col gap-4">
          {/* Matchup Team Summary Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
              <div>
                <span className="text-sm font-black text-red-400">🔴 ทีมแดง (LEFT)</span>
                <span className="text-xs text-slate-400 ml-2 font-mono">
                  คิวทั้งหมด {leftQueue.length} คน • กำลังผสม {leftQueue.filter((q) => q.status === 'SERVING').length} คน
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950 border border-slate-700 shadow-inner font-black text-xs text-amber-400">
              <span>⚔️</span>
              <span className="tracking-widest">RED VS BLUE</span>
              <span>⚔️</span>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-sm font-black text-blue-400">🔵 ทีมน้ำเงิน (RIGHT)</span>
                <span className="text-xs text-slate-400 ml-2 font-mono">
                  คิวทั้งหมด {rightQueue.length} คน • กำลังผสม {rightQueue.filter((q) => q.status === 'SERVING').length} คน
                </span>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {renderQueueSide('LEFT', leftQueue, leftSideTitle, 'red')}
            {renderQueueSide('RIGHT', rightQueue, rightSideTitle, 'blue')}
          </div>
        </div>
      ) : desktopViewMode === 'OPPOSITE' ? (
        renderQueueSide(oppositeSide, oppositeQueue, oppositeTitle, oppositeColorScheme)
      ) : (
        renderQueueSide(machineSide, activeQueue, activeTitle, activeColorScheme)
      )}

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

      {/* Image Lightbox / Full Size Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerData !== null}
        data={viewerData}
        onClose={() => setViewerData(null)}
      />
    </div>
  );
};
