import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  X,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { QueueEntry } from '../types';

interface MoveQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: QueueEntry | null;
  initialDirection?: 'UP' | 'DOWN';
  waitingEntries: QueueEntry[];
  onConfirmMove: (entryId: string, targetRank: number, reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  { key: 'WRONG_ORDER', label: 'ลำดับคิวผิด (จัดคิวใหม่)', icon: '⚡' },
  { key: 'ARRIVED_EARLIER', label: 'มาถึงก่อนแต่ลงคิวทีหลัง', icon: '🕒' },
  { key: 'AGREED_SWAP', label: 'สลับลำดับตามข้อตกลง', icon: '🔄' },
  { key: 'SYSTEM_CORRECTION', label: 'แก้ไขข้อผิดพลาดระบบ', icon: '🛠️' },
  { key: 'CUSTOM', label: 'อื่นๆ (ระบุเอง)', icon: '✏️' },
];

export const MoveQueueModal: React.FC<MoveQueueModalProps> = ({
  isOpen,
  onClose,
  entry,
  initialDirection,
  waitingEntries,
  onConfirmMove,
}) => {
  const [targetRank, setTargetRank] = useState<number>(1);
  const [selectedReason, setSelectedReason] = useState<string>('ลำดับคิวผิด (จัดคิวใหม่)');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute current rank (1-based)
  const currentRank = entry
    ? waitingEntries.findIndex((q) => q.id === entry.id) + 1
    : 1;

  useEffect(() => {
    if (isOpen && entry) {
      setErrorMessage(null);
      setSelectedReason('ลำดับคิวผิด (จัดคิวใหม่)');
      setCustomReasonText('');

      // Determine initial target rank
      if (initialDirection === 'UP') {
        setTargetRank(Math.max(1, currentRank - 1));
      } else if (initialDirection === 'DOWN') {
        setTargetRank(Math.min(waitingEntries.length, currentRank + 1));
      } else {
        setTargetRank(Math.max(1, currentRank - 1));
      }
    }
  }, [isOpen, entry, initialDirection, currentRank, waitingEntries.length]);

  if (!isOpen || !entry) return null;

  const totalWaiting = waitingEntries.length;
  const isUpDisabled = targetRank <= 1;
  const isDownDisabled = targetRank >= totalWaiting;
  const hasChanged = targetRank !== currentRank;

  // Person currently at target position (to show whom we are swapping with)
  const targetIndex = targetRank - 1;
  const displacedEntry =
    targetIndex >= 0 && targetIndex < waitingEntries.length && targetRank !== currentRank
      ? waitingEntries[targetIndex]
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanged) {
      setErrorMessage('กรุณาเลือกตำแหน่งลำดับใหม่ที่ต้องการเลื่อน');
      return;
    }

    const finalReason =
      selectedReason === 'อื่นๆ (ระบุเอง)'
        ? customReasonText.trim() || 'ลำดับคิวผิด (จัดคิวใหม่)'
        : selectedReason;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirmMove(entry.id, targetRank, finalReason);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเลื่อนลำดับคิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="move-queue-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="move-queue-dialog"
        className="bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl max-w-lg w-full text-white animate-in fade-in zoom-in-95 duration-150 overflow-hidden ring-1 ring-cyan-500/20"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-lg font-bold shadow-inner">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                เลื่อนลำดับคิว
                <span className="text-xs bg-cyan-950 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-700/50">
                  ฝั่ง {entry.side}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                กรณีลำดับคิวผิด ปรับตำแหน่งขึ้น-ลง พร้อมบันทึกประวัติ Audit Log
              </p>
            </div>
          </div>

          <button
            id="btn-close-move-queue"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Employee Card */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {entry.employeeAvatarUrl ? (
                <img
                  src={entry.employeeAvatarUrl}
                  alt={entry.employeeName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow"
                  style={{ backgroundColor: entry.employeeAvatarColor || '#06b6d4' }}
                >
                  {entry.employeeNickname || entry.employeeName.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{entry.employeeName}</span>
                  {entry.employeeBrandCode && (
                    <span className="text-xs font-mono font-black bg-rose-950 text-rose-300 border border-rose-600/40 px-2 py-0.5 rounded">
                      • {entry.employeeBrandCode}
                    </span>
                  )}
                  {entry.employeeNickname && (
                    <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      {entry.employeeNickname}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  สถานะ: ในคิวรอรับลูกค้า (คิวที่ {String(currentRank).padStart(2, '0')})
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">ลำดับปัจจุบัน</span>
              <span className="text-xl font-mono font-black text-amber-400">
                #{String(currentRank).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Reordering Controls (Rank Stepper & Selectors) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              เลือกตำแหน่งลำดับใหม่
            </label>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Previous vs Target comparison */}
              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">เดิม</div>
                  <div className="text-lg font-mono font-black text-slate-300">
                    {String(currentRank).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex items-center text-cyan-400 font-black text-lg animate-pulse">
                  ➔
                </div>

                <div
                  className={`text-center px-4 py-2 rounded-xl border transition-all ${
                    targetRank < currentRank
                      ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                      : targetRank > currentRank
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/50'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase">
                    {targetRank < currentRank
                      ? '▲ เลื่อนขึ้นเป็น'
                      : targetRank > currentRank
                      ? '▼ เลื่อนลงเป็น'
                      : 'ลำดับใหม่'}
                  </div>
                  <div className="text-2xl font-mono font-black leading-tight">
                    คิว {String(targetRank).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Stepper Buttons (Up / Down) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-step-up"
                  disabled={isUpDisabled}
                  onClick={() => setTargetRank((prev) => Math.max(1, prev - 1))}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                  <span>เลื่อนขึ้น (▲)</span>
                </button>

                <button
                  type="button"
                  id="btn-step-down"
                  disabled={isDownDisabled}
                  onClick={() => setTargetRank((prev) => Math.min(totalWaiting, prev + 1))}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                  <span>เลื่อนลง (▼)</span>
                </button>
              </div>
            </div>

            {/* Direct rank picker pill buttons */}
            {totalWaiting > 1 && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>เลือกตำแหน่งโดยตรง:</span>
                  <span className="text-[10px] text-slate-500">
                    มีทั้งหมด {totalWaiting} คิวรอ
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {waitingEntries.map((_, idx) => {
                    const rank = idx + 1;
                    const isSelected = targetRank === rank;
                    const isCurrent = currentRank === rank;

                    return (
                      <button
                        key={rank}
                        type="button"
                        id={`btn-target-rank-${rank}`}
                        onClick={() => setTargetRank(rank)}
                        className={`font-mono text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-900/50'
                            : isCurrent
                            ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {String(rank).padStart(2, '0')}
                        {isCurrent && <span className="text-[9px] font-sans ml-1">(เดิม)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note on displaced person */}
            {displacedEntry && (
              <div className="text-xs text-cyan-300/90 bg-cyan-950/40 border border-cyan-800/40 rounded-xl p-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  จะสลับตำแหน่งกับ <strong>{displacedEntry.employeeName}</strong>{' '}
                  (ปัจจุบันอยู่ที่ลำดับ {String(targetRank).padStart(2, '0')})
                </span>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              เหตุผลในการเลื่อนคิว <span className="text-rose-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_REASONS.map((r) => {
                const isSelected = selectedReason === r.label;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedReason(r.label)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30 shadow'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedReason === 'อื่นๆ (ระบุเอง)' && (
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="ระบุเหตุผลในการเลื่อนคิว..."
                className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Audit Log Transparency Banner */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="text-slate-300 font-semibold">
                บันทึกประวัติอัตโนมัติ (Audit Log):
              </span>
              <p>
                ระบบจะบันทึกการเลื่อนลำดับคิวนี้ พร้อมระบุชื่อผู้ดำเนินการ, ตำแหน่งเดิม,
                ตำแหน่งใหม่, เวลา และเหตุผล เพื่อความโปร่งใสของทุกฝ่าย
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              id="btn-confirm-move-queue"
              disabled={isSubmitting || !hasChanged}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-900/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <ArrowUpDown className="w-4 h-4" />
                  <span>
                    ✓ ยืนยันเลื่อนไปคิว {String(targetRank).padStart(2, '0')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
