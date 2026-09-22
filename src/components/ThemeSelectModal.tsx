import React, { useState } from 'react';
import { X, Check, Palette, Sparkles, Swords, Shield, ExternalLink } from 'lucide-react';
import { THEME_PRESETS } from '../constants';
import { ThemePreset } from '../types';

interface ThemeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => Promise<void>;
  onOpenEmployeeManager?: () => void;
}

export const ThemeSelectModal: React.FC<ThemeSelectModalProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
  onOpenEmployeeManager,
}) => {
  const [isApplying, setIsApplying] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = async (themeId: string) => {
    if (themeId === activeThemeId) return;
    setIsApplying(themeId);
    try {
      await onSelectTheme(themeId);
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div
      id="theme-select-modal-overlay"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="theme-select-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl shadow">
              <Palette className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">ระบบเลือกธีม (Theme Presets)</h2>
                <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full uppercase">
                  Real-time Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                สลับชื่อทีม สัญลักษณ์ ตัวละครมาสคอต และโทนสีของทั้งสองฝั่ง (Sync ทุกหน้าจออัตโนมัติ)
              </p>
            </div>
          </div>
          <button
            id="close-theme-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list of presets */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {THEME_PRESETS.map((preset) => {
            const isActive = preset.id === activeThemeId;
            const isLoading = isApplying === preset.id;

            return (
              <div
                key={preset.id}
                id={`theme-preset-card-${preset.id.toLowerCase()}`}
                className={`rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-950/90 border-purple-500 shadow-2xl shadow-purple-950/60 ring-2 ring-purple-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner flex-shrink-0">
                      {preset.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white">{preset.name}</h3>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                          {preset.tag}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-black bg-purple-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                            <span>กำลังใช้งาน</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{preset.description}</p>
                      {preset.themeQuote && (
                        <p className="text-[11px] text-purple-300/90 mt-1 italic">
                          "{preset.themeQuote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    id={`btn-apply-theme-${preset.id.toLowerCase()}`}
                    type="button"
                    disabled={isActive || isLoading}
                    onClick={() => handleApply(preset.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                      isActive
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 cursor-default opacity-90'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <span className="animate-pulse">กำลังเปลี่ยนธีม...</span>
                    ) : isActive ? (
                      <>
                        <Check className="w-4 h-4 text-purple-400" />
                        <span>ธีมปัจจุบัน</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>ใช้ธีมนี้</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Left Side vs Right Side Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* Left Side Preview */}
                  <div
                    className={`rounded-2xl border p-3 flex items-center justify-between gap-3 shadow-md ${
                      preset.left.sideBg || 'bg-slate-900'
                    } ${preset.left.borderGlow || 'border-slate-800'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {preset.left.mascotImage ? (
                        <img
                          src={preset.left.mascotImage}
                          alt={preset.left.mascotName}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-400/80 shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                          {preset.left.iconEmoji}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-950 border border-blue-500/50 text-blue-300">
                            ฝั่งซ้าย (LEFT)
                          </span>
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-1.5 py-0.5 rounded">
                            {preset.left.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-1">
                          {preset.left.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 truncate">
                          {preset.left.mascotName} • <span className="text-cyan-300 italic">"{preset.left.mascotQuote}"</span>
                        </p>
                      </div>
                    </div>

                    {/* Preview of Serve Button */}
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[9px] text-slate-400">ปุ่มขึ้นคิว</span>
                      <div
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${
                          preset.left.serveBtn || 'bg-orange-500 text-slate-950'
                        }`}
                      >
                        ขึ้นคิว
                      </div>
                    </div>
                  </div>

                  {/* Right Side Preview */}
                  <div
                    className={`rounded-2xl border p-3 flex items-center justify-between gap-3 shadow-md ${
                      preset.right.sideBg || 'bg-slate-900'
                    } ${preset.right.borderGlow || 'border-slate-800'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {preset.right.mascotImage ? (
                        <img
                          src={preset.right.mascotImage}
                          alt={preset.right.mascotName}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-purple-400/80 shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                          {preset.right.iconEmoji}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-purple-300">
                            ฝั่งขวา (RIGHT)
                          </span>
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/60 px-1.5 py-0.5 rounded">
                            {preset.right.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-1">
                          {preset.right.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 truncate">
                          {preset.right.mascotName} • <span className="text-purple-300 italic">"{preset.right.mascotQuote}"</span>
                        </p>
                      </div>
                    </div>

                    {/* Preview of Serve Button */}
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[9px] text-slate-400">ปุ่มขึ้นคิว</span>
                      <div
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${
                          preset.right.serveBtn || 'bg-orange-500 text-slate-950'
                        }`}
                      >
                        ขึ้นคิว
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Character integration banner */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 border border-purple-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎎</span>
            <div>
              <strong className="text-purple-300">ตัวละครและรูปโปรไฟล์พนักงาน:</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                พนักงานสามารถเลือกรูปตัวละคร ดาบพิฆาตอสูร (ทันจิโร่, เนซึโกะ, เร็นโกคุ, เซนอิทซึ, อาคาสะ) เป็นรูปโปรไฟล์ประจำตัวได้
              </p>
            </div>
          </div>
          {onOpenEmployeeManager && (
            <button
              type="button"
              id="btn-goto-employee-avatars"
              onClick={() => {
                onClose();
                onOpenEmployeeManager();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition flex-shrink-0 shadow"
            >
              <span>ไปเลือกรูปพนักงาน</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
