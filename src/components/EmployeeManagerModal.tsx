import React, { useState } from 'react';
import {
  Users,
  X,
  Plus,
  Check,
  Camera,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Edit2,
  Tag,
} from 'lucide-react';
import { Employee, MachineId } from '../types';
import { FUN_AVATARS, PAINT_BRANDS } from '../constants';

interface EmployeeManagerModalProps {
  isOpen: boolean;
  employees: Employee[];
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
}

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({
  isOpen,
  employees,
  machineId,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [brand, setBrand] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(FUN_AVATARS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Editing state for existing employee
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editNickname, setEditNickname] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [editBrandCode, setEditBrandCode] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditMode = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (isEditMode) {
        setEditAvatarUrl(base64);
      } else {
        setSelectedAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectBrandPreset = (preset: { brand: string; brandCode: string }) => {
    setBrand(preset.brand);
    setBrandCode(preset.brandCode);
  };

  const handleSelectEditBrandPreset = (preset: { brand: string; brandCode: string }) => {
    setEditBrand(preset.brand);
    setEditBrandCode(preset.brandCode);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const finalAvatar = customUrlInput.trim() || selectedAvatarUrl;
      await onAddEmployee(
        name.trim(),
        nickname.trim() || undefined,
        finalAvatar || undefined,
        brand.trim() || undefined,
        brandCode.trim()?.toUpperCase() || undefined
      );
      setSuccessMsg(`เพิ่มพนักงาน "${name.trim()}" เรียบร้อยแล้ว`);
      setName('');
      setNickname('');
      setBrand('');
      setBrandCode('');
      setCustomUrlInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเพิ่มพนักงานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditName(emp.name);
    setEditAvatarUrl(emp.avatarUrl || '');
    setEditNickname(emp.nickname || '');
    setEditBrand(emp.brand || '');
    setEditBrandCode(emp.brandCode || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEdit = async (empId: string) => {
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
      setSuccessMsg('บันทึกข้อมูลพนักงานเรียบร้อยแล้ว');
      setEditingEmpId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="employee-mgr-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="employee-mgr-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-3xl w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xl shadow">
              👥
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">รายชื่อพนักงานและรูปโปรไฟล์</h2>
              <p className="text-xs text-slate-400">
                รูปโปรไฟล์จะถูกแสดงขนาดใหญ่เมื่อขึ้นคิวบริการลูกค้า (รองรับรูปตนเอง, Avatar, Meme)
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

        {/* Success / Error Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body with 2 columns / sections */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Section 1: Add New Employee */}
          <form
            onSubmit={handleSubmitNew}
            className="p-4 sm:p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4"
          >
            <div className="text-sm font-black text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>เพิ่มพนักงานใหม่เข้าสู่ระบบ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  ชื่อ-นามสกุลพนักงาน *
                </label>
                <input
                  id="new-emp-name-input"
                  type="text"
                  placeholder="เช่น สมศักดิ์ สุขใจ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  ชื่อเล่น / อักษรย่อ
                </label>
                <input
                  id="new-emp-nickname-input"
                  type="text"
                  placeholder="เช่น A, เก่ง, มอส"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Brand & Brand Code Selection */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-400" />
                  <span>สังกัดแบรนด์สี (Brand) & รหัสแบรนด์ (Brand Code)</span>
                </label>
                <span className="text-[10px] text-slate-400">คลิกปุ่มแบรนด์เพื่อเติมรหัสอัตโนมัติ</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PAINT_BRANDS.map((pb) => (
                  <button
                    key={pb.brandCode}
                    type="button"
                    onClick={() => handleSelectBrandPreset(pb)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      brandCode === pb.brandCode
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <span>{pb.brand}</span>
                    <span className="text-[10px] opacity-75 font-mono">[{pb.brandCode}]</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    ชื่อแบรนด์ (เช่น Nippon Paint, TOA, JBP)
                  </label>
                  <input
                    id="new-emp-brand-input"
                    type="text"
                    placeholder="เช่น Nippon Paint"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    รหัสแบรนด์ย่อ (Brand Code เช่น NPT, TOA, BGR)
                  </label>
                  <input
                    id="new-emp-brandcode-input"
                    type="text"
                    placeholder="เช่น NPT"
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-500 transition uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>เลือกรูปโปรไฟล์ / Avatar สนุก ๆ สำหรับขึ้นคิว:</span>
                </label>
                <label className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>อัปโหลดรูปจากเครื่อง</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {FUN_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatarUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarUrl(avatar.url);
                        setCustomUrlInput('');
                      }}
                      title={avatar.name}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/30'
                          : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
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

          {/* Section 2: Existing Employees List with Photo Editing */}
          <div>
            <div className="text-xs font-black text-slate-400 mb-3 flex items-center justify-between">
              <span>พนักงานปัจจุบัน ({employees.length} คน) • คลิก "เปลี่ยนรูป" เพื่ออัปเดต:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.map((emp) => {
                const isEditing = editingEmpId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isEditing
                        ? 'bg-slate-800/90 border-orange-500/80 shadow-lg shadow-orange-950/40 ring-1 ring-orange-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {!isEditing ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow flex-shrink-0"
                              style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                            >
                              {emp.nickname || emp.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white">{emp.name}</span>
                              {emp.brandCode && (
                                <span className="text-[11px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded shadow-sm">
                                  {emp.brandCode}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {emp.nickname && (
                                <span className="bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[11px]">
                                  {emp.nickname}
                                </span>
                              )}
                              {emp.brand && (
                                <span className="text-[11px] text-slate-300">
                                  {emp.brand}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">ID: {emp.id}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(emp)}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>แก้ไขข้อมูล</span>
                        </button>
                      </div>
                    ) : (
                      /* Active Edit Mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                          <span className="text-xs font-bold text-orange-400">
                            แก้ไขข้อมูลพนักงาน: {emp.name}
                          </span>
                          <button
                            onClick={() => setEditingEmpId(null)}
                            className="text-slate-400 hover:text-white text-xs"
                          >
                            ยกเลิก
                          </button>
                        </div>

                        {/* Name & Nickname fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              ชื่อ-นามสกุล
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="ชื่อ-นามสกุล"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              ชื่อเล่น / ย่อ
                            </label>
                            <input
                              type="text"
                              value={editNickname}
                              onChange={(e) => setEditNickname(e.target.value)}
                              placeholder="ชื่อเล่น"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Edit Brand & Brand Code */}
                        <div className="p-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-rose-400" />
                              <span>แบรนด์ & รหัสแบรนด์:</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {PAINT_BRANDS.map((pb) => (
                              <button
                                key={pb.brandCode}
                                type="button"
                                onClick={() => handleSelectEditBrandPreset(pb)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  editBrandCode === pb.brandCode
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                                }`}
                              >
                                <span>{pb.brand}</span>
                                <span className="font-mono opacity-80">[{pb.brandCode}]</span>
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="ชื่อแบรนด์"
                              value={editBrand}
                              onChange={(e) => setEditBrand(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                            />
                            <input
                              type="text"
                              placeholder="รหัสแบรนด์ (เช่น NPT)"
                              value={editBrandCode}
                              onChange={(e) => setEditBrandCode(e.target.value.toUpperCase())}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-rose-300 uppercase"
                            />
                          </div>
                        </div>

                        {/* Presets Grid for editing */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-slate-400">เลือกรูป Avatar / Meme:</span>
                            <label className="text-[10px] text-orange-400 hover:text-orange-300 font-bold cursor-pointer flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              <span>อัปโหลดรูป</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, true)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {FUN_AVATARS.map((avatar) => {
                              const isCur = editAvatarUrl === avatar.url;
                              return (
                                <button
                                  key={avatar.id}
                                  type="button"
                                  onClick={() => setEditAvatarUrl(avatar.url)}
                                  className={`rounded-lg overflow-hidden aspect-square border-2 transition p-0.5 cursor-pointer ${
                                    isCur ? 'border-orange-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img
                                    src={avatar.url}
                                    alt={avatar.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingEmpId(null)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleSaveEdit(emp.id)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรูปใหม่'}
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

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
