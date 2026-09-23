import React, { useState } from 'react';
import { RefreshCw, X, AlertTriangle, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { QueueEntry, MachineId } from '../types';

interface SwitchSideModalProps {
  isOpen: boolean;
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  machineId: MachineId;
  themeSwapped?: boolean;
  onClose: () => void;
  onConfirmSwitch: () => Promise<void>;
}

export const SwitchSideModal: React.FC<SwitchSideModalProps> = ({
  isOpen,
  leftQueue,
  rightQueue,
  machineId,
  themeSwapped = false,
  onClose,
  onConfirmSwitch,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmSwitch();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสลับฝั่ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftServing = leftQueue.filter((q) => q.status === 'SERVING');
  const rightServing = rightQueue.filter((q) => q.status === 'SERVING');
  const hasServing = leftServing.length > 0 || rightServing.length > 0;

  // Current side team labels
  const currentLeftTeam = themeSwapped ? '🔵 ทีมน้ำเงิน' : '🔴 ทีมแดง';
  const currentRightTeam = themeSwapped ? '🔴 ทีมแดง' : '🔵 ทีมน้ำเงิน';
  const nextLeftTeam = themeSwapped ? '🔴 ทีมแดง' : '🔵 ทีมน้ำเงิน';
  const nextRightTeam = themeSwapped ? '🔵 ทีมน้ำเงิน' : '🔴 ทีมแดง';

  return (
    <div
      id="switch-side-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="switch-side-dialog"
        className="bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl font-bold border border-amber-500/30">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-400">สลับฝั่ง (12:00 Side Switch)</h2>
              <p className="text-xs text-slate-400">
                สลับพนักงานระหว่างฝั่ง 🔴 ทีมแดง (LEFT) ↔ 🔵 ทีมน้ำเงิน (RIGHT)
              </p>
            </div>
          </div>
          <button
            id="close-switch-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Confirmation Question */}
        <div className="my-4 text-center">
          <p className="text-lg font-bold text-white">
            ต้องการสลับ Queue & Theme ทีมแดง ↔ ทีมน้ำเงิน ใช่หรือไม่?
          </p>
          <p className="text-xs text-slate-400 mt-1">
            การกดครั้งนี้จะสลับคิวพนักงานและสลับธีมประจำฝั่ง (ทีมแดง ↔ ทีมน้ำเงิน) พร้อมกันทันที
          </p>
        </div>

        {/* Theme & Queue Swap Alert Note */}
        <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center gap-2 mb-3">
          <span className="text-base">⚔️</span>
          <div>
            <strong>สลับทีมประจำฝั่งอัตโนมัติ:</strong>{' '}
            ทีมแดง (RED) และทีมน้ำเงิน (BLUE) จะสลับฝั่งหน้าจอตามคิวพนักงาน
          </div>
        </div>

        {/* Preview of Swap */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 my-4 text-xs">
          {/* Left -> Right */}
          <div className="border-r border-slate-800 pr-3">
            <div className={`font-semibold flex items-center gap-1 mb-1 ${themeSwapped ? 'text-blue-400' : 'text-red-400'}`}>
              <span>{currentLeftTeam} (คอม 1 / LEFT) [{leftQueue.length} คน]</span>
            </div>
            <div className="text-slate-400 mb-2">➔ จะย้ายไปเป็น {nextRightTeam} (คอม 2 / RIGHT):</div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {leftQueue.length > 0 ? (
                leftQueue.map((q, idx) => (
                  <div key={q.id} className="text-slate-300 truncate">
                    {idx + 1}. {q.employeeName}
                    {q.status === 'SERVING' && ' (🔥 กำลังบริการ)'}
                  </div>
                ))
              ) : (
                <span className="text-slate-600 italic">ไม่มีพนักงาน</span>
              )}
            </div>
          </div>

          {/* Right -> Left */}
          <div className="pl-2">
            <div className={`font-semibold flex items-center gap-1 mb-1 ${themeSwapped ? 'text-red-400' : 'text-blue-400'}`}>
              <span>{currentRightTeam} (คอม 2 / RIGHT) [{rightQueue.length} คน]</span>
            </div>
            <div className="text-slate-400 mb-2">➔ จะย้ายไปเป็น {nextLeftTeam} (คอม 1 / LEFT):</div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {rightQueue.length > 0 ? (
                rightQueue.map((q, idx) => (
                  <div key={q.id} className="text-slate-300 truncate">
                    {idx + 1}. {q.employeeName}
                    {q.status === 'SERVING' && ' (🔥 กำลังบริการ)'}
                  </div>
                ))
              ) : (
                <span className="text-slate-600 italic">ไม่มีพนักงาน</span>
              )}
            </div>
          </div>
        </div>

        {/* Serving preservation guarantee */}
        {hasServing && (
          <div className="p-3 bg-blue-950/50 border border-blue-600/40 rounded-xl text-xs text-blue-300 flex items-start gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>รักษาสถานะกำลังบริการ:</strong>{' '}
              พนักงานที่กำลังบริการลูกค้าอยู่ จะไม่ถูกตัดการบริการ
              และเมื่อบริการเสร็จจะกลับไปต่อท้ายคิวของฝั่งใหม่โดยอัตโนมัติ
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 mb-6 flex items-center justify-between">
          <span>ดำเนินการจาก: {machineId === 'PC_LEFT' ? 'PC กลางฝั่ง LEFT' : 'PC กลางฝั่ง RIGHT'}</span>
          <span>ป้องกันการกดซ้ำซ้อนอัตโนมัติ</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="cancel-switch-btn"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-center"
          >
            ยกเลิก
          </button>
          <button
            id="confirm-switch-sides-btn"
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'กำลังสลับฝั่ง...' : '🔄 สลับฝั่งทันที'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
