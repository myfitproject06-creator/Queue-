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
  { brand: 'DELTA', brandCode: 'DLT', color: '#10b981' },
  { brand: 'JBP', brandCode: 'JBP', color: '#16a34a' },
  { brand: 'WOODTECT', brandCode: 'WDT', color: '#854d0e' },
];

export const PAINT_BRANDS: PaintBrandPreset[] = DEFAULT_PAINT_BRANDS;

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'meme' | 'fun' | 'anime' | 'animal';
}

export const FUN_AVATARS: AvatarPreset[] = [
  // Anime Characters (ดาบพิฆาตอสูร & Heroes)
  {
    id: 'anime_tanjiro',
    name: 'ทันจิโร่ (ปราณวารี)',
    url: tanjiroImg,
    category: 'anime',
  },
  {
    id: 'anime_nezuko',
    name: 'เนซึโกะ (ปีศาจสาว)',
    url: nezukoImg,
    category: 'anime',
  },
  {
    id: 'anime_rengoku',
    name: 'เร็นโกคุ (เสาหลักเพลิง)',
    url: rengokuImg,
    category: 'anime',
  },
  {
    id: 'anime_zenitsu',
    name: 'เซนอิทซึ (ปราณอัสนี)',
    url: zenitsuImg,
    category: 'anime',
  },
  {
    id: 'anime_akaza',
    name: 'อาคาสะ (อสูรข้างขึ้น 3)',
    url: akazaImg,
    category: 'anime',
  },
  {
    id: 'anime_giyu',
    name: 'กิยู (เสาหลักวารี)',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80',
    category: 'anime',
  },
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

export const DEFAULT_THEME_ID = 'DEMON_SLAYER';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'DEMON_SLAYER',
    name: 'ดาบพิฆาตอสูร (Demon Slayer)',
    tag: 'Kimetsu no Yaiba',
    description: 'การต่อสู้ระหว่างหน่วยพิฆาตอสูรปราณวารี (ทันจิโร่) และ อสูรข้างขึ้นมนต์อสูรโลหิต (อาคาสะ)',
    icon: '⚔️',
    left: {
      name: 'หน่วยพิฆาตอสูร',
      subName: 'Demon Slayer Corps',
      badge: '🗡️ ปราณวารี',
      mascotName: 'ทันจิโร่ (Tanjiro)',
      mascotTitle: 'ผู้ใช้ปราณตะวัน & วารี',
      mascotImage: tanjiroImg,
      mascotQuote: 'ก้าวไปข้างหน้า อย่าหยุดยั้ง!',
      motto: 'อุทิศแรงกาย เพื่อบริการฉับไว',
      colorScheme: 'blue_water',
      headerBg: 'from-sky-950/90 via-slate-900 to-blue-950/90',
      borderGlow: 'border-cyan-500/50 shadow-cyan-950/50 ring-1 ring-cyan-500/30',
      accentBadge: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
      primaryBadge: 'bg-cyan-500 text-slate-950 font-black',
      iconEmoji: '🌊',
    },
    right: {
      name: 'อสูรข้างขึ้น',
      subName: 'Twelve Kizuki / Upper Moons',
      badge: '🔮 มนต์อสูรโลหิต',
      mascotName: 'อาคาสะ (Akaza)',
      mascotTitle: 'อสูรข้างขึ้นลำดับที่ 3',
      mascotImage: akazaImg,
      mascotQuote: 'ก้าวข้ามขีดจำกัดความแข็งแกร่ง!',
      motto: 'พลังอสูรไร้พ่าย ผสมสีเร็วเหนือชั้น',
      colorScheme: 'purple_demon',
      headerBg: 'from-purple-950/90 via-slate-900 to-rose-950/90',
      borderGlow: 'border-purple-500/50 shadow-purple-950/50 ring-1 ring-purple-500/30',
      accentBadge: 'bg-purple-500/20 border-purple-400 text-purple-200',
      primaryBadge: 'bg-purple-500 text-white font-black',
      iconEmoji: '👁️',
    },
  },
  {
    id: 'ATTACK_ON_TITAN',
    name: 'ผ่าพิภพไททัน (Attack on Titan)',
    tag: 'Shingeki no Kyojin',
    description: 'สงครามระหว่างหน่วยสำรวจปีกแห่งเสรีภาพ และ กองทัพพลังไททันมหึมา',
    icon: '🪽',
    left: {
      name: 'หน่วยสำรวจ',
      subName: 'Scout Regiment',
      badge: '🪽 ปีกแห่งเสรีภาพ',
      mascotName: 'เอเรน & รีไวล์ (Scouts)',
      mascotTitle: 'หัวกะทิหน่วยปฏิบัติการพิเศษ',
      mascotImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80',
      mascotQuote: 'จงถวายดวงใจเพื่อหน้าที่!',
      motto: 'ฝ่าฟันทุกอุปสรรค บริการยอดเยี่ยม',
      colorScheme: 'emerald_scout',
      headerBg: 'from-emerald-950/90 via-slate-900 to-teal-950/90',
      borderGlow: 'border-emerald-500/50 shadow-emerald-950/50 ring-1 ring-emerald-500/30',
      accentBadge: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
      primaryBadge: 'bg-emerald-600 text-white font-black',
      iconEmoji: '🪽',
    },
    right: {
      name: 'นักรบไททัน',
      subName: 'Titan Vanguard',
      badge: '⚡ พลังยักษ์แปลงร่าง',
      mascotName: 'ไททันเกราะ & มหึมา',
      mascotTitle: 'พลังทำลายล้างไร้ขีดจำกัด',
      mascotImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
      mascotQuote: 'ทะลวงกำแพงทุกยอดขาย!',
      motto: 'พลังมหึมา ปิดการขายทุกออเดอร์',
      colorScheme: 'amber_titan',
      headerBg: 'from-amber-950/90 via-slate-900 to-orange-950/90',
      borderGlow: 'border-amber-500/50 shadow-amber-950/50 ring-1 ring-amber-500/30',
      accentBadge: 'bg-amber-500/20 border-amber-400 text-amber-200',
      primaryBadge: 'bg-amber-500 text-slate-950 font-black',
      iconEmoji: '⚡',
    },
  },
  {
    id: 'STAR_WARS',
    name: 'สงครามดวงดาว (Star Wars)',
    tag: 'Jedi vs Sith',
    description: 'การปะทะแห่งจักรวาล ฟากฝั่งเจไดผู้พิทักษ์ดาบฟ้า vs จักรวรรดิซิธดาบแดงเพลิง',
    icon: '🌌',
    left: {
      name: 'ภาคีเจได (Jedi)',
      subName: 'Jedi Order • Light Side',
      badge: '⚔️ ดาบเลเซอร์ฟ้า',
      mascotName: 'มาสเตอร์เจได',
      mascotTitle: 'ผู้พิทักษ์ความสงบสุข',
      mascotImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
      mascotQuote: 'ขอพลังจงสถิตอยู่กับท่าน',
      motto: 'สงบ นิ่ง รอบคอบ บริการประทับใจ',
      colorScheme: 'cyan_jedi',
      headerBg: 'from-cyan-950/90 via-slate-900 to-blue-950/90',
      borderGlow: 'border-cyan-500/50 shadow-cyan-950/50 ring-1 ring-cyan-500/30',
      accentBadge: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
      primaryBadge: 'bg-cyan-500 text-slate-950 font-black',
      iconEmoji: '⚔️',
    },
    right: {
      name: 'จักรวรรดิซิธ (Sith)',
      subName: 'Sith Empire • Dark Side',
      badge: '⚡ ดาบเลเซอร์แดง',
      mascotName: 'ลอร์ดซิธผู้ทรงพลัง',
      mascotTitle: 'จ้าวแห่งพลังมืดฉับไว',
      mascotImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
      mascotQuote: 'พลังที่แท้จริงคือความฉับไว',
      motto: 'พลังความเร็วไร้ขีดจำกัด',
      colorScheme: 'rose_sith',
      headerBg: 'from-rose-950/90 via-slate-900 to-red-950/90',
      borderGlow: 'border-rose-500/50 shadow-rose-950/50 ring-1 ring-rose-500/30',
      accentBadge: 'bg-rose-500/20 border-rose-400 text-rose-200',
      primaryBadge: 'bg-rose-600 text-white font-black',
      iconEmoji: '⚡',
    },
  },
  {
    id: 'CLASSIC_PAINT',
    name: 'แผนกสี คลาสสิก (Original)',
    tag: 'Classic Blue & Green',
    description: 'ธีมมาตรฐานเดิม โทนสีน้ำเงินสำหรับฝั่งซ้าย และ โทนสีเขียวสำหรับฝั่งขวา',
    icon: '🎨',
    left: {
      name: 'ฝั่งซ้าย (LEFT)',
      subName: 'PC กลางฝั่งซ้าย • ทีมสีน้ำเงิน',
      badge: '🟦 คิวฝั่งซ้าย',
      mascotName: 'เครื่องผสมสี LEFT',
      mascotTitle: 'สถานีบริการหลักฝั่งซ้าย',
      mascotQuote: 'บริการรวดเร็ว แม่นยำ',
      motto: 'พร้อมให้บริการลูกค้าทุกท่าน',
      colorScheme: 'classic_blue',
      headerBg: 'from-blue-950/90 via-slate-900 to-blue-900/60',
      borderGlow: 'border-blue-500/40 shadow-blue-950/40 ring-1 ring-blue-500/20',
      accentBadge: 'bg-blue-500/20 border-blue-400 text-blue-200',
      primaryBadge: 'bg-blue-600 text-white font-black',
      iconEmoji: '🟦',
    },
    right: {
      name: 'ฝั่งขวา (RIGHT)',
      subName: 'PC กลางฝั่งขวา • ทีมสีเขียว',
      badge: '🟩 คิวฝั่งขวา',
      mascotName: 'เครื่องผสมสี RIGHT',
      mascotTitle: 'สถานีบริการหลักฝั่งขวา',
      mascotQuote: 'บริการด้วยใจ เต็มที่ทุกคิว',
      motto: 'พร้อมให้บริการลูกค้าทุกท่าน',
      colorScheme: 'classic_green',
      headerBg: 'from-emerald-950/90 via-slate-900 to-emerald-900/60',
      borderGlow: 'border-emerald-500/40 shadow-emerald-950/40 ring-1 ring-emerald-500/20',
      accentBadge: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
      primaryBadge: 'bg-emerald-600 text-white font-black',
      iconEmoji: '🟩',
    },
  },
];
