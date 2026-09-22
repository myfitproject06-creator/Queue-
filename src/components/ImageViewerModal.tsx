import React, { useEffect } from 'react';
import { X, ZoomIn, User, Clock, Building, ShieldCheck, Flame } from 'lucide-react';

export interface ImageViewerData {
  imageUrl?: string;
  name: string;
  nickname?: string;
  brand?: string;
  brandCode?: string;
  avatarColor?: string;
  statusText?: string;
  isServing?: boolean;
  side?: 'LEFT' | 'RIGHT';
  servedAt?: string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  data: ImageViewerData | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  data,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  return (
    <div
      id="image-viewer-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="image-viewer-modal-container"
        className="relative max-w-2xl w-full bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex-shrink-0">
              <ZoomIn className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  {data.name}
                </h2>
                {data.nickname && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    {data.nickname}
                  </span>
                )}
                {data.isServing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-orange-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                    <Flame className="w-3 h-3 fill-slate-950" />
                    กำลังติดลูกค้า
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    คิวรอรับลูกค้า
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                รูปภาพประจำตัวพนักงาน • แผนกสี
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-image-viewer"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer border border-transparent hover:border-slate-700 flex-shrink-0"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image Content Container */}
        <div className="relative bg-slate-950 flex items-center justify-center p-4 sm:p-6 min-h-[320px] max-h-[70vh] overflow-hidden select-none">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.name}
              className="max-h-[60vh] sm:max-h-[64vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl shadow-black border border-slate-800 ring-2 ring-orange-500/30"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fallback = document.getElementById('viewer-fallback-avatar');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}

          <div
            id="viewer-fallback-avatar"
            className={`w-48 h-48 sm:w-64 sm:h-64 rounded-3xl items-center justify-center font-black text-white text-6xl sm:text-7xl shadow-2xl border-4 border-slate-700 ${
              data.imageUrl ? 'hidden' : 'flex'
            }`}
            style={{ backgroundColor: data.avatarColor || '#ea580c' }}
          >
            {data.nickname || data.name.charAt(0)}
          </div>
        </div>

        {/* Footer Info & Badges */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {data.brand && (
              <span className="flex items-center gap-1 font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                แบรนด์ {data.brand}
              </span>
            )}
            {data.brandCode && (
              <span className="font-mono font-black text-rose-300 bg-rose-950/80 border border-rose-500/50 px-2 py-0.5 rounded-lg shadow-sm">
                รหัส: {data.brandCode}
              </span>
            )}
            {data.side && (
              <span className="font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-xl">
                ฝั่ง {data.side === 'LEFT' ? 'ซ้าย (LEFT)' : 'ขวา (RIGHT)'}
              </span>
            )}
            {data.statusText && (
              <span className="text-slate-400 font-medium">
                {data.statusText}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
