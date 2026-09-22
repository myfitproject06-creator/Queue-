import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  FileText,
  Users,
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  BarChart2,
  Shield,
  Tag,
  Settings,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { AuthorizedDevice, MachineId, Side, SideSwitchRecord, ThemePreset } from '../types';

interface HeaderProps {
  machineId: MachineId | null;
  machineSide: Side | null;
  onOpenMachineSelect: () => void;
  isConnected: boolean;
  onOpenSwitchSides: () => void;
  onOpenAuditLogs: () => void;
  onOpenEmployeeManager: () => void;
  onOpenBrandManager?: () => void;
  onOpenHandledStats: () => void;
  activeTheme?: ThemePreset;
  onOpenReset?: () => void;
  lastSwitch?: SideSwitchRecord | null;
  canUndoSwitch?: boolean;
  onUndoSwitch?: () => void;
  authorizedDevice?: AuthorizedDevice | null;
  onOpenDeviceManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  machineSide,
  onOpenMachineSelect,
  isConnected,
  onOpenSwitchSides,
  onOpenAuditLogs,
  onOpenEmployeeManager,
  onOpenBrandManager,
  onOpenHandledStats,
  onOpenReset,
  lastSwitch,
  canUndoSwitch,
  onUndoSwitch,
  authorizedDevice,
  onOpenDeviceManagement,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();

  // 12:00 Side Switch warning logic
  const isApproachingNoon = hours === 11 && minutes >= 55;
  const isNoonTime = hours === 12 && minutes <= 10;
  const minutesToNoon = isApproachingNoon ? 60 - minutes : 0;

