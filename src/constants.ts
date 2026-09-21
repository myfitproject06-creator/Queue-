import { QuickReasonOption } from './types';

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

export const PAINT_BRANDS: PaintBrandPreset[] = [
  { brand: 'Nippon Paint', brandCode: 'NPT', color: '#dc2626' },
  { brand: 'TOA', brandCode: 'TOA', color: '#2563eb' },
  { brand: 'JBP', brandCode: 'JBP', color: '#16a34a' },
  { brand: 'Beger', brandCode: 'BGR', color: '#ea580c' },
  { brand: 'Captain', brandCode: 'CPT', color: '#0284c7' },
  { brand: 'Dulux', brandCode: 'DLX', color: '#7c3aed' },
  { brand: 'Pamapale', brandCode: 'PMP', color: '#0d9488' },
  { brand: 'อื่น ๆ', brandCode: 'OTHER', color: '#64748b' },
];

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'meme' | 'fun' | 'anime' | 'animal';
}

export const FUN_AVATARS: AvatarPreset[] = [
  {
    id: 'meme_doge',
    name: 'Doge สู้ชีวิต',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80',
    category: 'animal',
  },
  {
    id: 'cool_cat',
    name: 'แมวใส่แว่น',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
    category: 'animal',
  },
  {
    id: 'smile_happy',
    name: 'ยิ้มพร้อมบริการ',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
  {
    id: 'confident_man',
    name: 'ยอดมนุษย์สี',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
  {
    id: 'paint_artist',
    name: 'ช่างสีมือหนึ่ง',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
  {
    id: 'cheerful_girl',
    name: 'ไฟแรงเฟร่อ',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
  {
    id: 'energetic_guy',
    name: 'วิ่งไวลูกค้าเรียก',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
  {
    id: 'cute_capybara',
    name: 'คาปิบาร่าใจเย็น',
    url: 'https://images.unsplash.com/photo-1563460716037-460b3dd14abb?w=200&auto=format&fit=crop&q=80',
    category: 'animal',
  },
  {
    id: 'panda_relax',
    name: 'แพนด้าพลังสี',
    url: 'https://images.unsplash.com/photo-1527526029430-319f10814151?w=200&auto=format&fit=crop&q=80',
    category: 'animal',
  },
  {
    id: 'super_hero',
    name: 'ฮีโร่พร้อมรบ',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    category: 'fun',
  },
];
