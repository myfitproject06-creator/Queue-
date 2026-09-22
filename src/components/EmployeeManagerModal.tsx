import React, { useState, useRef } from 'react';
import {
  Users,
  X,
  Plus,
  Check,
  Upload,
  Edit2,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  UserCheck,
  UserX,
  Camera,
  RotateCcw,
  Tag,
  Crop,
} from 'lucide-react';
import { BrandItem, Employee, MachineId } from '../types';
import { DEFAULT_PAINT_BRANDS } from '../constants';
import { ImageCropModal } from './ImageCropModal';

interface EmployeeManagerModalProps {
  isOpen: boolean;
  employees: Employee[];
  brands?: BrandItem[];
  machineId: MachineId;
  onClose: () => void;
  onAddEmployee: (
    name: string,
    nickname?: string,
    avatarUrl?: string,
    brand?: string,
    brandCode?: string
  ) => Promise<void>;
  onUpdateEmployee?: (
    id: string,
    updates: {
      name?: string;
      nickname?: string;
      avatarUrl?: string;
      brand?: string;
      brandCode?: string;
    }
  ) => Promise<void>;
  onDeleteEmployee?: (id: string) => Promise<void>;
  onToggleActiveEmployee?: (id: string) => Promise<void>;
  onOpenBrandManager?: () => void;
}

