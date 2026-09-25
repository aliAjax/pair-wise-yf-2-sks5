export type MaterialType = 'wood' | 'metal' | 'stone' | 'plastic' | 'mixed';
export type OrientationType = 'east' | 'south' | 'west' | 'north' | 'southeast' | 'northeast' | 'southwest' | 'northwest';
export type ShadeLevelType = 'none' | 'partial' | 'full';
export type NoiseLevelType = 'quiet' | 'moderate' | 'noisy';
export type StayDurationType = 'short' | 'medium' | 'long' | 'verylong';
export type TimePeriodType = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface BenchExperience {
  id: string;
  benchId: string;
  timePeriod: TimePeriodType;
  notes: string;
  rating: number;
}

/** 认养记录的实际状态：active 认养中 / upcoming 待生效 / expired 已到期 / withdrawn 已退出 */
export type AdoptionStatus = 'active' | 'upcoming' | 'expired' | 'withdrawn';
/** 长椅对外展示的认养状态：active / upcoming 之外统一为 available 待认养 */
export type BenchAdoptionStatus = AdoptionStatus | 'available';

export interface Adoption {
  id: string;
  /** 认养志愿者小组名称 */
  groupName: string;
  /** 认养起始日期 YYYY-MM-DD */
  startDate: string;
  /** 认养截止日期 YYYY-MM-DD */
  endDate: string;
  /** 养护间隔（天） */
  intervalDays: number;
  /** 退出日期 YYYY-MM-DD，为空表示未提前退出 */
  withdrawnAt?: string | null;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  /** 对应的认养记录 ID */
  adoptionId: string;
  /** 养护日期 YYYY-MM-DD */
  date: string;
  /** 养护备注 */
  note: string;
  createdAt: string;
}

export interface Bench {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  material: MaterialType;
  orientation: OrientationType;
  hasBackrest: boolean;
  shadeLevel: ShadeLevelType;
  noiseLevel: NoiseLevelType;
  stayDuration: StayDurationType;
  rating: number;
  review: string;
  experiences: BenchExperience[];
  /** 认养档案（含历史认养），空数组即待认养 */
  adoptions: Adoption[];
  /** 养护记录，仅认养期间可登记，本地保存 */
  maintenanceRecords: MaintenanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  wood: '木质',
  metal: '金属',
  stone: '石质',
  plastic: '塑料',
  mixed: '混合材质',
};

export const ORIENTATION_LABELS: Record<OrientationType, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  northeast: '东北',
  southwest: '西南',
  northwest: '西北',
};

export const SHADE_LABELS: Record<ShadeLevelType, string> = {
  none: '无遮阴',
  partial: '部分遮阴',
  full: '完全遮阴',
};

export const NOISE_LABELS: Record<NoiseLevelType, string> = {
  quiet: '安静',
  moderate: '一般',
  noisy: '嘈杂',
};

export const STAY_DURATION_LABELS: Record<StayDurationType, string> = {
  short: '少于15分钟',
  medium: '15-30分钟',
  long: '30-60分钟',
  verylong: '1小时以上',
};

export const TIME_PERIOD_LABELS: Record<TimePeriodType, string> = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚',
};

export const TIME_PERIOD_ICONS: Record<TimePeriodType, string> = {
  morning: 'sunrise',
  noon: 'sun',
  afternoon: 'cloud-sun',
  evening: 'sunset',
  night: 'moon',
};

export const BENCH_STATUS_LABELS: Record<BenchAdoptionStatus, string> = {
  active: '认养中',
  upcoming: '待生效',
  expired: '已到期',
  withdrawn: '已退出',
  available: '待认养',
};

export const ADOPTION_STATUS_LABELS: Record<AdoptionStatus, string> = {
  active: '认养中',
  upcoming: '待生效',
  expired: '已到期',
  withdrawn: '已退出',
};

/** 可选养护间隔（天） */
export const MAINTENANCE_INTERVAL_OPTIONS: number[] = [3, 7, 14, 30];
