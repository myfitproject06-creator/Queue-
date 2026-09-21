import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Employee, QueueEntry, Side } from '../types';

interface AddQueueModalProps {
  isOpen: boolean;
  side: Side | null;
  employees: Employee[];
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  onClose: () => void;
  onAdd: (employeeId: string, side: Side) => Promise<void>;
}

export const AddQueueModal: React.FC<AddQueueModalProps> = ({
  isOpen,
  side,
  employees,
  leftQueue,
  rightQueue,
  onClose,
  onAdd,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !side) return null;

  // Set of employee IDs already queued anywhere
  const queuedEmployeeIds = new Set([
    ...leftQueue.map((q) => q.employeeId),
    ...rightQueue.map((q) => q.employeeId),
  ]);

  const activeEmployees = employees.filter((e) => e.active);

  const handleSelectEmployee = async (employeeId: string) => {
    if (queuedEmployeeIds.has(employeeId)) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAdd(employeeId, side);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงคิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLeftSide = side === 'LEFT';

  return (
    <div
      id="add-queue-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="add-queue-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow ${
                isLeftSide ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isLeftSide ? '🟦' : '🟩'}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                ลงคิวพนักงานฝั่ง{' '}
                <span className={isLeftSide ? 'text-blue-400' : 'text-emerald-400'}>
                  {side} ({isLeftSide ? 'ซ้าย' : 'ขวา'})
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                ระบบจะบันทึกเวลาจริงจาก Server ทันทีที่กดเลือกชื่อ
              </p>
            </div>
          </div>
          <button
            id="close-add-queue-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Employees Grid */}
        <div className="mt-4 overflow-y-auto flex-1 pr-1">
          <div className="text-xs font-medium text-slate-400 mb-2">
            เลือกชื่อของคุณเพื่อลงคิว ({activeEmployees.length} คน):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeEmployees.map((emp) => {
              const isQueued = queuedEmployeeIds.has(emp.id);
              const queuedSide = leftQueue.some((q) => q.employeeId === emp.id)
                ? 'LEFT'
                : rightQueue.some((q) => q.employeeId === emp.id)
                ? 'RIGHT'
                : null;

              return (
                <button
                  key={emp.id}
                  id={`select-emp-${emp.id}`}
                  disabled={isQueued || isSubmitting}
                  onClick={() => handleSelectEmployee(emp.id)}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                    isQueued
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                      : isLeftSide
                      ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:bg-blue-950/40 active:scale-[0.99] cursor-pointer'
                      : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/40 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow"
                          style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                        >
                          {emp.nickname || emp.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-sm">{emp.name}</span>
                        {emp.brandCode && (
                          <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded">
                            {emp.brandCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        {emp.nickname && (
                          <span>ชื่อเล่น: {emp.nickname}</span>
                        )}
                        {emp.brand && (
                          <span className="text-slate-500">• {emp.brand}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isQueued ? (
                    <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-medium border border-slate-700">
                      อยู่ในคิว {queuedSide} แล้ว
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${
                        isLeftSide
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      + ลงคิว
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeEmployees.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              ยังไม่มีรายชื่อพนักงานในระบบ (สามารถเพิ่มรายชื่อได้ที่เมนูจัดการพนักงาน)
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* พนักงานหนึ่งคนสามารถอยู่ในคิวได้เพียง 1 ฝั่งในเวลาเดียวกัน</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
