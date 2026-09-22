import React, { useState } from 'react';
import { Side } from '../types';
import { pairDevice } from '../api';
import { X, KeyRound, Monitor, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairedSuccess: (device: any) => void;
  registeredDevices: {
    side: Side;
    deviceId?: string;
    status: 'AUTHORIZED' | 'REVOKED' | 'NOT_REGISTERED';
  }[];
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({
  isOpen,
  onClose,
  onPairedSuccess,
  registeredDevices,
}) => {
  const [selectedSide, setSelectedSide] = useState<Side>('LEFT');
  const [pairingCode, setPairingCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const leftDevice = registeredDevices.find((d) => d.side === 'LEFT');
  const rightDevice = registeredDevices.find((d) => d.side === 'RIGHT');

  const isLeftOccupied = leftDevice?.status === 'AUTHORIZED';
  const isRightOccupied = rightDevice?.status === 'AUTHORIZED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setErrorMessage('กรุณากรอกรหัส Pairing Code');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await pairDevice(selectedSide, pairingCode.trim());
      onPairedSuccess(result.device);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียนเครื่อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="pair-device-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="pair-device-modal-dialog"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-600/50 flex items-center justify-center text-blue-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ติดตั้งเครื่องกลาง (Pair Device)
            </h3>
            <p className="text-xs text-slate-400">
              ลงทะเบียนคอมพิวเตอร์เครื่องนี้ให้เป็น Authorized Machine
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            id="pair-error-banner"
            className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Side Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              เลือกฝั่งของเครื่องคอมพิวเตอร์เครื่องนี้:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="select-pair-side-left"
                onClick={() => setSelectedSide('LEFT')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedSide === 'LEFT'
                    ? 'bg-blue-950/70 border-blue-500 shadow-md shadow-blue-900/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-blue-400">🟦 ฝั่ง LEFT</span>
                  {selectedSide === 'LEFT' && (
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isLeftOccupied ? (
                    <span className="text-amber-400">มีเครื่องอยู่แล้ว ({leftDevice?.deviceId})</span>
                  ) : (
                    <span className="text-emerald-400">ว่าง (พร้อมลงทะเบียน)</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                id="select-pair-side-right"
                onClick={() => setSelectedSide('RIGHT')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedSide === 'RIGHT'
                    ? 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-900/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-emerald-400">🟩 ฝั่ง RIGHT</span>
                  {selectedSide === 'RIGHT' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isRightOccupied ? (
                    <span className="text-amber-400">มีเครื่องอยู่แล้ว ({rightDevice?.deviceId})</span>
                  ) : (
                    <span className="text-emerald-400">ว่าง (พร้อมลงทะเบียน)</span>
                  )}
                </div>
              </button>
            </div>
            {((selectedSide === 'LEFT' && isLeftOccupied) ||
              (selectedSide === 'RIGHT' && isRightOccupied)) && (
              <p className="mt-2 text-[11px] text-amber-300">
                * หากต้องการเปลี่ยนเครื่องกลางของฝั่งนี้ กรุณาให้เครื่องเดิมกดถอนสิทธิ์ (Revoke) ก่อน
              </p>
            )}
          </div>

          {/* Master Pairing Code Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              รหัสลับติดตั้งระบบ (Master Pairing Code):
            </label>
            <input
              id="pairing-code-input"
              type="password"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              placeholder="กรอก Pairing Code (เช่น PQ-CENTRAL-2026)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wider"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-400">
              รหัสความปลอดภัยสำหรับแอดมินหรือช่างประจำแผนกเท่านั้น (ค่าเริ่มต้น: <code className="text-blue-300 font-mono">PQ-CENTRAL-2026</code>)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="submit-pair-btn"
              disabled={isSubmitting || !pairingCode.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ยืนยันและลงทะเบียนเครื่อง</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
