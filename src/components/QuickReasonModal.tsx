import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { QueueEntry, QuickReasonKey } from '../types';
import { QUICK_REASONS } from '../constants';

interface QuickReasonModalProps {
  isOpen: boolean;
  entry: QueueEntry | null;
  onClose: () => void;
  onConfirmRemove: (entryId: string, reasonKey: string, reasonText?: string) => Promise<void>;
}

export const QuickReasonModal: React.FC<QuickReasonModalProps> = ({
  isOpen,
  entry,
  onClose,
  onConfirmRemove,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setShowCustomInput(false);
      setCustomText('');
      setIsSubmitting(false);
      setSubmittingKey(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !entry) return null;

  // Handles clicking any quick reason card - IMMEDIATELY removes the employee!
  const handleQuickSelect = async (key: QuickReasonKey, label: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmittingKey(key);
    setErrorMsg(null);

    // Timeout safety so UI never gets stuck
    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmittingKey(null);
      setErrorMsg('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
    }, 8000);

    try {
      // Use clean label for reason
      const effectiveLabel = key === 'OTHER' ? 'อื่น ๆ' : label;
      await onConfirmRemove(entry.id, effectiveLabel);
      window.clearTimeout(timeoutId);
      handleClose();
    } catch (err: any) {
      window.clearTimeout(timeoutId);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำออกจากคิว กรุณาลองใหม่');
      setIsSubmitting(false);
      setSubmittingKey(null);
    }
  };

  // Handles submitting custom typed reason
  const handleSubmitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedText = customText.trim();
    setIsSubmitting(true);
    setSubmittingKey('CUSTOM_SUBMIT');
    setErrorMsg(null);

    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmittingKey(null);
      setErrorMsg('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
    }, 8000);

    try {
      await onConfirmRemove(
        entry.id,
        'อื่น ๆ (ระบุเอง)',
        trimmedText || 'ไม่ระบุรายละเอียด'
      );
      window.clearTimeout(timeoutId);
      handleClose();
    } catch (err: any) {
      window.clearTimeout(timeoutId);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำออกจากคิว');
      setIsSubmitting(false);
      setSubmittingKey(null);
    }
  };

  const handleClose = () => {
    setShowCustomInput(false);
    setCustomText('');
    setErrorMsg(null);
    setIsSubmitting(false);
    setSubmittingKey(null);
    onClose();
  };

  return (
    <div
      id="quick-reason-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div
        id="quick-reason-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
              ❌
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>นำพนักงานออกจากคิว</span>
              </h2>
              <p className="text-xs text-slate-400">
                พนักงาน:{' '}
                <span className="text-white font-bold">{entry.employeeName}</span>{' '}
                {entry.employeeNickname && (
                  <span className="text-amber-300">({entry.employeeNickname})</span>
                )}{' '}
                {entry.employeeBrandCode && (
                  <span className="text-rose-300 font-mono">[{entry.employeeBrandCode}]</span>
                )}{' '}
                <span className="text-slate-500">•</span> ฝั่ง{' '}
                <span className={entry.side === 'LEFT' ? 'text-blue-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {entry.side === 'LEFT' ? '🟦 LEFT (ซ้าย)' : '🟩 RIGHT (ขวา)'}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-quick-reason-btn"
            disabled={isSubmitting}
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/90 border border-rose-600/60 text-rose-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
            <span>แตะเลือกเหตุผล (กดปุ่มแล้วนำออกทันที):</span>
            {isSubmitting && (
              <span className="text-rose-400 font-normal flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                กำลังนำออกจากคิว...
              </span>
            )}
          </p>

          {/* Quick Reasons Grid - All 6 buttons trigger removal immediately on single click! */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_REASONS.map((item) => {
              const isThisSubmitting = submittingKey === item.key;

              return (
                <button
                  type="button"
                  key={item.key}
                  id={`quick-reason-${item.key.toLowerCase()}`}
                  disabled={isSubmitting}
                  onClick={() => handleQuickSelect(item.key, item.label)}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    isThisSubmitting
                      ? 'bg-rose-950/80 border-rose-500 shadow-md ring-2 ring-rose-500/50'
                      : 'bg-slate-800/90 border-slate-700 hover:bg-rose-950/30 hover:border-rose-500/60 active:scale-[0.98]'
                  } ${isSubmitting && !isThisSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-2xl flex-shrink-0">
                    {isThisSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                    ) : (
                      item.icon
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {isThisSubmitting ? 'กำลังนำออก...' : '⚡ กดเพื่อนำออกทันที'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Toggle Custom Text Reason */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="btn-toggle-custom-reason"
              disabled={isSubmitting}
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition font-medium cursor-pointer"
            >
              {showCustomInput ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>หรือต้องการพิมพ์ระบุเหตุผลเองเพิ่มเติม...</span>
            </button>

            {showCustomInput && (
              <form
                onSubmit={handleSubmitCustom}
                className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-150"
              >
                <input
                  id="custom-reason-input"
                  type="text"
                  placeholder="เช่น ไปส่งของให้ลูกค้า, ไปเบิกสี หรือปล่อยว่างได้..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow"
                >
                  {submittingKey === 'CUSTOM_SUBMIT' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>ยืนยันนำออก</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Audit Notice */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>บันทึกลง Audit Log:</strong> ระบบจะบันทึกชื่อพนักงาน เวลาที่นำออก เหตุผล และเครื่องที่ทำรายการไว้ในระบบตรวจสอบได้ตลอดเวลา
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 font-medium"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
