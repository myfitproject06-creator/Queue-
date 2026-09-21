import React from 'react';
import { Monitor, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Side } from '../types';

interface MachineSelectModalProps {
  currentSide: Side | null;
  onSelectSide: (side: Side) => void;
  isOpen: boolean;
  onClose?: () => void;
  isFirstTime?: boolean;
}

export const MachineSelectModal: React.FC<MachineSelectModalProps> = ({
  currentSide,
  onSelectSide,
  isOpen,
  onClose,
  isFirstTime = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="machine-select-overlay"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4"
    >
      <div
        id="machine-select-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-10 text-white animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-3 border border-slate-700">
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>{isFirstTime ? 'ตั้งค่าครั้งแรกประจำเครื่อง' : 'เปลี่ยนฝั่งประจำเครื่อง'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            PAINT QUEUE
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mt-2">
            เลือกฝั่งของเครื่องนี้
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกฝั่งของ PC เครื่องนี้ เพื่อให้หน้าจอแสดงเฉพาะคิวประจำจุดบริการของคุณ
          </p>
        </div>

        {/* The 2 Large Selection Boxes: LEFT vs RIGHT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Option 1: LEFT (ฝั่งซ้าย) */}
          <button
            id="select-side-left-btn"
            onClick={() => onSelectSide('LEFT')}
            className={`p-7 rounded-3xl border-2 text-center transition-all relative cursor-pointer group flex flex-col items-center justify-between hover:scale-[1.02] active:scale-[0.99] ${
              currentSide === 'LEFT'
                ? 'bg-blue-950/70 border-blue-500 shadow-2xl shadow-blue-500/25 ring-2 ring-blue-500/40'
                : 'bg-slate-850/80 border-slate-700 hover:border-blue-400 hover:bg-slate-800/90'
            }`}
          >
            {currentSide === 'LEFT' && (
              <span className="absolute top-4 right-4 text-blue-400">
                <CheckCircle className="w-6 h-6" />
              </span>
            )}
            <div className="w-20 h-20 rounded-3xl bg-blue-600/25 border border-blue-500/40 text-blue-400 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition shadow-inner">
              🟦
            </div>
            <div>
              <div className="text-3xl font-black tracking-wide text-white group-hover:text-blue-300 transition">
                LEFT
              </div>
              <div className="text-base font-bold text-slate-300 mt-1">
                ฝั่งซ้าย
              </div>
              <p className="text-xs text-slate-400 mt-2">
                โต๊ะคอมพิวเตอร์ประจำฝั่งซ้ายของแผนกสี
              </p>
            </div>

            <div className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition">
              <span>เลือกฝั่ง LEFT</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Option 2: RIGHT (ฝั่งขวา) */}
          <button
            id="select-side-right-btn"
            onClick={() => onSelectSide('RIGHT')}
            className={`p-7 rounded-3xl border-2 text-center transition-all relative cursor-pointer group flex flex-col items-center justify-between hover:scale-[1.02] active:scale-[0.99] ${
              currentSide === 'RIGHT'
                ? 'bg-emerald-950/70 border-emerald-500 shadow-2xl shadow-emerald-500/25 ring-2 ring-emerald-500/40'
                : 'bg-slate-850/80 border-slate-700 hover:border-emerald-400 hover:bg-slate-800/90'
            }`}
          >
            {currentSide === 'RIGHT' && (
              <span className="absolute top-4 right-4 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </span>
            )}
            <div className="w-20 h-20 rounded-3xl bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition shadow-inner">
              🟩
            </div>
            <div>
              <div className="text-3xl font-black tracking-wide text-white group-hover:text-emerald-300 transition">
                RIGHT
              </div>
              <div className="text-base font-bold text-slate-300 mt-1">
                ฝั่งขวา
              </div>
              <p className="text-xs text-slate-400 mt-2">
                โต๊ะคอมพิวเตอร์ประจำฝั่งขวาของแผนกสี
              </p>
            </div>

            <div className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition">
              <span>เลือกฝั่ง RIGHT</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            <strong>ไม่ต้องเลือกใหม่ทุกครั้ง:</strong> ระบบจะจดจำค่าฝั่งของเครื่องนี้ไว้ในเบราว์เซอร์อัตโนมัติ (แม้ปิดเบราว์เซอร์หรือรีเฟรชหน้า)
          </span>
        </div>

        {!isFirstTime && onClose && (
          <div className="text-right mt-6">
            <button
              id="close-machine-select-btn"
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              ยกเลิก / ไม่เปลี่ยน
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