// Compress and square-center-crop uploaded image via HTML5 Canvas (256x256 px, ~20KB)
function compressAndCropAvatar(file: File, targetSize = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\//i)) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถประมวลผล Canvas ได้'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1:1 Center crop
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err: any) {
        reject(new Error('เกิดข้อผิดพลาดในการปรับขนาดรูปภาพ: ' + (err.message || '')));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback with FileReader
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          const minDim = Math.min(fallbackImg.width, fallbackImg.height);
          const sx = (fallbackImg.width - minDim) / 2;
          const sy = (fallbackImg.height - minDim) / 2;
          ctx.drawImage(fallbackImg, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        fallbackImg.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพได้'));
        fallbackImg.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({
  isOpen,
  employees,
  brands = [],
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onToggleActiveEmployee,
  onOpenBrandManager,
}) => {
  // Add Employee Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Edit Employee State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editNickname, setEditNickname] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [editBrandCode, setEditBrandCode] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDeleteEmpId, setConfirmDeleteEmpId] = useState<string | null>(null);

  // Crop modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string>('');
  const [cropIsEditMode, setCropIsEditMode] = useState(false);
  const [cropTargetName, setCropTargetName] = useState<string>('');

  // File input refs for reliable click triggering
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Effective brand list: fallback to DEFAULT_PAINT_BRANDS if empty
  const effectiveBrands: BrandItem[] =
    brands && brands.length > 0
      ? brands
      : DEFAULT_PAINT_BRANDS.map((b) => ({
          id: 'brand_' + b.brandCode.toLowerCase(),
          name: b.brand,
          code: b.brandCode,
          color: b.color,
        }));

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditMode = false
  ) => {
    const file = e.target.files?.[0];
    // Reset target value so re-selecting same file triggers change
    e.target.value = '';

    if (!file) return;

    if (!file.type.match(/^image\//i)) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)');
      return;
    }

    try {
      setErrorMsg(null);
      const objectUrl = URL.createObjectURL(file);
      setCropSourceUrl(objectUrl);
      setCropIsEditMode(isEditMode);
      setCropTargetName(isEditMode ? (editName || 'พนักงาน') : (name || 'พนักงานใหม่'));
      setIsCropModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปิดรูปภาพ');
    }
  };

  const handleOpenCropForExisting = (imageUrl: string, isEditMode: boolean) => {
    if (!imageUrl) return;
    setErrorMsg(null);
    setCropSourceUrl(imageUrl);
    setCropIsEditMode(isEditMode);
    setCropTargetName(isEditMode ? (editName || 'พนักงาน') : (name || 'พนักงานใหม่'));
    setIsCropModalOpen(true);
  };

  const handleConfirmCrop = (croppedDataUrl: string) => {
    if (cropIsEditMode) {
      setEditAvatarUrl(croppedDataUrl);
    } else {
      setSelectedAvatarUrl(croppedDataUrl);
      setAvatarPreview(croppedDataUrl);
    }
    setIsCropModalOpen(false);
    if (cropSourceUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropSourceUrl('');
    setSuccessMsg('ปรับตำแหน่งและสัดส่วนรูปโปรไฟล์เรียบร้อยแล้ว');
  };

  const handleCloseCrop = () => {
    setIsCropModalOpen(false);
    if (cropSourceUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropSourceUrl('');
  };

  const handleSelectBrandForNew = (b: BrandItem) => {
    if (selectedBrand === b.name) {
      // Toggle unselect
      setSelectedBrand('');
      setSelectedBrandCode('');
    } else {
      setSelectedBrand(b.name);
      setSelectedBrandCode(b.code);
    }
  };

  const handleSelectBrandForEdit = (b: BrandItem) => {
    if (editBrand === b.name) {
      setEditBrand('');
      setEditBrandCode('');
    } else {
      setEditBrand(b.name);
      setEditBrandCode(b.code);
    }
  };

  const handleSubmitNewEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลพนักงาน');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onAddEmployee(
        name.trim(),
        nickname.trim() || undefined,
        selectedAvatarUrl.trim() || undefined,
        selectedBrand.trim() || undefined,
        selectedBrandCode.trim()?.toUpperCase() || undefined
      );
      setSuccessMsg(`เพิ่มพนักงาน "${name.trim()}" สำเร็จและบันทึกถาวรเรียบร้อยแล้ว`);
      setName('');
      setNickname('');
      setSelectedBrand('');
      setSelectedBrandCode('');
      setSelectedAvatarUrl('');
      setAvatarPreview('');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเพิ่มพนักงานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditEmployee = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditName(emp.name);
    setEditAvatarUrl(emp.avatarUrl || '');
    setEditNickname(emp.nickname || '');
    setEditBrand(emp.brand || '');
    setEditBrandCode(emp.brandCode || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEditEmployee = async (empId: string) => {
    if (!onUpdateEmployee) return;
    if (!editName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลพนักงาน');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateEmployee(empId, {
        name: editName.trim(),
        avatarUrl: editAvatarUrl, // Pass directly to allow updating or clearing
        nickname: editNickname.trim(),
        brand: editBrand.trim(),
        brandCode: editBrandCode.trim()?.toUpperCase(),
      });
      setSuccessMsg('บันทึกการแก้ไขข้อมูลพนักงานเรียบร้อยแล้ว');
      setEditingEmpId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!onDeleteEmployee) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onDeleteEmployee(empId);
      setSuccessMsg('ลบพนักงานออกจากระบบถาวรเรียบร้อยแล้ว');
      setConfirmDeleteEmpId(null);
      if (editingEmpId === empId) setEditingEmpId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบพนักงานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="employee-manager-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="employee-manager-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-3xl w-full p-6 text-white animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-950/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                จัดการรายชื่อพนักงาน (Staff Management)
              </h2>
              <p className="text-xs text-slate-400">
                เพิ่ม แก้ไข อัปโหลดรูปจริง และกำหนดสังกัดแบรนด์สี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBrandManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandManager();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                title="เปิดหน้าจัดการแบรนด์สี"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>จัดการแบรนด์สี ➔</span>
              </button>
            )}
            <button
              id="close-employee-manager-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body Scroll */}
        <div className="overflow-y-auto flex-1 pr-1 mt-4 space-y-5">
          {/* =========================================================================
              SECTION 1: ADD NEW EMPLOYEE FORM
             ========================================================================= */}
          <form
            onSubmit={handleSubmitNewEmployee}
            className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>เพิ่มพนักงานใหม่</span>
              </div>
              <span className="text-[11px] text-slate-400">
                ข้อมูลจะถูกบันทึกถาวรลงฐานข้อมูลระบบ
              </span>
            </div>

            {/* Step 1: Select Brand */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-400" />
                  <span>1. เลือกสังกัดแบรนด์สี (คลิกเลือก):</span>
                </label>
                {selectedBrand && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('');
                      setSelectedBrandCode('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-300 cursor-pointer"
                  >
                    ล้างการเลือก
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {effectiveBrands.map((b) => {
                  const isSelected = selectedBrand === b.name;
                  return (
                    <button
                      key={b.id || b.code}
                      type="button"
                      onClick={() => handleSelectBrandForNew(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60 ring-2 ring-rose-400 scale-105'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: b.color || '#2563eb' }}
                      />
                      <span>{b.name}</span>
                      <span className="text-[10px] font-mono opacity-80">[{b.code}]</span>
                      {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  2. ชื่อ-นามสกุลพนักงาน *
                </label>
                <input
                  id="new-emp-name-input"
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  ชื่อเล่น / ชื่อเรียกสั้น
                </label>
                <input
                  id="new-emp-nickname-input"
                  type="text"
                  placeholder="เช่น ชาย, ต้อม, บอย"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Step 3: Real Photo Avatar Upload */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. รูปโปรไฟล์พนักงาน (อัปโหลดรูปภาพจริง)</span>
                </label>

                {/* Hidden file input controlled by button */}
                <input
                  ref={newFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                />

                <button
                  type="button"
                  id="btn-upload-new-avatar"
                  onClick={() => newFileInputRef.current?.click()}
                  className="text-xs text-blue-300 hover:text-white font-bold cursor-pointer flex items-center gap-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 px-3 py-1.5 rounded-xl transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📁 เลือกรูปจากอุปกรณ์</span>
                </button>
              </div>

              {/* Avatar Preview */}
              {avatarPreview ? (
                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded-xl border border-emerald-500/50 shadow-md">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow flex-shrink-0"
                  />
                  <div className="flex-1 text-xs">
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>รูปโปรไฟล์พร้อมใช้งาน (สัดส่วน 1:1)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ปรับตำแหน่งและซูมจัดวางใบหน้าตรงกลางเรียบร้อย
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      id="btn-recrop-new-avatar"
                      onClick={() => handleOpenCropForExisting(avatarPreview, false)}
                      className="text-xs text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg border border-cyan-600/60 bg-cyan-950/70 hover:bg-cyan-900 transition cursor-pointer flex items-center gap-1 font-bold"
                      title="ปรับตำแหน่ง ซูม และสัดส่วนรูปภาพใหม่"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>ปรับสัดส่วน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => newFileInputRef.current?.click()}
                      className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                    >
                      เปลี่ยนรูป
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAvatarUrl('');
                        setAvatarPreview('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-800/80 hover:bg-rose-950 transition cursor-pointer"
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-500">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-slate-300 font-medium block">
                        ยังไม่ได้เลือกรูปโปรไฟล์
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (หากไม่เลือก ระบบจะสร้าง Avatar อักษรย่อให้โดยอัตโนมัติ)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => newFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    อัปโหลดรูป
                  </button>
                </div>
              )}
            </div>

            <div className="text-right pt-1">
              <button
                id="submit-add-emp-btn"
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/30"
              >
                {isSubmitting ? 'กำลังบันทึก...' : '+ บันทึกพนักงานใหม่'}
              </button>
            </div>
          </form>

          {/* =========================================================================
              SECTION 2: EMPLOYEES LIST & EDIT
             ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                รายชื่อพนักงานทั้งหมด ({employees.length} คน)
              </h3>
              <span className="text-[11px] text-slate-400">
                สามารถแก้ไขรูป ชื่อ สังกัด หรือลบพนักงานได้ที่นี่
              </span>
            </div>

            {employees.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                ยังไม่มีรายชื่อพนักงานในระบบ กรุณากรอกแบบฟอร์มด้านบนเพื่อเพิ่มพนักงาน
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employees.map((emp) => {
                  const isEditing = editingEmpId === emp.id;

                  return (
                    <div
                      key={emp.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isEditing
                          ? 'bg-slate-850 border-amber-500 ring-2 ring-amber-500/30 shadow-lg col-span-1 sm:col-span-2'
                          : emp.active
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-850 opacity-60'
                      }`}
                    >
                      {!isEditing ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow flex-shrink-0"
                                style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                              >
                                {emp.nickname || emp.name.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-black text-white truncate">
                                  {emp.name}
                                </span>
                                {emp.brandCode && (
                                  <span className="text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded">
                                    {emp.brandCode}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {emp.nickname && (
                                  <span className="bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                    {emp.nickname}
                                  </span>
                                )}
                                {emp.brand && (
                                  <span className="text-[11px] text-slate-300">
                                    สังกัด: {emp.brand}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {onToggleActiveEmployee && (
                              <button
                                type="button"
                                onClick={() => onToggleActiveEmployee(emp.id)}
                                title={emp.active ? 'คลิกเพื่อระงับการลงคิว' : 'คลิกเพื่อเปิดใช้งาน'}
                                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                                  emp.active
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {emp.active ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEditEmployee(emp)}
                              title="แก้ไขพนักงาน / เปลี่ยนรูปโปรไฟล์"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {confirmDeleteEmpId === emp.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  ยืนยันลบ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteEmpId(null)}
                                  className="p-1 text-slate-400 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEmpId(emp.id)}
                                title="ลบพนักงานถาวร"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Editing Employee */
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>แก้ไขข้อมูลพนักงาน: {emp.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingEmpId(null)}
                              className="text-slate-400 hover:text-white text-xs cursor-pointer"
                            >
                              ✕ ยกเลิก
                            </button>
                          </div>

                          {/* Avatar Edit with Live Preview */}
                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {editAvatarUrl ? (
                                <img
                                  src={editAvatarUrl}
                                  alt="Preview"
                                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shadow"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                                  style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                                >
                                  {editNickname || editName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {editAvatarUrl ? 'มีรูปภาพโปรไฟล์' : 'ยังไม่มีรูปภาพ (ใช้อักษรย่อ)'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  อัปโหลดรูปภาพใหม่หรือลบรูปออกได้
                                </span>
                              </div>
                            </div>

                            <input
                              ref={editFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, true)}
                              className="hidden"
                            />

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => editFileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Upload className="w-3 h-3" />
                                <span>เปลี่ยนรูป</span>
                              </button>
                              {editAvatarUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCropForExisting(editAvatarUrl, true)}
                                  className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="ปรับตำแหน่ง ซูม และสัดส่วนรูปภาพ"
                                >
                                  <Crop className="w-3 h-3" />
                                  <span>ปรับสัดส่วน</span>
                                </button>
                              )}
                              {editAvatarUrl && (
                                <button
                                  type="button"
                                  onClick={() => setEditAvatarUrl('')}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs rounded-lg transition cursor-pointer"
                                >
                                  ลบรูปออก
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                                ชื่อ-นามสกุล *
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                                ชื่อเล่น
                              </label>
                              <input
                                type="text"
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>

                          {/* Change Brand Preset */}
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                              เปลี่ยนสังกัดแบรนด์สี:
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {effectiveBrands.map((b) => (
                                <button
                                  key={b.id || b.code}
                                  type="button"
                                  onClick={() => handleSelectBrandForEdit(b)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                                    editBrand === b.name
                                      ? 'bg-rose-600 text-white ring-1 ring-rose-400'
                                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {b.name} [{b.code}]
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setEditingEmpId(null)}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditEmployee(emp.id)}
                              disabled={isSubmitting}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                            >
                              บันทึกการแก้ไข
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
