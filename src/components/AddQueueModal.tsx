import React, { useState, useMemo } from 'react';
import { X, Clock, Sparkles } from 'lucide-react';
import { Employee, QueueEntry, Side } from '../types';
import { getBrandVisual } from '../constants';

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
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');

  // Set of employee IDs already queued anywhere
  const queuedEmployeeIds = useMemo(
    () =>
      new Set([
        ...leftQueue.map((q) => q.employeeId),
        ...rightQueue.map((q) => q.employeeId),
      ]),
    [leftQueue, rightQueue]
  );

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.active),
    [employees]
  );

  // Group active employees by brand for quick filter tabs
  const brandGroups = useMemo(() => {
    const map = new Map<string, { brand: string; count: number; color: string }>();
    activeEmployees.forEach((emp) => {
      const visual = getBrandVisual(emp.brand, emp.brandCode);
      const key = visual.brandCode || visual.brand;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { brand: visual.brand, count: 1, color: visual.color });
      }
    });
    return Array.from(map.entries()).map(([code, data]) => ({ code, ...data }));
  }, [activeEmployees]);

  const filteredEmployees = useMemo(() => {
    if (selectedBrandFilter === 'ALL') return activeEmployees;
    return activeEmployees.filter((emp) => {
      const visual = getBrandVisual(emp.brand, emp.brandCode);
      return (visual.brandCode || visual.brand) === selectedBrandFilter;
    });
  }, [activeEmployees, selectedBrandFilter]);

  if (!isOpen || !side) return null;

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
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow ${
                isLeftSide ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {isLeftSide ? '🔴' : '🔵'}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                ลงคิวพนักงาน{' '}
                <span className={isLeftSide ? 'text-red-400' : 'text-blue-400'}>
                  {isLeftSide ? 'ทีมแดง (LEFT)' : 'ทีมน้ำเงิน (RIGHT)'}
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
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
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

        {/* Quick Brand Filter Tabs */}
        {brandGroups.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedBrandFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                selectedBrandFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>ทั้งหมด ({activeEmployees.length})</span>
            </button>
            {brandGroups.map((g) => (
              <button
                key={g.code}
                type="button"
                onClick={() => setSelectedBrandFilter(g.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 border cursor-pointer ${
                  selectedBrandFilter === g.code
                    ? 'bg-slate-800 text-white border-white/60 shadow ring-1 ring-white/40'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: g.color }} />
                <span>{g.code}</span>
                <span className="text-[10px] opacity-75">({g.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Employees Single Column List */}
        <div className="mt-3 overflow-y-auto flex-1 pr-1">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
            <span>แตะชื่อของคุณเพื่อลงคิว ({filteredEmployees.length} คน):</span>
            <span className="text-[11px] text-slate-500">แถบสีขอบซ้ายระบุแบรนด์สังกัด</span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredEmployees.map((emp) => {
              const brandVisual = getBrandVisual(emp.brand, emp.brandCode);
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
                  style={{
                    borderLeft: `6px solid ${brandVisual.color}`,
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    isQueued
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                      : isLeftSide
                      ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:bg-blue-950/40 active:scale-[0.99] cursor-pointer shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/40 active:scale-[0.99] cursor-pointer shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          style={{ borderColor: brandVisual.color }}
                          className="w-10 h-10 rounded-xl object-cover border-2 shadow"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow border-2"
                          style={{
                            backgroundColor: emp.avatarColor || brandVisual.color,
                            borderColor: brandVisual.color,
                          }}
                        >
                          {emp.nickname || emp.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{emp.name}</span>

                        {/* Bold Brand Badge */}
                        <span
                          className={`text-[11px] font-mono font-black ${brandVisual.badgeBg} ${brandVisual.badgeText} px-2 py-0.5 rounded-md shadow-sm border border-white/20 flex items-center gap-1 flex-shrink-0`}
                          title={`แบรนด์: ${brandVisual.brand}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          <span>{brandVisual.brandCode || brandVisual.brand}</span>
                        </span>

                        {emp.nickname && (
                          <span className="text-[11px] font-medium text-amber-300 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {emp.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        {emp.brand && (
                          <span className="text-slate-300 font-medium">สังกัด: {emp.brand}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isQueued ? (
                    <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-medium border border-slate-700 flex-shrink-0">
                      อยู่ในคิว {queuedSide} แล้ว
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition flex-shrink-0 ${
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

          {filteredEmployees.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              {activeEmployees.length === 0
                ? 'ยังไม่มีรายชื่อพนักงานในระบบ (สามารถเพิ่มรายชื่อได้ที่เมนูจัดการพนักงาน)'
                : `ไม่มีพนักงานในแบรนด์ ${selectedBrandFilter}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* พนักงานหนึ่งคนสามารถอยู่ในคิวได้เพียง 1 ฝั่งในเวลาเดียวกัน</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer text-xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
