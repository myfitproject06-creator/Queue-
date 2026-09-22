import { QuickReasonOption, ThemePreset } from './types';
import tanjiroImg from './assets/images/tanjiro_water_hero_1790082606263.jpg';
import akazaImg from './assets/images/akaza_demon_hero_1790082624551.jpg';
import nezukoImg from './assets/images/nezuko_demon_girl_1790082690415.jpg';
import rengokuImg from './assets/images/rengoku_flame_hero_1790082704866.jpg';
import zenitsuImg from './assets/images/zenitsu_thunder_hero_1790082721020.jpg';

export { tanjiroImg, akazaImg, nezukoImg, rengokuImg, zenitsuImg };

export const QUICK_REASONS: QuickReasonOption[] = [
  { key: 'HOME', label: 'กลับบ้าน / เลิกงาน', icon: '🏠' },
  { key: 'LUNCH_BREAK', label: 'พัก / กินข้าว', icon: '🍚' },
  { key: 'OTHER_WORK', label: 'ไปทำงานอื่น / ยกของ', icon: '🧰' },
  { key: 'AWAY_FROM_DESK', label: 'ไม่อยู่ที่จุด / เข้าห้องน้ำ', icon: '🚶' },
  { key: 'WRONG_ENTRY', label: 'ลงคิวผิด', icon: '⚠️' },
  { key: 'OTHER', label: 'อื่น ๆ (พิมพ์ระบุ)', icon: '✏️' },
];

export const MACHINE_NAMES = {
  PC_LEFT: 'PC กลางฝั่ง LEFT',
  PC_RIGHT: 'PC กลางฝั่ง RIGHT',
} as const;

export interface PaintBrandPreset {
  brand: string;
  brandCode: string;
  color: string;
}

export const DEFAULT_PAINT_BRANDS: PaintBrandPreset[] = [
  { brand: 'TOA', brandCode: 'TOA', color: '#2563eb' },
  { brand: 'BEGER', brandCode: 'BGR', color: '#ea580c' },
  { brand: 'NIPPON', brandCode: 'NPT', color: '#dc2626' },
  { brand: 'CAPTAIN', brandCode: 'CPT', color: '#0284c7' },
  { brand: 'JOTUN', brandCode: 'JTN', color: '#d97706' },
  { brand: 'DULUX', brandCode: 'DLX', color: '#7c3aed' },
  { brand: 'DELTA', brandCode: 'DLT', color: '#0d9488' },
  { brand: 'JBP', brandCode: 'JBP', color: '#16a34a' },
  { brand: 'WOODTECT', brandCode: 'WDT', color: '#92400e' },
];

export const PAINT_BRANDS: PaintBrandPreset[] = DEFAULT_PAINT_BRANDS;

export interface BrandVisualInfo {
  brand: string;
  brandCode: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  ringClass: string;
  tintBg: string;
}

