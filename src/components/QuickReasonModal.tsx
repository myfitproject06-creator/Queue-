import React, { useState } from 'react';
import { AlertCircle, X, Check, ArrowRight } from 'lucide-react';
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
  const [selectedKey, setSelectedKey] = useState<QuickReasonKey | null>(null);
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const handleQuickSelect = async (key: QuickReasonKey, label: string) => {
    if (key === 'OTHER') {
      setSelectedKey('OTHER');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmRemove(entry.id, label);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำออกจากคิว');
      setIsSubmitting(false);
    }
  };

  const handleSubmitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmRemove(entry.id, 'อื่น ๆ', customText.trim());
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำออกจากคิว');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedKey(null);
    setCustomText('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      id="quick-reason-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="quick-reason-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xl font-bold">
              ❌
            </div>
            <div>
              <h2 className="text-lg font-bold">นำพนักงานออกจากคิว</h2>
              <p className="text-xs text-slate-400">
                พนักงาน:{' '}
                <span className="text-white font-semibold">{entry.employeeName}</span> (ฝั่ง{' '}
                {entry.side === 'LEFT' ? '🟦 LEFT' : '🟩 RIGHT'})
              </p>
            </div>
          </div>
          <button
            id="close-quick-reason-btn"
            onClick={handleClose}
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

        <div className="mt-4">
          <p className="text-xs text-slate-400 mb-3">
            กดเลือกเหตุผลด้านล่าง (ระบบบันทึกทันที เพื่อความรวดเร็วในการทำงาน):
          </p>

          {/* Quick Reasons Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_REASONS.map((item) => {
              const isOther = item.key === 'OTHER';
              const isSelected = selectedKey === item.key;

              return (
                <button
                  key={item.key}
                  id={`quick-reason-${item.key.toLowerCase()}`}
                  disabled={isSubmitting}
                  onClick={() => handleQuickSelect(item.key, item.label)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-500 active:scale-[0.98]'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400">
                      {isOther ? 'เปิดช่องพิมพ์' : 'กดแล้วจบเลย'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom text field if OTHER selected */}
          {selectedKey === 'OTHER' && (
            <form onSubmit={handleSubmitCustom} className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ระบุเหตุผลเพิ่มเติม:
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-reason-input"
                  type="text"
                  placeholder="เช่น ไปส่งของให้ลูกค้า, ไปเบิกสี..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={!customText.trim() || isSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <span>ยืนยัน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Audit Notice */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>ไม่ลบประวัติ:</strong> พนักงานจะถูกนำออกจากคิวปัจจุบันทันที แต่ระบบจะบันทึกว่าใครถูกนำออก
            เวลาใด เหตุผลใด และทำรายการจากเครื่องไหนใน Audit Log ตรวจสอบได้ตลอดเวลา
          </span>
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
