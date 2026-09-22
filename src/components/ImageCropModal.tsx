import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Eye,
  Sliders,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string; // Object URL or Data URL
  employeeName?: string;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string) => void;
}

const VIEWPORT_SIZE = 280; // Square viewport dimension in px
const OUTPUT_SIZE = 400; // Final crisp export dimension in px

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  employeeName = 'พนักงาน',
  onClose,
  onConfirmCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Crop & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [previewShape, setPreviewShape] = useState<'rounded' | 'circle'>('rounded');

  // Drag interaction tracking
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTouchDist = useRef<number | null>(null);
  const initialTouchZoom = useRef<number>(1);

  // Sync ref with state
  useEffect(() => {
    currentOffset.current = offset;
  }, [offset]);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setIsLoading(true);
    setLoadError(null);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setIsLoading(false);
    };
    img.onerror = () => {
      setLoadError('ไม่สามารถโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Calculate base dimensions so the image covers the viewport
  const calculateBaseDimensions = useCallback(
    (img: HTMLImageElement, rot: number) => {
      const isRotated = rot === 90 || rot === 270;
      const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;
      const aspect = naturalW / naturalH;

      let baseW = VIEWPORT_SIZE;
      let baseH = VIEWPORT_SIZE;

      if (aspect > 1) {
        // Landscape: fit height to viewport, width expands
        baseH = VIEWPORT_SIZE;
        baseW = VIEWPORT_SIZE * aspect;
      } else {
        // Portrait or square: fit width to viewport, height expands
        baseW = VIEWPORT_SIZE;
        baseH = VIEWPORT_SIZE / aspect;
      }

      return {
        baseW: isRotated ? baseH : baseW,
        baseH: isRotated ? baseW : baseH,
      };
    },
    []
  );

  // Redraw viewport canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIEWPORT_SIZE * dpr;
    canvas.height = VIEWPORT_SIZE * dpr;
    canvas.style.width = `${VIEWPORT_SIZE}px`;
    canvas.style.height = `${VIEWPORT_SIZE}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // Dark background behind image
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // Calculate dimensions
    const { baseW, baseH } = calculateBaseDimensions(imageObj, rotation);

    // Apply transform: center, pan, rotate, zoom
    ctx.save();
    ctx.translate(VIEWPORT_SIZE / 2 + offset.x, VIEWPORT_SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(imageObj, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();

    // Draw framing overlay & rule-of-thirds guide
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // cyan
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Rule of thirds
    const third = VIEWPORT_SIZE / 3;
    ctx.beginPath();
    ctx.moveTo(third, 0);
    ctx.lineTo(third, VIEWPORT_SIZE);
    ctx.moveTo(third * 2, 0);
    ctx.lineTo(third * 2, VIEWPORT_SIZE);
    ctx.moveTo(0, third);
    ctx.lineTo(VIEWPORT_SIZE, third);
    ctx.moveTo(0, third * 2);
    ctx.lineTo(VIEWPORT_SIZE, third * 2);
    ctx.stroke();

    // Center focal dot
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.7)'; // amber
    ctx.beginPath();
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [imageObj, zoom, rotation, offset, calculateBaseDimensions]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - currentOffset.current.x,
      y: e.clientY - currentOffset.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartPos.current = {
        x: touch.clientX - currentOffset.current.x,
        y: touch.clientY - currentOffset.current.y,
      };
      initialTouchDist.current = null;
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchDist.current = dist;
      initialTouchZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartPos.current.x;
      const newY = touch.clientY - dragStartPos.current.y;
      setOffset({ x: newX, y: newY });
    } else if (e.touches.length === 2 && initialTouchDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / initialTouchDist.current;
      const newZoom = Math.max(1, Math.min(3.5, initialTouchZoom.current * ratio));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialTouchDist.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.max(1, Math.min(3.5, prev + delta)));
  };

  // Rotate handlers
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev + 270) % 360);
  };

  // Reset transforms
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped high-res image
  const handleConfirm = () => {
    if (!imageObj) return;

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = OUTPUT_SIZE;
      exportCanvas.height = OUTPUT_SIZE;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      const scaleFactor = OUTPUT_SIZE / VIEWPORT_SIZE;
      const { baseW, baseH } = calculateBaseDimensions(imageObj, rotation);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Translate, rotate, scale
      ctx.translate(
        (OUTPUT_SIZE / 2) + offset.x * scaleFactor,
        (OUTPUT_SIZE / 2) + offset.y * scaleFactor
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      ctx.drawImage(imageObj, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
      onConfirmCrop(croppedDataUrl);
    } catch (err) {
      console.error('Failed to crop image', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="image-crop-modal-container"
        className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col text-slate-100 max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                <span>ปรับการวางสัดส่วนรูปภาพ</span>
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  สัดส่วน 1:1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ลากเลื่อนตำแหน่งและซูมปรับใบหน้าให้ชัดเจนก่อนกดตกลง ({employeeName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="w-full h-72 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="text-sm">กำลังโหลดรูปภาพ...</span>
            </div>
          ) : loadError ? (
            <div className="w-full p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm text-center">
              {loadError}
            </div>
          ) : (
            <>
              {/* Interactive Viewport Area */}
              <div className="flex flex-col items-center">
                <div
                  id="crop-viewport-box"
                  className="relative select-none touch-none rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/80 ring-4 ring-cyan-500/20 cursor-grab active:cursor-grabbing bg-slate-950"
                  style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                >
                  <canvas ref={canvasRef} className="block w-full h-full" />

                  {/* Mask Overlay based on Preview Shape */}
                  {previewShape === 'circle' ? (
                    <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/60 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]" />
                  ) : (
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]" />
                  )}

                  {/* Drag Prompt Hint */}
                  <div className="pointer-events-none absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/40 text-cyan-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Move className="w-3 h-3 text-cyan-400" />
                    <span>ลากเพื่อขยับตำแหน่ง</span>
                  </div>
                </div>

                {/* Guide shape toggle */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">กรอบแสดงผล:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewShape('rounded')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                      previewShape === 'rounded'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ขอบมน (การ์ดคิว)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewShape('circle')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                      previewShape === 'circle'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    วงกลม
                  </button>
                </div>
              </div>

              {/* Transformation Controls */}
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-inner">
                {/* Zoom Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ซูมย่อ-ขยาย:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="ซูมออก"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="range"
                      min="1"
                      max="3.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.2).toFixed(1)))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="ซูมเข้า"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rotate & Reset Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRotateCcw}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                      title="หมุนซ้าย 90 องศา"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>หมุนซ้าย</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRotateCw}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                      title="หมุนขวา 90 องศา"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>หมุนขวา</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-amber-300/80 hover:text-amber-200 text-xs font-bold flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตตำแหน่ง</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            id="btn-confirm-crop"
            onClick={handleConfirm}
            disabled={isLoading || !!loadError}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ตกลง ใช้รูปนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
