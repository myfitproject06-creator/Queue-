export type Side = 'LEFT' | 'RIGHT';

export type MachineId = 'PC_LEFT' | 'PC_RIGHT';

export type QueueStatus = 'WAITING' | 'NEXT' | 'SERVING';

export interface Employee {
  id: string;
  name: string;
  nickname?: string;
  departmentCode?: string;
  brand?: string;
  brandCode?: string;
  active: boolean;
  avatarColor?: string;
  avatarUrl?: string;
}

export interface QueueEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatarUrl?: string;
  employeeAvatarColor?: string;
  employeeNickname?: string;
  employeeBrand?: string;
  employeeBrandCode?: string;
  side: Side;
  status: QueueStatus;
  enteredAt: string; // ISO string (authoritative server time)
  servedAt?: string; // ISO string when service started
  servingMachineId?: MachineId;
}

export type QuickReasonKey = 
  | 'HOME' 
  | 'LUNCH_BREAK' 
  | 'OTHER_WORK' 
  | 'AWAY_FROM_DESK' 
  | 'WRONG_ENTRY' 
  | 'OTHER';

export interface QuickReasonOption {
  key: QuickReasonKey;
  label: string;
  icon: string;
}

export type AuditActionType =
  | 'ENQUEUE'
  | 'START_SERVICE'
  | 'COMPLETE_SERVICE'
  | 'RETURN_QUEUE'
  | 'REMOVE_QUEUE'
  | 'MOVE_QUEUE'
  | 'SWITCH_SIDES'
  | 'UNDO_SWITCH'
  | 'REJOIN_QUEUE'
  | 'EMPLOYEE_ADDED'
  | 'EMPLOYEE_REMOVED'
  | 'SYSTEM_RESET'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_REVOKED'
  | 'UNAUTHORIZED_ACCESS'
  | 'UNAUTHORIZED_API_REQUEST'
  | 'DEVICE_AUTH_FAILED';

export interface AuthorizedDevice {
  id: string;
  deviceId: string; // e.g. 'LEFT-01', 'RIGHT-01'
  side: Side;
  status: 'AUTHORIZED' | 'REVOKED';
  createdAt: string; // ISO
  lastSeenAt: string; // ISO
  revokedAt?: string; // ISO
  userAgent?: string;
  ip?: string;
}

export interface DeviceAuthStatusResponse {
  authorized: boolean;
  device?: AuthorizedDevice | null;
  registeredDevices: {
    side: Side;
    deviceId?: string;
    status: 'AUTHORIZED' | 'REVOKED' | 'NOT_REGISTERED';
    lastSeenAt?: string;
  }[];
  pairingCodeHint?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: AuditActionType;
  employeeId?: string;
  employeeName?: string;
  side?: Side;
  machineId: MachineId;
  reason?: string;
  details?: string;
}

export interface SideSwitchRecord {
  switchedAt: string;
  machineId: MachineId;
  leftCountBefore: number;
  rightCountBefore: number;
}

export interface ThemePresetSideConfig {
  name: string;
  subName: string;
  badge: string;
  mascotName: string;
  mascotTitle: string;
  mascotImage?: string;
  mascotQuote: string;
  motto: string;
  colorScheme: string;
  headerBg: string;
  borderGlow: string;
  accentBadge: string;
  primaryBadge: string;
  iconEmoji: string;
  // LINE Theme Deep Styling:
  sideBg?: string;
  servingBg?: string;
  servingBorder?: string;
  rank1Card?: string;
  rank1Badge?: string;
  rankNormalBadge?: string;
  serveBtn?: string;
  actionAccent?: string;
  cardHover?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  // Full-page LINE Theme Atmosphere:
  pageBg: string;
  pageWallpaperPattern?: string;
  headerBg: string;
  headerBorder: string;
  headerAccentBadge: string;
  themeQuote?: string;
  previewGradient?: string;
  left: ThemePresetSideConfig;
  right: ThemePresetSideConfig;
}

export interface BrandItem {
  id: string;
  name: string;
  code: string;
  color?: string;
  createdAt?: string;
}

export interface QueueState {
  leftQueue: QueueEntry[];
  rightQueue: QueueEntry[];
  lastSwitch?: SideSwitchRecord | null;
  lastDailyResetDate?: string;
  activeThemeId?: string;
  themeSwapped?: boolean;
  brands?: BrandItem[];
  serverTime: string;
}

export interface EmployeeHandledStats {
  id: string;
  name: string;
  nickname?: string;
  brand?: string;
  brandCode?: string;
  avatarUrl?: string;
  avatarColor?: string;
  handledCount: number;
  leftSideCount: number;
  rightSideCount: number;
  lastHandledAt?: string;
}

export interface HandledTodayStatsResponse {
  success: boolean;
  date: string;
  totalHandled: number;
  activeEmployeesCount: number;
  topPerformer?: {
    name: string;
    nickname?: string;
    brandCode?: string;
    handledCount: number;
  } | null;
  employees: EmployeeHandledStats[];
}
