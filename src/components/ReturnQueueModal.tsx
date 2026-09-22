import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Loader2, AlertTriangle, User, Clock } from 'lucide-react';
import { QueueEntry, MachineId } from '../types';

interface ReturnQueueModalProps {
  isOpen: boolean;
  entry: QueueEntry | null;
  machineId: MachineId;
  onClose: () => void;
  onConfirmReturn: (entryId: string, reason?: string) => Promise<void>;
}

const QUICK_REASONS = [
  'ขึ้นคิวผิด / กดผิดพลาด',
  'ลูกค้าเปลี่ยนใจ / ยังไม่พร้อม',
  'สลับตัวพนักงาน / ลูกค้าขอเปลี่ยนคน',
  'อื่น ๆ',
];

export const ReturnQueueModal: React.FC<ReturnQueueModalProps> = ({
  isOpen,
  entry,
  machineId,
  onClose,
  onConfirmReturn,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(QUICK_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(QUICK_REASONS[0]);
      setCustomReason('');
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !entry) return null;

  const handleConfirm = async () => {
    if (isSubmitting) return;

    const finalReason =
      selectedReason === 'อื่น ๆ' && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onConfirmReturn(entry.id, finalReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการคืนคิว');
      setIsSubmitting(false);
    }
  };

  const servedDuration = () => {
    if (!entry.servedAt) return null;
    const diffSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(entry.servedAt).getTime()) / 1000)
    );
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins} นาที ${secs} วินาที`;
  };

  return (
    <div
      id="return-queue-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="return-queue-modal-container"
        className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 px-5 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                คืนคิวกลับสู่คิวรอ
                <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  กรณีขึ้นผิด
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                นำคิวที่ขึ้นไปแล้วกลับคืนสู่คิวรอรับลูกค้า (Rank 01)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-return-modal"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Employee Card Preview */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3.5 shadow-inner">
            <div className="relative flex-shrink-0">
              {entry.employeeAvatarUrl ? (
                <img
                  src={entry.employeeAvatarUrl}
                  alt={entry.employeeName}
                  className="w-14 h-14 rounded-xl object-cover border border-amber-400/80 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = document.getElementById(
                      `return-fallback-avatar-${entry.id}`
                    );
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                id={`return-fallback-avatar-${entry.id}`}
                className={`w-14 h-14 rounded-xl items-center justify-center font-black text-white text-xl shadow-md border border-amber-400/80 ${
                  entry.employeeAvatarUrl ? 'hidden' : 'flex'
                }`}
                style={{ backgroundColor: entry.employeeAvatarColor || '#f59e0b' }}
              >
                {entry.employeeName.charAt(0)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white text-sm sm:text-base truncate">
                  {entry.employeeName}
                </span>
                {entry.employeeNickname && (
                  <span className="text-[11px] text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold">
                    {entry.employeeNickname}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {entry.employeeBrand && (
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                    {entry.employeeBrand}
                  </span>
                )}
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  ฝั่ง {entry.side === 'LEFT' ? 'ซ้าย (LEFT)' : 'ขวา (RIGHT)'}
                </span>
              </div>

              {servedDuration() && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span>ขึ้นคิวมาแล้ว {servedDuration()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">
                เมื่อคืนคิว พนักงานจะกลับไปอยู่ลำดับแรก (Rank 01)
              </p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                ระบบจะคืนสถานะเป็นคิวรอรับลูกค้าทันที โดยไม่ถูกส่งไปต่อท้ายแถว เพื่อป้องกันการเสียสิทธิ์กรณีขึ้นคิวผิดพลาด
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">
              สาเหตุการคืนคิว:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_REASONS.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedReason === 'อื่น ๆ' && (
              <div className="mt-1">
                <input
                  type="text"
                  placeholder="ระบุสาเหตุเพิ่มเติม..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/40 rounded-xl p-2.5">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="btn-cancel-return-queue"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            id="btn-confirm-return-queue"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/50 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังคืนคิว...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↩ ยืนยันคืนคิว</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
