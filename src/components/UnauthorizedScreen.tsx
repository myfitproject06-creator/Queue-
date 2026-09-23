import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Monitor,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { Side } from '../types';

interface UnauthorizedScreenProps {
  registeredDevices: {
    side: Side;
    deviceId?: string;
    status: 'AUTHORIZED' | 'REVOKED' | 'NOT_REGISTERED';
    lastSeenAt?: string;
  }[];
  themeSwapped?: boolean;
  onOpenPairModal: () => void;
  onRefresh: () => void;
  isChecking: boolean;
  onRevokedSuccess?: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
  registeredDevices,
  themeSwapped = false,
  onOpenPairModal,
  onRefresh,
  isChecking,
  onRevokedSuccess,
}) => {
  const leftDevice = registeredDevices.find((d) => d.side === 'LEFT');
  const rightDevice = registeredDevices.find((d) => d.side === 'RIGHT');

  // Team configurations based on themeSwapped
  // Default: LEFT = 🔴 ทีมแดง (คอม 1), RIGHT = 🔵 ทีมน้ำเงิน (คอม 2)
  // Swapped: LEFT = 🔵 ทีมน้ำเงิน (คอม 1), RIGHT = 🔴 ทีมแดง (คอม 2)
  const leftTeam = themeSwapped
    ? {
        name: 'ทีมน้ำเงิน (BLUE)',
        icon: '🔵',
        color: 'blue',
        bgActive: 'bg-blue-950/30 border-blue-600/60 shadow-blue-900/20',
        textAccent: 'text-blue-400',
        badgeBg: 'bg-blue-950/80 border-blue-700/60 text-blue-300',
        dotColor: 'bg-blue-400',
        desc: 'คอม 1 (ฝั่งซ้าย - LEFT)',
      }
    : {
        name: 'ทีมแดง (RED)',
        icon: '🔴',
        color: 'red',
        bgActive: 'bg-rose-950/30 border-rose-600/60 shadow-rose-900/20',
        textAccent: 'text-rose-400',
        badgeBg: 'bg-rose-950/80 border-rose-700/60 text-rose-300',
        dotColor: 'bg-rose-400',
        desc: 'คอม 1 (ฝั่งซ้าย - LEFT)',
      };

  const rightTeam = themeSwapped
    ? {
        name: 'ทีมแดง (RED)',
        icon: '🔴',
        color: 'red',
        bgActive: 'bg-rose-950/30 border-rose-600/60 shadow-rose-900/20',
        textAccent: 'text-rose-400',
        badgeBg: 'bg-rose-950/80 border-rose-700/60 text-rose-300',
        dotColor: 'bg-rose-400',
        desc: 'คอม 2 (ฝั่งขวา - RIGHT)',
      }
    : {
        name: 'ทีมน้ำเงิน (BLUE)',
        icon: '🔵',
        color: 'blue',
        bgActive: 'bg-blue-950/30 border-blue-600/60 shadow-blue-900/20',
        textAccent: 'text-blue-400',
        badgeBg: 'bg-blue-950/80 border-blue-700/60 text-blue-300',
        dotColor: 'bg-blue-400',
        desc: 'คอม 2 (ฝั่งขวา - RIGHT)',
      };

  // State for revoking an existing device
  const [revokeModalDevice, setRevokeModalDevice] = useState<{
    deviceId: string;
    side: Side;
    teamName: string;
  } | null>(null);
  const [revokePairingCode, setRevokePairingCode] = useState('');
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeModalDevice || !revokePairingCode.trim()) return;

    setRevokeSubmitting(true);
    setRevokeError(null);

    try {
      const res = await fetch('/api/auth/revoke-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: revokeModalDevice.deviceId,
          pairingCode: revokePairingCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถถอนสิทธิ์เครื่องได้');
      }

      setRevokeModalDevice(null);
      setRevokePairingCode('');
      if (onRevokedSuccess) onRevokedSuccess();
      onRefresh();
    } catch (err: any) {
      setRevokeError(err.message || 'เกิดข้อผิดพลาดในการถอนสิทธิ์');
    } finally {
      setRevokeSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-600 to-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-rose-900/30 text-lg">
            PQ
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              PAINT QUEUE
              <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-mono font-medium">
                MACHINE LOCK ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">ระบบรักษาความปลอดภัยเครื่องกลาง แผนกสี</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>อุปกรณ์ไม่ได้รับอนุญาต (UNAUTHORIZED)</span>
          </div>
        </div>
      </header>

      {/* Main Lock Screen Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Shield Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              อุปกรณ์นี้ไม่ได้รับอนุญาตให้ใช้งาน
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md">
              ระบบ PAINT QUEUE ถูกจำกัดให้เข้าถึงและใช้งานได้เฉพาะ{' '}
              <strong className="text-slate-200">คอมพิวเตอร์กลาง 2 เครื่อง</strong> ของแผนกสีเท่านั้น
              (เครื่อง 🔴 ทีมแดง และ 🔵 ทีมน้ำเงิน)
            </p>
          </div>

          {/* Notice Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mb-6 text-xs text-slate-300 space-y-2">
            <div className="flex items-start gap-2.5 text-amber-300 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>มาตรการป้องกันการเข้าถึงและแก้ไขคิว:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
              <li>อุปกรณ์อื่นทั้งหมด (โทรศัพท์มือถือ, แท็บเล็ต, หรือคอมพิวเตอร์ส่วนตัว) ไม่สามารถดูหรือแก้ไขคิวได้</li>
              <li>ระบบปิดการส่งข้อมูลคิวผ่าน Realtime Stream ให้กับอุปกรณ์ที่ยังไม่ได้รับอนุญาต</li>
              <li>การพยายามส่งคำขอ API โดยไม่ได้รับอนุญาตจะถูกบันทึกลงใน Audit Log ของระบบ</li>
            </ul>
          </div>

          {/* Central Machines Status Overview */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>สถานะเครื่องกลางประจำแผนกสีในระบบ</span>
              </span>
              {themeSwapped && (
                <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-md font-mono">
                  🔄 สลับฝั่ง 12:00 ทำงานอยู่
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Machine Slot (Red or Blue Team based on swap) */}
              <div
                id="slot-status-left"
                className={`p-3.5 rounded-xl border transition shadow-sm ${
                  leftDevice?.status === 'AUTHORIZED'
                    ? leftTeam.bgActive
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{leftTeam.icon}</span>
                    <span className={`text-xs font-bold ${leftTeam.textAccent}`}>
                      {leftTeam.name}
                    </span>
                  </div>
                  {leftDevice?.status === 'AUTHORIZED' ? (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${leftTeam.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${leftTeam.dotColor}`} />
                      {leftDevice.deviceId || 'AUTHORIZED'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md font-medium">
                      ว่าง (พร้อมติดตั้ง)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mb-1">{leftTeam.desc}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={leftDevice?.status === 'AUTHORIZED' ? 'text-slate-300 font-medium' : 'text-emerald-400'}>
                    {leftDevice?.status === 'AUTHORIZED'
                      ? '✓ มีเครื่องกลางประจำการอยู่แล้ว'
                      : '● พร้อมลงทะเบียนเครื่องใหม่'}
                  </span>

                  {leftDevice?.status === 'AUTHORIZED' && leftDevice.deviceId && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeModalDevice({
                          deviceId: leftDevice.deviceId!,
                          side: 'LEFT',
                          teamName: leftTeam.name,
                        })
                      }
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="ถอนสิทธิ์/ปลดล็อคเครื่องนี้เพื่อลงเครื่องใหม่"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ปลดล็อค</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Machine Slot (Blue or Red Team based on swap) */}
              <div
                id="slot-status-right"
                className={`p-3.5 rounded-xl border transition shadow-sm ${
                  rightDevice?.status === 'AUTHORIZED'
                    ? rightTeam.bgActive
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{rightTeam.icon}</span>
                    <span className={`text-xs font-bold ${rightTeam.textAccent}`}>
                      {rightTeam.name}
                    </span>
                  </div>
                  {rightDevice?.status === 'AUTHORIZED' ? (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${rightTeam.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${rightTeam.dotColor}`} />
                      {rightDevice.deviceId || 'AUTHORIZED'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md font-medium">
                      ว่าง (พร้อมติดตั้ง)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mb-1">{rightTeam.desc}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={rightDevice?.status === 'AUTHORIZED' ? 'text-slate-300 font-medium' : 'text-emerald-400'}>
                    {rightDevice?.status === 'AUTHORIZED'
                      ? '✓ มีเครื่องกลางประจำการอยู่แล้ว'
                      : '● พร้อมลงทะเบียนเครื่องใหม่'}
                  </span>

                  {rightDevice?.status === 'AUTHORIZED' && rightDevice.deviceId && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeModalDevice({
                          deviceId: rightDevice.deviceId!,
                          side: 'RIGHT',
                          teamName: rightTeam.name,
                        })
                      }
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="ถอนสิทธิ์/ปลดล็อคเครื่องนี้เพื่อลงเครื่องใหม่"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ปลดล็อค</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="pair-this-device-btn"
              onClick={onOpenPairModal}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition cursor-pointer active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" />
              <span>ติดตั้งเครื่องนี้ (Pair Device)</span>
            </button>

            <button
              id="refresh-auth-btn"
              onClick={onRefresh}
              disabled={isChecking}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-3 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="ตรวจสอบสิทธิ์อุปกรณ์ใหม่อีกครั้ง"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>ตรวจสอบสิทธิ์</span>
            </button>
          </div>
        </div>
      </main>

      {/* Revoke Device Confirmation Modal */}
      {revokeModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 relative shadow-2xl">
            <button
              onClick={() => setRevokeModalDevice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ถอนสิทธิ์/ปลดล็อคเครื่อง {revokeModalDevice.deviceId}
                </h3>
                <p className="text-xs text-slate-400">
                  {revokeModalDevice.teamName} (ฝั่ง {revokeModalDevice.side})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              การถอนสิทธิ์จะทำให้เครื่อง <strong className="text-rose-300">{revokeModalDevice.deviceId}</strong> เดิม
              ไม่สามารถเข้าถึงหรือแก้ไขระบบ Queue ได้อีก และจะเปิดให้ลงทะเบียนคอมพิวเตอร์เครื่องใหม่ในฝั่งนี้ได้ทันที
            </p>

            {revokeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {revokeError}
              </div>
            )}

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  กรอก Master Pairing Code เพื่อยืนยันการถอนสิทธิ์:
                </label>
                <input
                  type="password"
                  value={revokePairingCode}
                  onChange={(e) => setRevokePairingCode(e.target.value)}
                  placeholder="กรอก Pairing Code (เช่น PQ-CENTRAL-2026)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokeModalDevice(null)}
                  disabled={revokeSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={revokeSubmitting || !revokePairingCode.trim()}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  {revokeSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังถอนสิทธิ์...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>ยืนยันถอนสิทธิ์</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-3 text-center text-xs text-slate-400">
        ระบบ PAINT QUEUE แผนกสี &bull; ติดตั้งเครื่องกลางโดยผู้ดูแลระบบหรือหัวหน้าแผนกด้วย Pairing Code
      </footer>
    </div>
  );
};
