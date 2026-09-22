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
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string; // Object URL or Data URL
  employeeName?: string;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string) => void;
}

const VIEWPORT_SIZE = 300; // Viewport dimension in px
const OUTPUT_SIZE = 400; // Final crisp export dimension in px

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  employeeName = 'พนักงาน',
  onClose,
  onConfirmCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Crop & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [previewShape, setPreviewShape] = useState<'circle' | 'rounded'>('circle');

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
      setLoadError('ไม่สามารถโหลดรูปภาพได้ กรุณาเลือกไฟล์ภาพที่ถูกต้อง');
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

    // Deep slate background behind image
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

    // Draw subtle framing guidelines (Rule of thirds)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)'; // cyan
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

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

    // Center focal crosshair dot
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.8)'; // amber
    ctx.beginPath();
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Update live mini preview
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        const pSize = 72;
        previewCanvas.width = pSize * dpr;
        previewCanvas.height = pSize * dpr;
        previewCanvas.style.width = `${pSize}px`;
        previewCanvas.style.height = `${pSize}px`;

        pCtx.save();
        pCtx.scale(dpr, dpr);
        pCtx.clearRect(0, 0, pSize, pSize);
        pCtx.fillStyle = '#0f172a';
        pCtx.fillRect(0, 0, pSize, pSize);

        const pScale = pSize / VIEWPORT_SIZE;
        pCtx.translate(pSize / 2 + offset.x * pScale, pSize / 2 + offset.y * pScale);
        pCtx.rotate((rotation * Math.PI) / 180);
        pCtx.scale(zoom * pScale, zoom * pScale);
        pCtx.imageSmoothingEnabled = true;
        pCtx.imageSmoothingQuality = 'high';
        pCtx.drawImage(imageObj, -baseW / 2, -baseH / 2, baseW, baseH);
        pCtx.restore();
      }
    }
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
      const newZoom = Math.max(1, Math.min(4, +(initialTouchZoom.current * ratio).toFixed(2)));
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
    setZoom((prev) => Math.max(1, Math.min(4, +(prev + delta).toFixed(2))));
  };

  // Nudge pan helpers
  const handleNudge = (dx: number, dy: number) => {
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
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

  // Export cropped high-res image (400x400 crisp JPG)
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
        OUTPUT_SIZE / 2 + offset.x * scaleFactor,
        OUTPUT_SIZE / 2 + offset.y * scaleFactor
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
    <div
      id="image-crop-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="image-crop-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col text-slate-100 max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shadow-inner">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                <span>ปรับสัดส่วนรูปโปรไฟล์</span>
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  สไตล์ Facebook 1:1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ลากเลื่อนตำแหน่งและซูมจัดวางใบหน้าของ <span className="text-cyan-300 font-bold">{employeeName}</span> ให้สวยงาม
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-crop-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
              <span className="text-sm">กำลังเปิดและเตรียมรูปภาพ...</span>
            </div>
          ) : loadError ? (
            <div className="w-full p-6 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm text-center space-y-2">
              <p className="font-bold">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white cursor-pointer"
              >
                ปิดและลองเลือกไฟล์ใหม่
              </button>
            </div>
          ) : (
            <>
              {/* Top View Selector: Circle (Facebook Style) vs Rounded Card */}
              <div className="flex items-center justify-between w-full max-w-sm px-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>โหมดกรอบพรีวิว:</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewShape('circle')}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                      previewShape === 'circle'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⭕ วงกลม (Avatar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewShape('rounded')}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                      previewShape === 'rounded'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔲 สี่เหลี่ยมมน (การ์ดคิว)
                  </button>
                </div>
              </div>

              {/* Interactive Viewport Area */}
              <div className="relative flex flex-col items-center">
                <div
                  id="crop-viewport-box"
                  className="relative select-none touch-none rounded-3xl overflow-hidden shadow-2xl border-2 border-cyan-500/70 ring-4 ring-cyan-500/20 cursor-grab active:cursor-grabbing bg-slate-950"
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

                  {/* Facebook-style Dimmed Mask Overlay */}
                  {previewShape === 'circle' ? (
                    <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/70 shadow-[0_0_0_9999px_rgba(3,7,18,0.72)] transition-all" />
                  ) : (
                    <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(3,7,18,0.68)] transition-all" />
                  )}

                  {/* Drag Prompt Hint Pill */}
                  <div className="pointer-events-none absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>คลิกลากเพื่อเลื่อนตำแหน่งรูป</span>
                  </div>
                </div>
              </div>

              {/* Transformation Controls Bar */}
              <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-inner">
                {/* Zoom Control Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span>ซูม ย่อ-ขยาย:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}
                      className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="ซูมออก"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(1)))}
                      className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="ซูมเข้า"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Micro-Adjustment Pan Nudge + Rotate & Reset */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                  {/* Nudge D-Pad */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">
                      เลื่อนละเอียด:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNudge(0, -15)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="เลื่อนขึ้น"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(0, 15)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="เลื่อนลง"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(-15, 0)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="เลื่อนซ้าย"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(15, 0)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                      title="เลื่อนขวา"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rotate Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRotateCcw}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-700/60 transition cursor-pointer"
                      title="หมุนซ้าย 90 องศา"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>หมุนซ้าย</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRotateCw}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-700/60 transition cursor-pointer"
                      title="หมุนขวา 90 องศา"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>หมุนขวา</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-850/80 hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1 border border-amber-500/30 transition cursor-pointer"
                      title="กลับไปค่าเริ่มต้นตรงกลาง"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>รีเซ็ต</span>
                    </button>
                  </div>
                </div>

                {/* Live Real-time Miniature Preview */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-slate-300 font-bold">
                      ตัวอย่างจริงบนบอร์ดคิว:
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md flex-shrink-0 bg-slate-900">
                        <canvas ref={previewCanvasRef} className="block w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">Avatar</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md flex-shrink-0 bg-slate-900">
                        <canvas ref={previewCanvasRef} className="block w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">การ์ดคิว</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ตกลง ใช้รูปนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
