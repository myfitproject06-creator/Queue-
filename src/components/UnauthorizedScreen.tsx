import React, { useState } from 'react';
import { ShieldAlert, Lock, Monitor, RefreshCw, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Side } from '../types';

interface UnauthorizedScreenProps {
  registeredDevices: {
    side: Side;
    deviceId?: string;
    status: 'AUTHORIZED' | 'REVOKED' | 'NOT_REGISTERED';
    lastSeenAt?: string;
  }[];
  onOpenPairModal: () => void;
  onRefresh: () => void;
  isChecking: boolean;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
  registeredDevices,
  onOpenPairModal,
  onRefresh,
  isChecking,
}) => {
  const leftDevice = registeredDevices.find((d) => d.side === 'LEFT');
  const rightDevice = registeredDevices.find((d) => d.side === 'RIGHT');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center font-black text-white shadow-lg shadow-rose-900/30 text-lg">
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
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Shield Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              อุปกรณ์นี้ไม่ได้รับอนุญาตให้ใช้งาน
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md">
              ระบบ PAINT QUEUE ถูกจำกัดให้เข้าถึงและใช้งานได้เฉพาะ <strong className="text-slate-200">คอมพิวเตอร์กลาง 2 เครื่อง</strong> ของแผนกสีเท่านั้น (เครื่องฝั่ง LEFT และ RIGHT)
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
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>สถานะเครื่องกลางประจำแผนกสีในระบบ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Machine Slot */}
              <div
                id="slot-status-left"
                className={`p-3.5 rounded-xl border transition ${
                  leftDevice?.status === 'AUTHORIZED'
                    ? 'bg-blue-950/30 border-blue-800/60'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-400">ฝั่งซ้าย (LEFT)</span>
                  {leftDevice?.status === 'AUTHORIZED' ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {leftDevice.deviceId || 'AUTHORIZED'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      ยังไม่ลงทะเบียน
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {leftDevice?.status === 'AUTHORIZED'
                    ? 'มีเครื่องกลางประจำการอยู่แล้ว'
                    : 'ว่าง (สามารถลงทะเบียนเครื่องได้)'}
                </div>
              </div>

              {/* Right Machine Slot */}
              <div
                id="slot-status-right"
                className={`p-3.5 rounded-xl border transition ${
                  rightDevice?.status === 'AUTHORIZED'
                    ? 'bg-emerald-950/30 border-emerald-800/60'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-400">ฝั่งขวา (RIGHT)</span>
                  {rightDevice?.status === 'AUTHORIZED' ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {rightDevice.deviceId || 'AUTHORIZED'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      ยังไม่ลงทะเบียน
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {rightDevice?.status === 'AUTHORIZED'
                    ? 'มีเครื่องกลางประจำการอยู่แล้ว'
                    : 'ว่าง (สามารถลงทะเบียนเครื่องได้)'}
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

      {/* Footer Info */}
      <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-3 text-center text-xs text-slate-400">
        ระบบ PAINT QUEUE แผนกสี &bull; ติดตั้งเครื่องกลางโดยผู้ดูแลระบบหรือหัวหน้าแผนกด้วย Pairing Code
      </footer>
    </div>
  );
};
