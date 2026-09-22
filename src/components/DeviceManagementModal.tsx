import React, { useState } from 'react';
import { AuthorizedDevice } from '../types';
import { revokeDevice } from '../api';
import { X, Monitor, ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: AuthorizedDevice | null;
  onRevokedSuccess: () => void;
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  isOpen,
  onClose,
  device,
  onRevokedSuccess,
}) => {
  const [pairingCode, setPairingCode] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  if (!isOpen || !device) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setErrorMessage('กรุณากรอกรหัส Pairing Code เพื่อยืนยันการถอนการอนุญาต');
      return;
    }

    setIsRevoking(true);
    setErrorMessage(null);

    try {
      await revokeDevice(device.deviceId, pairingCode.trim());
      onRevokedSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'ถอนการอนุญาตเครื่องไม่สำเร็จ');
    } finally {
      setIsRevoking(false);
    }
  };

  const formattedCreated = device.createdAt
    ? new Date(device.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  const formattedLastSeen = device.lastSeenAt
    ? new Date(device.lastSeenAt).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '-';

  return (
    <div
      id="device-management-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="device-management-modal-dialog"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ข้อมูลเครื่องและระบบความปลอดภัย (Device Status)
            </h3>
            <p className="text-xs text-slate-400">
              สถานะสิทธิ์การเข้าถึงระบบ PAINT QUEUE ของเครื่องนี้
            </p>
          </div>
        </div>

        {/* Device Information Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400">Device ID:</span>
            <span
              id="device-info-id"
              className="font-mono font-bold text-sm text-white bg-slate-800 px-2.5 py-0.5 rounded-md"
            >
              {device.deviceId}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400">Assigned Side:</span>
            <span
              id="device-info-side"
              className={`font-semibold text-xs px-2.5 py-1 rounded-md ${
                device.side === 'LEFT'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {device.side === 'LEFT' ? '🟦 เครื่องฝั่ง LEFT (ซ้าย)' : '🟩 เครื่องฝั่ง RIGHT (ขวา)'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400">Status:</span>
            <span
              id="device-info-status"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-0.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 AUTHORIZED
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Last Connected:</span>
            <span className="text-slate-300 font-mono">{formattedLastSeen}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Registered At:</span>
            <span className="text-slate-300">{formattedCreated}</span>
          </div>
        </div>

        {/* Revoke and Re-Pair Section */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>การถอนการจับคู่ / ถอนสิทธิ์เครื่อง (Unpair & Revoke)</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            กรณีคอมพิวเตอร์เครื่องนี้เสีย หรือต้องการย้ายไปใช้เครื่องใหม่ ต้องทำการถอนการจับคู่เครื่องเดิมก่อน เพื่อคืน Slot ให้สามารถนำคอมพิวเตอร์เครื่องใหม่มา Pair ได้ (เช่น {device.side === 'LEFT' ? 'LEFT-02' : 'RIGHT-02'})
          </p>

          {!showRevokeConfirm ? (
            <div className="flex justify-end">
              <button
                type="button"
                id="show-revoke-btn"
                onClick={() => setShowRevokeConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>🗑 ถอนการจับคู่เครื่องนี้</span>
              </button>
            </div>
          ) : (
            <div
              id="revoke-confirmation-box"
              className="bg-rose-950/30 border border-rose-800/70 rounded-xl p-4 text-xs text-slate-300 animate-in fade-in"
            >
              <div className="flex items-start gap-2 text-rose-300 font-bold mb-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>ยืนยันการถอนการจับคู่เครื่องนี้?</span>
              </div>
              <p className="text-slate-300 mb-3 text-xs leading-relaxed">
                หลังจากถอนการจับคู่ เครื่องนี้จะไม่สามารถใช้งาน PAINT QUEUE ได้อีกต่อไป และจะต้องทำขั้นตอนจับคู่ใหม่ด้วยรหัสความปลอดภัย (Pairing Code)
              </p>

              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRevoke} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    กรอกรหัสความปลอดภัย (Pairing Code) เพื่อยืนยัน:
                  </label>
                  <input
                    id="revoke-pairing-code-input"
                    type="password"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value)}
                    placeholder="กรอก Pairing Code (เช่น PQ-CENTRAL-2026)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRevokeConfirm(false);
                      setPairingCode('');
                      setErrorMessage(null);
                    }}
                    disabled={isRevoking}
                    className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    id="confirm-revoke-device-btn"
                    disabled={isRevoking || !pairingCode.trim()}
                    className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-md shadow-rose-900/40"
                  >
                    {isRevoking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังถอนการจับคู่...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยืนยันถอนการจับคู่</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