  const timeString = currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header
      id="app-header-bar"
      className="bg-slate-950/95 text-white shadow-xl border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md transition-all"
    >
      {/* 12:00 Approaching Alert Banner */}
      {(isApproachingNoon || isNoonTime) && (
        <div
          id="noon-switch-alert-banner"
          className={`py-2 px-4 text-center font-medium flex items-center justify-center gap-3 transition-colors text-xs sm:text-sm ${
            isNoonTime
              ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
              : 'bg-amber-950/80 text-amber-200 border-b border-amber-700/50'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            {isNoonTime
              ? '🕛 ถึงเวลาสลับฝั่ง (12:00) แล้ว! กรุณากดปุ่ม "สลับฝั่ง" เพื่อสลับคิวพนักงาน LEFT ↔ RIGHT'
              : `🕛 ใกล้เวลาสลับฝั่งตอน 12:00 น. (เหลือเวลาอีกประมาณ ${minutesToNoon} นาที)`}
          </span>
          <button
            id="header-alert-switch-btn"
            onClick={onOpenSwitchSides}
            className="ml-2 bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs px-3 py-1 rounded-lg font-bold transition shadow cursor-pointer"
          >
            กดสลับฝั่งทันที
          </button>
        </div>
      )}

      <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          {/* Section 1: Logo & Machine Identity Badge */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-base text-white shadow-md shadow-blue-900/30">
                PQ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                    PAINT QUEUE
                  </h1>
                  <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                    แผนกสี
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  ระบบจัดคิว PC กลาง • ยุติธรรมตามเวลาจริง
                </p>
              </div>
            </div>

            {/* Machine Badge */}
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <button
              id="machine-identity-badge-btn"
              onClick={onOpenDeviceManagement || onOpenMachineSelect}
              title="คลิกเพื่อดูสถานะเครื่องและจัดการการเชื่อมต่อ (Device Management)"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                machineSide === 'LEFT'
                  ? 'bg-red-950/60 border-red-500/50 text-red-200 hover:bg-red-900/60 shadow-sm'
                  : machineSide === 'RIGHT'
                  ? 'bg-blue-950/60 border-blue-500/50 text-blue-200 hover:bg-blue-900/60 shadow-sm'
                  : 'bg-amber-950/60 border-amber-600 text-amber-300 hover:bg-amber-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {authorizedDevice?.deviceId
                  ? `${machineSide === 'LEFT' ? '🔴 ทีมแดง' : '🔵 ทีมน้ำเงิน'} (${authorizedDevice.deviceId})`
                  : machineSide === 'LEFT'
                  ? '🔴 ทีมแดง (PC_LEFT)'
                  : machineSide === 'RIGHT'
                  ? '🔵 ทีมน้ำเงิน (PC_RIGHT)'
                  : '⚠️ ยังไม่เลือกฝั่ง'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-600/60 px-1.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </button>
          </div>

          {/* Section 2: Synchronized Clock & Central Server Sync */}
          <div className="hidden md:flex items-center gap-3 bg-slate-900/70 border border-slate-800/90 px-3.5 py-1.5 rounded-xl">
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-slate-100 flex items-center gap-1.5 justify-center tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeString}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{dateString}</div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="flex items-center gap-1 text-[11px]">
              {isConnected ? (
                <div
                  id="network-status-connected"
                  className="flex items-center gap-1.5 text-emerald-400 font-medium"
                  title="เชื่อมต่อระบบกลาง Real-time"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline text-slate-300">ระบบกลางเชื่อมต่อ</span>
                </div>
              ) : (
                <div
                  id="network-status-disconnected"
                  className="flex items-center gap-1.5 text-rose-400 font-medium animate-pulse"
                  title="ไม่สามารถเชื่อมต่อระบบกลาง"
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>ตัดการเชื่อมต่อ</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Clean, Organized Action Bar */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Undo Switch button if active */}
            {canUndoSwitch && onUndoSwitch && (
              <button
                id="undo-switch-btn"
                onClick={onUndoSwitch}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 text-xs font-semibold px-2.5 py-2 rounded-xl transition cursor-pointer"
                title="ย้อนกลับการสลับฝั่ง (ภายใน 60 วินาที)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ย้อนการสลับ</span>
              </button>
            )}

            {/* Daily Operational CTA: Switch Sides */}
            <button
              id="header-switch-sides-btn"
              onClick={onOpenSwitchSides}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition text-xs sm:text-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🔄 สลับฝั่ง (12:00)</span>
            </button>

            {/* Daily Handled Stats */}
            <button
              id="header-handled-stats-btn"
              onClick={onOpenHandledStats}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 font-medium px-3 py-2 rounded-xl transition text-xs sm:text-sm cursor-pointer shadow-sm"
              title="ดูกราฟยอดบริการสำเร็จต่อพนักงานวันนี้"
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">กราฟยอดวันนี้</span>
            </button>

            {/* Audit Logs */}
            <button
              id="header-audit-log-btn"
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700 font-medium px-3 py-2 rounded-xl transition text-xs sm:text-sm cursor-pointer shadow-sm"
              title="ดูประวัติการลงคิวและสลับฝั่ง"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">ประวัติ</span>
            </button>

            {/* Clean System Settings & Management Dropdown */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                id="header-settings-menu-btn"
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer shadow-sm ${
                  isSettingsOpen
                    ? 'bg-slate-800 text-white border-slate-600 ring-2 ring-blue-500/30'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="จัดการระบบ: พนักงาน, แบรนด์สี, จับคู่เครื่อง, รีเซ็ต"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">จัดการระบบ</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isSettingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSettingsOpen && (
                <div
                  id="header-settings-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    การจัดการและตั้งค่า
                  </div>

                  {/* Staff Manager */}
                  <button
                    id="header-employee-mgr-btn"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenEmployeeManager();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition text-left cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold">รายชื่อพนักงาน</div>
                      <div className="text-[10px] text-slate-400">เพิ่ม/แก้ไขชื่อและรูปภาพ</div>
                    </div>
                  </button>

                  {/* Brand Manager */}
                  {onOpenBrandManager && (
                    <button
                      id="header-brand-mgr-btn"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenBrandManager();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition text-left cursor-pointer"
                    >
                      <Tag className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-semibold">แบรนด์สี</div>
                        <div className="text-[10px] text-slate-400">จัดการ 9 แบรนด์และสี</div>
                      </div>
                    </button>
                  )}

                  {/* Device Management */}
                  {onOpenDeviceManagement && (
                    <button
                      id="header-device-mgmt-btn"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenDeviceManagement();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition text-left cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold">การเชื่อมต่อเครื่อง</div>
                        <div className="text-[10px] text-slate-400">Pairing & Authorization</div>
                      </div>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-800" />

                  {/* System Reset */}
                  {onOpenReset && (
                    <button
                      id="header-reset-btn"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenReset();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition text-left cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-semibold text-rose-300">รีเซ็ตระบบ</div>
                        <div className="text-[10px] text-slate-400">ล้างคิวประจำวัน หรือล้างข้อมูล</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last switch timestamp info */}
        {lastSwitch && (
          <div className="mt-1.5 text-right text-[11px] text-slate-400">
            สลับฝั่งล่าสุด:{' '}
            <span className="text-slate-300 font-mono">
              {new Date(lastSwitch.switchedAt).toLocaleTimeString('th-TH')} น.
            </span>{' '}
            (โดย {lastSwitch.machineId === 'PC_LEFT' ? 'PC ฝั่ง LEFT' : 'PC ฝั่ง RIGHT'})
          </div>
        )}
      </div>
    </header>
  );
};
