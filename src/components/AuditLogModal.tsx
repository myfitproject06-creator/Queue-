import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Search,
  Calendar,
  Filter,
  ArrowRight,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AuditActionType, AuditLogEntry } from '../types';
import { fetchWithAuth } from '../api';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let dateQuery = '';
      if (dateFilter === 'today') {
        dateQuery = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        dateQuery = d.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        dateQuery = customDate;
      }

      const params = new URLSearchParams();
      if (dateQuery) params.append('date', dateQuery);
      if (searchTerm.trim()) params.append('employeeName', searchTerm.trim());
      if (actionFilter !== 'ALL') params.append('action', actionFilter);
      params.append('limit', '300');

      const res = await fetchWithAuth(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, dateFilter, customDate, actionFilter]);

  if (!isOpen) return null;

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'ENQUEUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/40">
            ➕ ลงคิว
          </span>
        );
      case 'START_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-600/40">
            ▶ เริ่มบริการลูกค้า
          </span>
        );
      case 'COMPLETE_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40">
            ✓ จบลูกค้า (ต่อท้ายคิว)
          </span>
        );
      case 'RETURN_QUEUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
            ↩ คืนคิว (ขึ้นผิด)
          </span>
        );
      case 'REMOVE_QUEUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/40">
            ❌ เอาออกจากคิว
          </span>
        );
      case 'MOVE_QUEUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            ↕️ เลื่อนลำดับคิว
          </span>
        );
      case 'SWITCH_SIDES':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40">
            🔄 สลับฝั่ง (12:00)
          </span>
        );
      case 'UNDO_SWITCH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-600/40">
            ↩️ ย้อนกลับการสลับ
          </span>
        );
      case 'EMPLOYEE_ADDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-600/40">
            👥 เพิ่มพนักงาน
          </span>
        );
      case 'EMPLOYEE_REMOVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/40">
            👤 ลบพนักงาน
          </span>
        );
      case 'DEVICE_REGISTERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/50">
            🔑 ลงทะเบียนเครื่อง
          </span>
        );
      case 'DEVICE_REVOKED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50">
            🚫 ถอนสิทธิ์เครื่อง
          </span>
        );
      case 'UNAUTHORIZED_ACCESS':
      case 'UNAUTHORIZED_API_REQUEST':
      case 'DEVICE_AUTH_FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/50">
            🛡️ ตรวจพบผู้ไม่ได้รับอนุญาต
          </span>
        );
      case 'SYSTEM_RESET':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            ⚙️ ระบบ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {action}
          </span>
        );
    }
  };

  return (
    <div
      id="audit-log-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="audit-log-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col text-white animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xl font-bold">
              📜
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ประวัติการทำงานและ Audit Log
                <span className="text-xs bg-slate-800 text-slate-300 font-normal px-2 py-0.5 rounded border border-slate-700">
                  {logs.length} รายการ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ตรวจสอบย้อนหลัง: ใครทำอะไร ที่ฝั่งไหน เมื่อไหร่ จากเครื่องใด (ห้ามและไม่สามารถลบได้)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-logs-btn"
              onClick={fetchLogs}
              title="รีเฟรชข้อมูล"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-audit-log-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          {/* Date Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="filter-date-today"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              วันนี้
            </button>
            <button
              id="filter-date-yesterday"
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              เมื่อวาน
            </button>
            <button
              id="filter-date-all"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด
            </button>
            <div className="flex items-center gap-1 pl-1 pr-2 border-l border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                id="filter-custom-date"
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Search & Action Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="audit-search-input"
                type="text"
                placeholder="ค้นหาชื่อพนักงาน, เหตุผล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              id="audit-action-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">ทุกเหตุการณ์</option>
              <option value="ENQUEUE">ลงคิว</option>
              <option value="START_SERVICE">เริ่มบริการ (ขึ้นคิว)</option>
              <option value="RETURN_QUEUE">คืนคิว (กรณีขึ้นผิด)</option>
              <option value="COMPLETE_SERVICE">จบลูกค้า</option>
              <option value="MOVE_QUEUE">เลื่อนลำดับคิว</option>
              <option value="REMOVE_QUEUE">เอาออกจากคิว</option>
              <option value="SWITCH_SIDES">สลับฝั่ง 12:00</option>
              <option value="UNDO_SWITCH">ย้อนการสลับ</option>
            </select>
          </div>
        </div>

        {/* Logs List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              กำลังโหลดประวัติ Audit Log...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              ไม่พบประวัติเหตุการณ์ตามเงื่อนไขที่เลือก
            </div>
          ) : (
            logs.map((log) => {
              const time = new Date(log.timestamp);
              const timeFormatted = time.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const dateFormatted = time.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={log.id}
                  id={`log-item-${log.id}`}
                  className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  {/* Left: Time + Action + Employee */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Timestamp */}
                    <div className="font-mono text-slate-400 text-center min-w-[75px] bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 flex-shrink-0">
                      <div className="text-white font-bold">{timeFormatted}</div>
                      <div className="text-[10px] text-slate-500">{dateFormatted}</div>
                    </div>

                    {/* Action & Employee */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}

                        {log.employeeName && (
                          <span className="font-bold text-white text-sm">
                            {log.employeeName}
                          </span>
                        )}

                        {log.side && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              log.side === 'LEFT'
                                ? 'bg-blue-950 text-blue-300 border-blue-800'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            ฝั่ง {log.side}
                          </span>
                        )}
                      </div>

                      {/* Details / Reason */}
                      <div className="text-slate-300">
                        {log.reason && (
                          <span className="text-rose-300 font-medium mr-2">
                            เหตุผล: {log.reason}
                          </span>
                        )}
                        {log.details && (
                          <span className="text-slate-400">{log.details}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Machine Identity */}
                  <div className="self-end sm:self-center text-right flex-shrink-0">
                    <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">
                      {log.machineId === 'PC_LEFT'
                        ? '🟦 PC กลาง LEFT'
                        : log.machineId === 'PC_RIGHT'
                        ? '🟩 PC กลาง RIGHT'
                        : log.machineId}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Audit Log ป้องกันการแก้ไขหรือลบ เพื่อความโปร่งใสและยุติธรรมในการจัดคิว</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
