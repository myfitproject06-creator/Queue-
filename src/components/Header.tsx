import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FileText,
  Users,
  Monitor,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Clock,
  BarChart2,
  Shield,
} from 'lucide-react';
import { AuthorizedDevice, MachineId, Side, SideSwitchRecord } from '../types';

interface HeaderProps {
  machineId: MachineId | null;
  machineSide: Side | null;
  onOpenMachineSelect: () => void;
  isConnected: boolean;
  onOpenSwitchSides: () => void;
  onOpenAuditLogs: () => void;
  onOpenEmployeeManager: () => void;
  onOpenHandledStats: () => void;
  lastSwitch?: SideSwitchRecord | null;
  canUndoSwitch?: boolean;
  onUndoSwitch?: () => void;
  authorizedDevice?: AuthorizedDevice | null;
  onOpenDeviceManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  machineId,
  machineSide,
  onOpenMachineSelect,
  isConnected,
  onOpenSwitchSides,
  onOpenAuditLogs,
  onOpenEmployeeManager,
  onOpenHandledStats,
  lastSwitch,
  canUndoSwitch,
  onUndoSwitch,
  authorizedDevice,
  onOpenDeviceManagement,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // 12:00 Side Switch warning logic
  // Rule 15: approx 5 mins before 12:00 show notification "🕛 ใกล้เวลาสลับฝั่ง อีก 5 นาที"
  // At 12:00: "ถึงเวลาสลับฝั่ง"
  const isApproachingNoon = hours === 11 && minutes >= 55;
  const isNoonTime = hours === 12 && minutes <= 10;
  const minutesToNoon = isApproachingNoon ? 60 - minutes : 0;

  const timeString = currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      {/* 12:00 Approaching Alert Banner */}
      {(isApproachingNoon || isNoonTime) && (
        <div
          id="noon-switch-alert-banner"
          className={`py-2.5 px-4 text-center font-medium flex items-center justify-center gap-3 transition-colors ${
            isNoonTime
              ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
              : 'bg-amber-900/80 text-amber-200 border-b border-amber-700/50'
          }`}
        >
          <Clock className="w-5 h-5 flex-shrink-0" />
          <span>
            {isNoonTime
              ? '🕛 ถึงเวลาสลับฝั่ง (12:00) แล้ว! กรุณากดปุ่ม "สลับฝั่ง" เพื่อสลับคิวพนักงาน LEFT ↔ RIGHT'
              : `🕛 ใกล้เวลาสลับฝั่งตอน 12:00 น. (เหลือเวลาอีกประมาณ ${minutesToNoon} นาที)`}
          </span>
          <button
            id="header-alert-switch-btn"
            onClick={onOpenSwitchSides}
            className="ml-2 bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs px-3 py-1.5 rounded-md font-bold transition shadow"
          >
            กดสลับฝั่งทันที
          </button>
        </div>
      )}

      <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Brand & Machine Identity */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center font-black text-xl text-white shadow-inner">
                PQ
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                  PAINT QUEUE
                  <span className="text-xs bg-slate-800 text-slate-300 font-normal px-2 py-0.5 rounded border border-slate-700">
                    แผนกสี
                  </span>
                </h1>
                <p className="text-xs text-slate-400">ระบบจัดคิว PC กลาง • ยุติธรรมตามเวลาจริง</p>
              </div>
            </div>

            {/* Machine Badge */}
            <div className="flex items-center gap-2">
              <button
                id="machine-identity-badge-btn"
                onClick={onOpenDeviceManagement || onOpenMachineSelect}
                title="คลิกเพื่อดูสถานะเครื่องและจัดการการเชื่อมต่อ (Device Management)"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-sm transition cursor-pointer ${
                  machineSide === 'LEFT'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 hover:bg-blue-900 shadow-sm shadow-blue-500/20'
                    : machineSide === 'RIGHT'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-950 border-amber-600 text-amber-300 hover:bg-amber-900 animate-pulse'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>
                  {authorizedDevice?.deviceId
                    ? `${machineSide === 'LEFT' ? '🟦' : '🟩'} ${authorizedDevice.deviceId}`
                    : machineSide === 'LEFT'
                    ? '🟦 เครื่องฝั่ง LEFT (ซ้าย)'
                    : machineSide === 'RIGHT'
                    ? '🟩 เครื่องฝั่ง RIGHT (ขวา)'
                    : '⚠️ ยังไม่ได้เลือกฝั่ง'}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-700/80 px-1.5 py-0.5 rounded ml-1">
                  🟢 AUTHORIZED
                </span>
              </button>
            </div>
          </div>

          {/* Central Synchronized Clock & Network Status */}
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 px-4 py-1.5 rounded-xl">
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-white tracking-wider flex items-center gap-1.5 justify-center">
                <Clock className="w-4 h-4 text-slate-400" />
                {timeString}
              </div>
              <div className="text-[11px] text-slate-400">{dateString}</div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5 text-xs">
              {isConnected ? (
                <div
                  id="network-status-connected"
                  className="flex items-center gap-1.5 text-emerald-400 font-medium"
                  title="เชื่อมต่อฐานข้อมูลระบบกลาง Real-time"
                >
                  <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">ระบบกลาง Online</span>
                </div>
              ) : (
                <div
                  id="network-status-disconnected"
                  className="flex items-center gap-1.5 text-rose-400 font-medium animate-pulse"
                  title="ไม่สามารถเชื่อมต่อระบบกลาง"
                >
                  <WifiOff className="w-4 h-4" />
                  <span>🔴 ตัดการเชื่อมต่อ</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            {/* Undo Switch button if active */}
            {canUndoSwitch && onUndoSwitch && (
              <button
                id="undo-switch-btn"
                onClick={onUndoSwitch}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 text-xs font-semibold px-3 py-2 rounded-lg transition"
                title="ย้อนกลับการสลับฝั่ง (ภายใน 60 วินาที)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ย้อนการสลับ</span>
              </button>
            )}

            {/* Switch Sides Button (Big, prominent) */}
            <button
              id="header-switch-sides-btn"
              onClick={onOpenSwitchSides}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition text-sm sm:text-base cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>🔄 สลับฝั่ง</span>
            </button>

            {/* Daily Handled Stats Chart Button */}
            <button
              id="header-handled-stats-btn"
              onClick={onOpenHandledStats}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-medium px-3.5 py-2.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
              title="ดูกราฟยอดบริการสำเร็จต่อพนักงานวันนี้"
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>📊 กราฟยอดวันนี้</span>
            </button>

            {/* History / Audit Log Button */}
            <button
              id="header-audit-log-btn"
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-3.5 py-2.5 rounded-xl transition text-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>📜 ประวัติ</span>
            </button>

            {/* Staff Manager */}
            <button
              id="header-employee-mgr-btn"
              onClick={onOpenEmployeeManager}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium px-3 py-2.5 rounded-xl transition text-xs cursor-pointer"
              title="จัดการรายชื่อพนักงาน"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">พนักงาน</span>
            </button>

            {/* Device Management Button */}
            {onOpenDeviceManagement && (
              <button
                id="header-device-mgmt-btn"
                onClick={onOpenDeviceManagement}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium px-3 py-2.5 rounded-xl transition text-xs cursor-pointer"
                title="จัดการเครื่อง / ถอนการจับคู่ (Device Management)"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">จัดการเครื่อง</span>
              </button>
            )}
          </div>
        </div>

        {/* Last switch timestamp info */}
        {lastSwitch && (
          <div className="mt-2 text-right text-[11px] text-slate-400">
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