const BRAND_PALETTES: Record<string, BrandVisualInfo> = {
  TOA: {
    brand: 'TOA',
    brandCode: 'TOA',
    color: '#2563eb',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    borderClass: 'border-blue-500',
    ringClass: 'ring-blue-500',
    tintBg: 'rgba(37, 99, 235, 0.12)',
  },
  BEGER: {
    brand: 'BEGER',
    brandCode: 'BGR',
    color: '#ea580c',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    borderClass: 'border-orange-500',
    ringClass: 'ring-orange-500',
    tintBg: 'rgba(234, 88, 12, 0.12)',
  },
  BGR: {
    brand: 'BEGER',
    brandCode: 'BGR',
    color: '#ea580c',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    borderClass: 'border-orange-500',
    ringClass: 'ring-orange-500',
    tintBg: 'rgba(234, 88, 12, 0.12)',
  },
  NIPPON: {
    brand: 'NIPPON',
    brandCode: 'NPT',
    color: '#dc2626',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    borderClass: 'border-red-500',
    ringClass: 'ring-red-500',
    tintBg: 'rgba(220, 38, 38, 0.12)',
  },
  NPT: {
    brand: 'NIPPON',
    brandCode: 'NPT',
    color: '#dc2626',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    borderClass: 'border-red-500',
    ringClass: 'ring-red-500',
    tintBg: 'rgba(220, 38, 38, 0.12)',
  },
  JOTUN: {
    brand: 'JOTUN',
    brandCode: 'JTN',
    color: '#d97706',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    borderClass: 'border-amber-500',
    ringClass: 'ring-amber-500',
    tintBg: 'rgba(217, 119, 6, 0.12)',
  },
  JTN: {
    brand: 'JOTUN',
    brandCode: 'JTN',
    color: '#d97706',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    borderClass: 'border-amber-500',
    ringClass: 'ring-amber-500',
    tintBg: 'rgba(217, 119, 6, 0.12)',
  },
  DULUX: {
    brand: 'DULUX',
    brandCode: 'DLX',
    color: '#7c3aed',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    borderClass: 'border-purple-500',
    ringClass: 'ring-purple-500',
    tintBg: 'rgba(124, 58, 237, 0.12)',
  },
  DLX: {
    brand: 'DULUX',
    brandCode: 'DLX',
    color: '#7c3aed',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    borderClass: 'border-purple-500',
    ringClass: 'ring-purple-500',
    tintBg: 'rgba(124, 58, 237, 0.12)',
  },
  CAPTAIN: {
    brand: 'CAPTAIN',
    brandCode: 'CPT',
    color: '#0284c7',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    borderClass: 'border-sky-500',
    ringClass: 'ring-sky-500',
    tintBg: 'rgba(2, 132, 199, 0.12)',
  },
  CPT: {
    brand: 'CAPTAIN',
    brandCode: 'CPT',
    color: '#0284c7',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    borderClass: 'border-sky-500',
    ringClass: 'ring-sky-500',
    tintBg: 'rgba(2, 132, 199, 0.12)',
  },
  DELTA: {
    brand: 'DELTA',
    brandCode: 'DLT',
    color: '#0d9488',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    borderClass: 'border-teal-500',
    ringClass: 'ring-teal-500',
    tintBg: 'rgba(13, 148, 136, 0.12)',
  },
  DLT: {
    brand: 'DELTA',
    brandCode: 'DLT',
    color: '#0d9488',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    borderClass: 'border-teal-500',
    ringClass: 'ring-teal-500',
    tintBg: 'rgba(13, 148, 136, 0.12)',
  },
  JBP: {
    brand: 'JBP',
    brandCode: 'JBP',
    color: '#16a34a',
    badgeBg: 'bg-green-600',
    badgeText: 'text-white',
    borderClass: 'border-green-500',
    ringClass: 'ring-green-500',
    tintBg: 'rgba(22, 163, 74, 0.12)',
  },
  WOODTECT: {
    brand: 'WOODTECT',
    brandCode: 'WDT',
    color: '#92400e',
    badgeBg: 'bg-amber-800',
    badgeText: 'text-white',
    borderClass: 'border-amber-700',
    ringClass: 'ring-amber-700',
    tintBg: 'rgba(146, 64, 14, 0.14)',
  },
  WDT: {
    brand: 'WOODTECT',
    brandCode: 'WDT',
    color: '#92400e',
    badgeBg: 'bg-amber-800',
    badgeText: 'text-white',
    borderClass: 'border-amber-700',
    ringClass: 'ring-amber-700',
    tintBg: 'rgba(146, 64, 14, 0.14)',
  },
};

const FALLBACK_COLORS = [
  '#2563eb', // blue
  '#ea580c', // orange
  '#dc2626', // red
  '#d97706', // amber
  '#7c3aed', // purple
  '#0d9488', // teal
  '#16a34a', // green
  '#0284c7', // sky
  '#9333ea', // fuchsia
  '#e11d48', // rose
];

/**
 * Returns high-visibility, distinct brand visual cues for quick at-a-glance identification.
 */
export function getBrandVisual(
  brandName?: string | null,
  brandCode?: string | null
): BrandVisualInfo {
  const normBrand = (brandName || '').trim().toUpperCase();
  const normCode = (brandCode || '').trim().toUpperCase();

  // 1. Direct match by brand name or code in palette
  if (normBrand && BRAND_PALETTES[normBrand]) {
    return BRAND_PALETTES[normBrand];
  }
  if (normCode && BRAND_PALETTES[normCode]) {
    return BRAND_PALETTES[normCode];
  }

  // 2. Partial match check (e.g. "TOA COLOR", "NIPPON PAINT", "BEGER SHIELD")
  for (const key of Object.keys(BRAND_PALETTES)) {
    if (normBrand.includes(key) || normCode.includes(key)) {
      return BRAND_PALETTES[key];
    }
  }

  // 3. Fallback for custom or unassigned brands
  if (!normBrand && !normCode) {
    return {
      brand: 'ส่วนกลาง',
      brandCode: 'กลาง',
      color: '#64748b',
      badgeBg: 'bg-slate-700',
      badgeText: 'text-slate-200',
      borderClass: 'border-slate-600',
      ringClass: 'ring-slate-500',
      tintBg: 'rgba(100, 116, 139, 0.08)',
    };
  }

  // Consistent hash color for any unique custom brand
  const str = normBrand || normCode;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;
  const pickedColor = FALLBACK_COLORS[colorIndex];

  return {
    brand: brandName || brandCode || 'แบรนด์',
    brandCode: brandCode || brandName?.substring(0, 3).toUpperCase() || 'PNT',
    color: pickedColor,
    badgeBg: 'bg-slate-800',
    badgeText: 'text-white',
    borderClass: 'border-slate-500',
    ringClass: 'ring-slate-400',
    tintBg: `${pickedColor}20`,
  };
}

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'meme' | 'fun' | 'anime' | 'animal';
}

