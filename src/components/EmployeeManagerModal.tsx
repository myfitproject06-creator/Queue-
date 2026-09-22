import React, { useState } from 'react';
import {
  Users,
  X,
  Plus,
  Check,
  Upload,
  Sparkles,
  Edit2,
  Tag,
  Trash2,
  Palette,
  Image as ImageIcon,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { BrandItem, Employee, MachineId } from '../types';
import { FUN_AVATARS, DEFAULT_PAINT_BRANDS } from '../constants';

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
  onAddBrand?: (name: string, code: string, color?: string) => Promise<void>;
  onUpdateBrand?: (id: string, name: string, code: string, color?: string) => Promise<void>;
  onDeleteBrand?: (id: string) => Promise<void>;
}

// Compress uploaded image through browser canvas to keep under 100KB
function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({
  isOpen,
  employees,
  brands = [],
  machineId,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onToggleActiveEmployee,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
}) => {
  // Tabs: 'STAFF' | 'BRANDS'
  const [activeTab, setActiveTab] = useState<'STAFF' | 'BRANDS'>('STAFF');

  // Form State: Add Employee
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Editing state for existing employee
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editNickname, setEditNickname] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [editBrandCode, setEditBrandCode] = useState<string>('');

  // Brand Management State
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCode, setNewBrandCode] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#2563eb');
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandNameInput, setEditBrandNameInput] = useState('');
  const [editBrandCodeInput, setEditBrandCodeInput] = useState('');
  const [editBrandColorInput, setEditBrandColorInput] = useState('#2563eb');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDeleteEmpId, setConfirmDeleteEmpId] = useState<string | null>(null);

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditMode = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    try {
      setErrorMsg(null);
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      if (isEditMode) {
        setEditAvatarUrl(compressedDataUrl);
      } else {
        setSelectedAvatarUrl(compressedDataUrl);
        setAvatarPreview(compressedDataUrl);
      }
      setSuccessMsg('อัปโหลดรูปภาพสำเร็จ');
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    }
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
    setEditBrand(b.name);
    setEditBrandCode(b.code);
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
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateEmployee(empId, {
        name: editName.trim() || undefined,
        avatarUrl: editAvatarUrl || undefined,
        nickname: editNickname.trim() || undefined,
        brand: editBrand.trim() || undefined,
        brandCode: editBrandCode.trim()?.toUpperCase() || undefined,
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
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบพนักงานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setErrorMsg('กรุณากรอกชื่อแบรนด์');
      return;
    }
    if (!onAddBrand) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const code = (newBrandCode || newBrandName.slice(0, 3)).trim().toUpperCase();
      await onAddBrand(newBrandName.trim(), code, newBrandColor);
      setSuccessMsg(`เพิ่มแบรนด์ "${newBrandName.trim()}" สำเร็จ`);
      setNewBrandName('');
      setNewBrandCode('');
      setNewBrandColor('#2563eb');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเพิ่มแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditBrand = async (brandId: string) => {
    if (!onUpdateBrand || !editBrandNameInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateBrand(
        brandId,
        editBrandNameInput.trim(),
        editBrandCodeInput.trim().toUpperCase(),
        editBrandColorInput
      );
      setSuccessMsg('แก้ไขข้อมูลแบรนด์เรียบร้อยแล้ว');
      setEditingBrandId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถแก้ไขแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!onDeleteBrand) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onDeleteBrand(brandId);
      setSuccessMsg('ลบแบรนด์เรียบร้อยแล้ว');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="employee-mgr-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="employee-mgr-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 text-white animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xl shadow">
              👥
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                ตั้งค่าพนักงานและสังกัดแบรนด์สี
              </h2>
              <p className="text-xs text-slate-400">
                แยกจัดการแบรนด์และพนักงานอย่างชัดเจน • บันทึกถาวรลงฐานข้อมูล
              </p>
            </div>
          </div>
          <button
            id="close-emp-mgr-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Staff vs Brands) */}
        <div className="flex items-center gap-2 mt-3 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('STAFF');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>รายชื่อพนักงาน ({employees.length} คน)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('BRANDS');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'BRANDS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>จัดการแบรนด์สี ({effectiveBrands.length} แบรนด์)</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-5">
          {/* =========================================================================
              TAB 1: STAFF (รายชื่อพนักงาน)
             ========================================================================= */}
          {activeTab === 'STAFF' && (
            <>
              {/* Form: Add New Employee */}
              <form
                onSubmit={handleSubmitNewEmployee}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>เพิ่มพนักงานใหม่</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ข้อมูลจะถูกบันทึกถาวรในฐานข้อมูล
                  </span>
                </div>

                {/* Step 1: Brand Selection (Cleanly Separated) */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-rose-400" />
                      <span>ขั้นตอนที่ 1: เลือกสังกัดแบรนด์สี</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {selectedBrand ? (
                        <span className="text-rose-400 font-bold">
                          เลือก: {selectedBrand} [{selectedBrandCode}]
                        </span>
                      ) : (
                        'ไม่ระบุสังกัด (อิสระ)'
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {effectiveBrands.map((b) => {
                      const isSelected = selectedBrand === b.name;
                      return (
                        <button
                          key={b.id || b.code}
                          type="button"
                          onClick={() => handleSelectBrandForNew(b)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-400'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-750'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: b.color || '#3b82f6' }}
                          />
                          <span>{b.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">[{b.code}]</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Employee Name & Nickname */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>ขั้นตอนที่ 2: ข้อมูลประจำตัวพนักงาน</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">
                        ชื่อ-นามสกุลพนักงาน *
                      </label>
                      <input
                        id="new-emp-name-input"
                        type="text"
                        placeholder="เช่น สมชาย ใจดี"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">
                        ชื่อเล่น / อักษรย่อเรียกง่าย
                      </label>
                      <input
                        id="new-emp-nickname-input"
                        type="text"
                        placeholder="เช่น ชาย, A, ต้อม"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Avatar / Profile Picture Upload */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>ขั้นตอนที่ 3: รูปโปรไฟล์ (อัปโหลดรูปจริง หรือเลือก Avatar)</span>
                    </label>
                    <label className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1 bg-blue-950/60 border border-blue-500/40 px-2 py-1 rounded-lg transition">
                      <Upload className="w-3 h-3" />
                      <span>📁 เลือกรูปจากอุปกรณ์</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preview uploaded picture */}
                  {avatarPreview ? (
                    <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-500 shadow"
                      />
                      <div className="flex-1 text-xs">
                        <div className="text-emerald-400 font-bold">ใช้รูปภาพที่อัปโหลดแล้ว</div>
                        <div className="text-[11px] text-slate-400">รูปจะถูกบันทึกพร้อมข้อมูลพนักงาน</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAvatarUrl('');
                          setAvatarPreview('');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-800 hover:bg-rose-950"
                      >
                        ยกเลิกรูป
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400">หรือเลือกคาแรคเตอร์ตัวการ์ตูน:</div>
                      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                        {FUN_AVATARS.slice(0, 10).map((avatar) => {
                          const isSelected = selectedAvatarUrl === avatar.url;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => {
                                setSelectedAvatarUrl(avatar.url);
                                setAvatarPreview(avatar.url);
                              }}
                              title={avatar.name}
                              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                                isSelected
                                  ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                                  : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                              }`}
                            >
                              <img
                                src={avatar.url}
                                alt={avatar.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-white drop-shadow font-bold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <button
                    id="submit-add-emp-btn"
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/30"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : '+ บันทึกพนักงานใหม่'}
                  </button>
                </div>
              </form>

              {/* Staff List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    รายชื่อพนักงานทั้งหมด ({employees.length} คน)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    สามารถแก้ไขแบรนด์ หรือลบพนักงานได้ที่นี่
                  </span>
                </div>

                {employees.length === 0 ? (
                  <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center text-2xl mb-2">
                      👥
                    </div>
                    <div className="text-sm font-bold text-slate-300">
                      ยังไม่มีรายชื่อพนักงานในระบบ
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      กรอกแบบฟอร์มด้านบนเพื่อเพิ่มรายชื่อพนักงานจริงของแผนกสีเข้าสู่ระบบ
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {employees.map((emp) => {
                      const isEditing = editingEmpId === emp.id;

                      return (
                        <div
                          key={emp.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            isEditing
                              ? 'bg-slate-850 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
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
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow flex-shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow flex-shrink-0"
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
                                        {emp.brand}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditEmployee(emp)}
                                  title="แก้ไขพนักงาน"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteEmpId === emp.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteEmployee(emp.id)}
                                      className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
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
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                                <span className="text-xs font-bold text-amber-300">
                                  แก้ไขข้อมูล: {emp.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmpId(null)}
                                  className="text-slate-400 hover:text-white text-xs"
                                >
                                  ✕ ปิด
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">
                                    ชื่อ-นามสกุล
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">
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
                                <label className="text-[10px] text-slate-400 block mb-1">
                                  เปลี่ยนสังกัดแบรนด์สี:
                                </label>
                                <div className="flex flex-wrap gap-1">
                                  {effectiveBrands.map((b) => (
                                    <button
                                      key={b.id || b.code}
                                      type="button"
                                      onClick={() => handleSelectBrandForEdit(b)}
                                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                        editBrand === b.name
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                                      }`}
                                    >
                                      {b.name} [{b.code}]
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Upload New Avatar */}
                              <div>
                                <label className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  <span>เปลี่ยนรูปโปรไฟล์ (อัปโหลดรูปใหม่)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, true)}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingEmpId(null)}
                                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditEmployee(emp.id)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
            </>
          )}

          {/* =========================================================================
              TAB 2: BRANDS (จัดการสังกัดแบรนด์สี)
             ========================================================================= */}
          {activeTab === 'BRANDS' && (
            <div className="space-y-4">
              {/* Form: Add Brand */}
              <form
                onSubmit={handleCreateBrand}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="text-sm font-black text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>เพิ่มแบรนด์สีใหม่</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      ชื่อแบรนด์ *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น TOA, BEGER, NIPPON"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      รหัสย่อ (Brand Code)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น TOA, BGR, NPT"
                      value={newBrandCode}
                      onChange={(e) => setNewBrandCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-300 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      สีประจำแบรนด์
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBrandColor}
                        onChange={(e) => setNewBrandColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={newBrandColor}
                        onChange={(e) => setNewBrandColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    disabled={!newBrandName.trim() || isSubmitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow"
                  >
                    + บันทึกแบรนด์ใหม่
                  </button>
                </div>
              </form>

              {/* Brands Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    รายการแบรนด์สีทั้งหมด ({effectiveBrands.length} แบรนด์)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    แสดงจำนวนพนักงานที่สังกัดแต่ละแบรนด์
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {effectiveBrands.map((brandItem) => {
                    const employeeCount = employees.filter(
                      (e) =>
                        e.brand?.toLowerCase() === brandItem.name.toLowerCase() ||
                        e.brandCode?.toLowerCase() === brandItem.code.toLowerCase()
                    ).length;

                    const isEditing = editingBrandId === brandItem.id;

                    return (
                      <div
                        key={brandItem.id || brandItem.code}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between"
                      >
                        {!isEditing ? (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow"
                                  style={{ backgroundColor: brandItem.color || '#2563eb' }}
                                />
                                <div>
                                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span>{brandItem.name}</span>
                                    <span className="text-[10px] font-mono text-rose-300 font-bold bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                                      {brandItem.code}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    พนักงานสังกัด: <strong className="text-slate-200">{employeeCount}</strong> คน
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBrandId(brandItem.id);
                                    setEditBrandNameInput(brandItem.name);
                                    setEditBrandCodeInput(brandItem.code);
                                    setEditBrandColorInput(brandItem.color || '#2563eb');
                                  }}
                                  title="แก้ไขแบรนด์"
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                {effectiveBrands.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBrand(brandItem.id)}
                                    title="ลบแบรนด์"
                                    className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Editing Brand */
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editBrandNameInput}
                              onChange={(e) => setEditBrandNameInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                              placeholder="ชื่อแบรนด์"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editBrandCodeInput}
                                onChange={(e) => setEditBrandCodeInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-rose-300 font-bold uppercase"
                                placeholder="รหัสแบรนด์"
                              />
                              <input
                                type="color"
                                value={editBrandColorInput}
                                onChange={(e) => setEditBrandColorInput(e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingBrandId(null)}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditBrand(brandItem.id)}
                                className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                              >
                                บันทึก
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
