import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Check, X, ShieldAlert, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { MachineId } from '../types';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: MachineId;
  onResetQueueOnly: () => Promise<void>;
  onResetAllExceptTheme: () => Promise<void>;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  machineId,
  onResetQueueOnly,
  onResetAllExceptTheme,
}) => {
  const [selectedMode, setSelectedMode] = useState<'QUEUE_ONLY' | 'ALL_EXCEPT_THEME'>('QUEUE_ONLY');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (selectedMode === 'ALL_EXCEPT_THEME' && confirmText.trim().toUpperCase() !== 'RESET') {
      setErrorMsg('กรุณาพิมพ์คำว่า RESET เพื่อยืนยันการล้างข้อมูลทั้งหมด');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (selectedMode === 'QUEUE_ONLY') {
        await onResetQueueOnly();
      } else {
        await onResetAllExceptTheme();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ต');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="reset-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="reset-modal-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-white animate-in zoom-in-95 duration-150 relative overflow-hidden"
      >
        {/* Top Warning Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl shadow">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                รีเซ็ตระบบ (System Reset)
              </h2>
              <p className="text-xs text-slate-400">
                เลือกรูปแบบการรีเซ็ตที่ต้องการทำงาน
              </p>
            </div>
          </div>
          <button
            id="close-reset-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Selector Cards */}
        <div className="mt-5 space-y-3">
          {/* Mode 1: Reset Queue Only */}
          <div
            id="reset-option-queue-only"
            onClick={() => {
              setSelectedMode('QUEUE_ONLY');
              setErrorMsg(null);
            }}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
              selectedMode === 'QUEUE_ONLY'
                ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-950/50'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                    selectedMode === 'QUEUE_ONLY'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">
                      รีเซ็ตคิวเฉยๆ (Reset Queue Only)
                    </h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-400/30">
                      แนะนำประจำวัน
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ล้างเฉพาะคิวรอและคิวบริการฝั่งซ้ายและขวาให้เป็น 0
                  </p>
                  <ul className="text-[11px] text-slate-400 mt-2 space-y-0.5 list-disc list-inside">
                    <li>รายชื่อพนักงานและรูปภาพโปรไฟล์ยังคงอยู่ครบ</li>
                    <li>รายชื่อแบรนด์และการตั้งค่าทั้งหมดไม่เปลี่ยนแปลง</li>
                    <li>การจับคู่เครื่อง (Device Pairing) ยังคงอยู่</li>
                  </ul>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  selectedMode === 'QUEUE_ONLY'
                    ? 'border-blue-400 bg-blue-500 text-white'
                    : 'border-slate-600'
                }`}
              >
                {selectedMode === 'QUEUE_ONLY' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Mode 2: Reset All Except Theme */}
          <div
            id="reset-option-all-except-theme"
            onClick={() => {
              setSelectedMode('ALL_EXCEPT_THEME');
              setErrorMsg(null);
            }}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
              selectedMode === 'ALL_EXCEPT_THEME'
                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/50'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                    selectedMode === 'ALL_EXCEPT_THEME'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-rose-300">
                      รีเซ็ตระบบเริ่มต้นใหม่ (Reset All System Data)
                    </h3>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-400/30">
                      ล้างข้อมูลพนักงาน
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ล้างคิวและรายชื่อพนักงานทั้งหมด เพื่อเริ่มตั้งค่าใหม่
                  </p>
                  <ul className="text-[11px] text-slate-400 mt-2 space-y-0.5 list-disc list-inside">
                    <li>ล้างรายชื่อพนักงานทั้งหมด (เพื่อเพิ่มชื่อจริงของสาขาใหม่)</li>
                    <li>คืนค่าแบรนด์สีเริ่มต้น (9 แบรนด์มาตรฐาน) และสามารถแก้ไขได้</li>
                    <li>เมื่อตั้งชื่อคนหรือแบรนด์ใหม่แล้ว จะถูกบันทึกคงอยู่ถาวร</li>
                    <li className="text-emerald-400 font-semibold">
                      การจับคู่เครื่อง (Device Pairing) จะยังคงอยู่ ไม่ต้อง Pair ใหม่
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  selectedMode === 'ALL_EXCEPT_THEME'
                    ? 'border-rose-400 bg-rose-500 text-white'
                    : 'border-slate-600'
                }`}
              >
                {selectedMode === 'ALL_EXCEPT_THEME' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Confirmation for Mode 2 */}
        {selectedMode === 'ALL_EXCEPT_THEME' && (
          <div className="mt-4 p-4 bg-rose-950/60 border border-rose-600/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>ยืนยันความปลอดภัย: พิมพ์คำว่า RESET ในช่องด้านล่าง</span>
            </div>
            <input
              id="reset-confirm-input"
              type="text"
              placeholder="พิมพ์คำว่า RESET"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-slate-950 border border-rose-700/60 rounded-xl px-3.5 py-2 text-sm font-mono text-center font-bold text-white focus:outline-none focus:border-rose-500 uppercase tracking-widest"
            />
          </div>
        )}

        {/* Actions Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs sm:text-sm transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            id="confirm-reset-execute-btn"
            type="button"
            onClick={handleExecuteReset}
            disabled={
              isSubmitting ||
              (selectedMode === 'ALL_EXCEPT_THEME' && confirmText.trim().toUpperCase() !== 'RESET')
            }
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMode === 'QUEUE_ONLY'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : selectedMode === 'QUEUE_ONLY' ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>ยืนยันรีเซ็ตเฉพาะคิว</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันรีเซ็ตทั้งหมดยกเว้นธีม</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