export const FUN_AVATARS: AvatarPreset[] = [];

export const DEFAULT_THEME_ID = 'MAIN_THEME';

export const MAIN_THEME: ThemePreset = {
  id: 'MAIN_THEME',
  name: 'ทีมแดง (RED) vs ทีมน้ำเงิน (BLUE)',
  tag: 'Red vs Blue Team Match',
  description: 'ระบบจัดคิวแบ่ง 2 ฝั่งชัดเจนแบบการแข่งขัน: ทีมแดง (RED • ฝั่งซ้าย) ปะทะ ทีมน้ำเงิน (BLUE • ฝั่งขวา)',
  icon: '⚔️',
  pageBg: 'bg-[#0a0f1d]',
  pageWallpaperPattern: '',
  headerBg: 'bg-slate-950/95',
  headerBorder: 'border-b border-slate-800/80 shadow-md shadow-slate-950/50',
  headerAccentBadge: 'bg-slate-800 text-slate-200 border border-slate-700',
  themeQuote: 'ระบบจัดคิวแข่งขันบริการ • ทีมแดง (LEFT) VS ทีมน้ำเงิน (RIGHT) • เที่ยงตรง ยุติธรรมตามเวลาจริง',
  previewGradient: 'from-red-900 via-slate-900 to-blue-900',
  left: {
    name: 'ทีมแดง (RED TEAM)',
    subName: 'เครื่องผสมสี 1 (A) • ฝั่งซ้าย',
    badge: '🔴 ทีมแดง (RED)',
    mascotName: 'ทีมแดง (เครื่อง 1)',
    mascotTitle: 'ทีมผสมสี 1 (ฝั่งซ้าย)',
    mascotImage: undefined,
    mascotQuote: 'ทีมแดงบริการฉับไว แม่นยำทุกเฉดสี',
    motto: 'RED TEAM • LEFT DESK',
    colorScheme: 'red',
    headerBg: 'from-red-950/90 via-slate-900 to-slate-900',
    borderGlow: 'border-red-500/50 shadow-xl shadow-red-950/40 ring-1 ring-red-500/30',
    accentBadge: 'bg-red-500/20 border-red-500/40 text-red-300',
    primaryBadge: 'bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-600/30',
    iconEmoji: '🔴',
    sideBg: 'bg-slate-900/95',
    servingBg: 'bg-gradient-to-b from-red-950/30 via-slate-900/85 to-slate-950 border border-red-500/40 shadow-md',
    servingBorder: 'border-red-500/40',
    rank1Card: 'bg-slate-850/95 border-2 border-red-500/70 shadow-lg shadow-red-950/50 ring-1 ring-red-500/40',
    rank1Badge: 'bg-red-600 text-white font-black shadow-md shadow-red-900/60',
    rankNormalBadge: 'bg-slate-950 text-red-300/90 border border-red-500/30',
    serveBtn: 'bg-red-600 hover:bg-red-500 text-white font-black shadow-md shadow-red-600/30',
    actionAccent: 'text-red-400',
    cardHover: 'hover:border-red-500/50 hover:bg-slate-850',
  },
  right: {
    name: 'ทีมน้ำเงิน (BLUE TEAM)',
    subName: 'เครื่องผสมสี 2 (B) • ฝั่งขวา',
    badge: '🔵 ทีมน้ำเงิน (BLUE)',
    mascotName: 'ทีมน้ำเงิน (เครื่อง 2)',
    mascotTitle: 'ทีมผสมสี 2 (ฝั่งขวา)',
    mascotImage: undefined,
    mascotQuote: 'ทีมน้ำเงินพลังเต็มร้อย มั่นใจทุกการผสม',
    motto: 'BLUE TEAM • RIGHT DESK',
    colorScheme: 'blue',
    headerBg: 'from-blue-950/90 via-slate-900 to-slate-900',
    borderGlow: 'border-blue-500/50 shadow-xl shadow-blue-950/40 ring-1 ring-blue-500/30',
    accentBadge: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    primaryBadge: 'bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30',
    iconEmoji: '🔵',
    sideBg: 'bg-slate-900/95',
    servingBg: 'bg-gradient-to-b from-blue-950/30 via-slate-900/85 to-slate-950 border border-blue-500/40 shadow-md',
    servingBorder: 'border-blue-500/40',
    rank1Card: 'bg-slate-850/95 border-2 border-blue-500/70 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/40',
    rank1Badge: 'bg-blue-600 text-white font-black shadow-md shadow-blue-900/60',
    rankNormalBadge: 'bg-slate-950 text-blue-300/90 border border-blue-500/30',
    serveBtn: 'bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md shadow-blue-600/30',
    actionAccent: 'text-blue-400',
    cardHover: 'hover:border-blue-500/50 hover:bg-slate-850',
  },
};

export const THEME_PRESETS: ThemePreset[] = [MAIN_THEME];
