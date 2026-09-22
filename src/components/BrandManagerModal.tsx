import React, { useState } from 'react';
import {
  Tag,
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Palette,
  AlertCircle,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { BrandItem, Employee, MachineId } from '../types';

interface BrandManagerModalProps {
  isOpen: boolean;
  brands: BrandItem[];
  employees: Employee[];
  machineId: MachineId;
  onClose: () => void;
  onAddBrand: (name: string, code: string, color?: string) => Promise<void>;
  onUpdateBrand: (id: string, name: string, code: string, color?: string) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
}

// Preset color palette for quick selection
const BRAND_COLORS = [
  '#2563eb', // Blue (TOA)
  '#ea580c', // Orange (BEGER)
  '#dc2626', // Red (NIPPON)
  '#0284c7', // Sky Blue (CAPTAIN)
  '#d97706', // Amber (JOTUN)
  '#7c3aed', // Purple (DULUX)
  '#10b981', // Emerald (DELTA)
  '#16a34a', // Green (JBP)
  '#854d0e', // Brown (WOODTECT)
  '#ec4899', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

export const BrandManagerModal: React.FC<BrandManagerModalProps> = ({
  isOpen,
  brands = [],
  employees = [],
  onClose,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
}) => {
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCode, setNewBrandCode] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#2563eb');

  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandNameInput, setEditBrandNameInput] = useState('');
  const [editBrandCodeInput, setEditBrandCodeInput] = useState('');
  const [editBrandColorInput, setEditBrandColorInput] = useState('#2563eb');

  const [confirmDeleteBrandId, setConfirmDeleteBrandId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate 3-letter code when typing brand name
  const handleNameChange = (val: string) => {
    setNewBrandName(val);
    if (!newBrandCode || newBrandCode.length <= 4) {
      const generated = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase();
      if (generated) {
        setNewBrandCode(generated);
      }
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setErrorMsg('กรุณาระบุชื่อแบรนด์สี');
      return;
    }

    const code = (newBrandCode.trim() || newBrandName.trim().slice(0, 3)).toUpperCase();

    // Check duplicate
    const isDuplicate = brands.some(
      (b) =>
        b.name.trim().toLowerCase() === newBrandName.trim().toLowerCase() ||
        b.code.trim().toUpperCase() === code
    );
    if (isDuplicate) {
      setErrorMsg(`มีแบรนด์ "${newBrandName.trim()}" หรือรหัส "${code}" ในระบบแล้ว`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onAddBrand(newBrandName.trim(), code, newBrandColor);
      setSuccessMsg(`เพิ่มแบรนด์ "${newBrandName.trim()}" [${code}] สำเร็จและบันทึกถาวรแล้ว`);
      setNewBrandName('');
      setNewBrandCode('');
      setNewBrandColor('#2563eb');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเพิ่มแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditBrand = (brand: BrandItem) => {
    setEditingBrandId(brand.id);
    setEditBrandNameInput(brand.name);
    setEditBrandCodeInput(brand.code);
    setEditBrandColorInput(brand.color || '#2563eb');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEditBrand = async (brandId: string) => {
    if (!editBrandNameInput.trim()) {
      setErrorMsg('กรุณาระบุชื่อแบรนด์สี');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateBrand(
        brandId,
        editBrandNameInput.trim(),
        editBrandCodeInput.trim().toUpperCase() || editBrandNameInput.trim().slice(0, 3).toUpperCase(),
        editBrandColorInput
      );
      setSuccessMsg(`บันทึกการแก้ไขแบรนด์ "${editBrandNameInput.trim()}" สำเร็จแล้ว`);
      setEditingBrandId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถแก้ไขแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onDeleteBrand(brandId);
      setSuccessMsg('ลบแบรนด์เรียบร้อยแล้ว');
      setConfirmDeleteBrandId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบแบรนด์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="brand-manager-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="brand-manager-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full p-6 text-white animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-950/50">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                จัดการแบรนด์สี (Brand Management)
              </h2>
              <p className="text-xs text-slate-400">
                แยกส่วนการตั้งค่าแบรนด์สีให้ชัดเจน พร้อมบันทึกถาวร
              </p>
            </div>
          </div>
          <button
            id="close-brand-manager-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
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

        <div className="overflow-y-auto flex-1 pr-1 mt-4 space-y-4">
          {/* Official Brands Banner */}
          <div className="p-3.5 bg-slate-950/80 border border-blue-500/30 rounded-2xl text-xs text-slate-300 flex items-start gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                แบรนด์สีมาตรฐานของแผนกสี:
              </span>
              <span className="text-slate-300 leading-relaxed font-mono text-[11px]">
                TOA • BEGER • NIPPON • CAPTAIN • JOTUN • DULUX • DELTA • JBP • WOODTECT
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                สามารถกำหนดสี รหัสย่อ และเพิ่มแบรนด์ใหม่เข้ามาใช้งานได้ตลอดเวลา ข้อมูลจะคงอยู่ถาวร
              </p>
            </div>
          </div>

          {/* Form: Add New Brand */}
          <form
            onSubmit={handleCreateBrand}
            className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3 shadow-inner"
          >
            <div className="text-xs font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>เพิ่มแบรนด์สีใหม่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">
                  ชื่อแบรนด์สี *
                </label>
                <input
                  id="new-brand-name-input"
                  type="text"
                  placeholder="เช่น TOA, BEGER, RUST-OLEUM"
                  value={newBrandName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">
                  รหัสย่อ (2-4 ตัวอักษร) *
                </label>
                <input
                  id="new-brand-code-input"
                  type="text"
                  maxLength={5}
                  placeholder="เช่น TOA, BGR, NPT"
                  value={newBrandCode}
                  onChange={(e) => setNewBrandCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-rose-500 transition"
                  required
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
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex flex-wrap gap-1">
                    {BRAND_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewBrandColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                          newBrandColor === c ? 'border-white scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right pt-1">
              <button
                id="btn-submit-brand"
                type="submit"
                disabled={!newBrandName.trim() || isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-900/40"
              >
                {isSubmitting ? 'กำลังบันทึก...' : '+ บันทึกแบรนด์ใหม่'}
              </button>
            </div>
          </form>

          {/* Brands List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>แบรนด์สีทั้งหมดในระบบ ({brands.length} แบรนด์)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                คลิกรูปดินสอเพื่อแก้ไขชื่อ/รหัส/สี
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {brands.map((b) => {
                const isEditing = editingBrandId === b.id;
                // Count employees currently assigned to this brand
                const assignedCount = employees.filter(
                  (e) => e.brand === b.name || e.brandCode === b.code
                ).length;

                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isEditing
                        ? 'bg-slate-850 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {!isEditing ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow flex-shrink-0"
                            style={{ backgroundColor: b.color || '#2563eb' }}
                          >
                            {b.code.slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-black text-white truncate">
                                {b.name}
                              </span>
                              <span
                                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shadow-sm"
                                style={{
                                  backgroundColor: `${b.color || '#2563eb'}20`,
                                  borderColor: `${b.color || '#2563eb'}60`,
                                  color: b.color || '#93c5fd',
                                }}
                              >
                                [{b.code}]
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>{assignedCount} คนในสังกัด</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditBrand(b)}
                            title="แก้ไขแบรนด์"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteBrandId === b.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteBrand(b.id)}
                                className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                ยืนยันลบ
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteBrandId(null)}
                                className="p-1 text-slate-400 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (assignedCount > 0) {
                                  setErrorMsg(
                                    `ไม่สามารถลบ "${b.name}" ได้เนื่องจากมีพนักงาน ${assignedCount} คนอยู่ในสังกัดนี้ กรุณาย้ายพนักงานก่อน`
                                  );
                                  return;
                                }
                                setConfirmDeleteBrandId(b.id);
                              }}
                              title="ลบแบรนด์"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" />
                            <span>แก้ไขแบรนด์: {b.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingBrandId(null)}
                            className="text-slate-400 hover:text-white text-xs"
                          >
                            ✕ ยกเลิก
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              ชื่อแบรนด์
                            </label>
                            <input
                              type="text"
                              value={editBrandNameInput}
                              onChange={(e) => setEditBrandNameInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              รหัสย่อ
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              value={editBrandCodeInput}
                              onChange={(e) => setEditBrandCodeInput(e.target.value.toUpperCase())}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white uppercase font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            สีประจำแบรนด์
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editBrandColorInput}
                              onChange={(e) => setEditBrandColorInput(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                            />
                            <div className="flex flex-wrap gap-1">
                              {BRAND_COLORS.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setEditBrandColorInput(c)}
                                  style={{ backgroundColor: c }}
                                  className={`w-4 h-4 rounded-full border ${
                                    editBrandColorInput === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingBrandId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditBrand(b.id)}
                            disabled={isSubmitting}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
