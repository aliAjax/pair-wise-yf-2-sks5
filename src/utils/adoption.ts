import type {
  Adoption,
  AdoptionStatus,
  Bench,
  BenchAdoptionStatus,
  MaintenanceRecord,
} from '@/types';

/** 今天的日期，格式 YYYY-MM-DD（本地时区） */
export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 单条认养记录的实际状态 */
export function getAdoptionStatus(
  adoption: Adoption,
  today: string = todayStr(),
): AdoptionStatus {
  if (adoption.withdrawnAt) return 'withdrawn';
  if (today < adoption.startDate) return 'upcoming';
  if (today > adoption.endDate) return 'expired';
  return 'active';
}

/** 当前认养中或待生效的认养（同一张长椅同时只会有一条） */
export function getCurrentAdoption(
  bench: Pick<Bench, 'adoptions'>,
  today: string = todayStr(),
): Adoption | undefined {
  return bench.adoptions.find((a) => {
    const status = getAdoptionStatus(a, today);
    return status === 'active' || status === 'upcoming';
  });
}

/** 长椅展示状态：有进行中/待生效认养时展示对应状态，否则为待认养 */
export function getBenchStatus(
  bench: Pick<Bench, 'adoptions'>,
  today: string = todayStr(),
): BenchAdoptionStatus {
  const current = getCurrentAdoption(bench, today);
  return current ? getAdoptionStatus(current, today) : 'available';
}

/** 认养实际覆盖的结束日期：提前退出时截止到退出当日 */
export function getEffectiveEndDate(adoption: Adoption): string {
  return adoption.withdrawnAt && adoption.withdrawnAt < adoption.endDate
    ? adoption.withdrawnAt
    : adoption.endDate;
}

/**
 * 下次养护日：取最近一次养护日（或认养起始日）按养护间隔推算，
 * 不足今日则顺延若干个间隔；超过实际认养截止日则本轮不再养护，返回 null。
 */
export function getNextMaintenanceDate(
  bench: Pick<Bench, 'adoptions' | 'maintenanceRecords'>,
  adoption?: Adoption,
  today: string = todayStr(),
): string | null {
  const current = adoption ?? getCurrentAdoption(bench, today);
  if (!current || getAdoptionStatus(current, today) !== 'active') return null;

  const records = bench.maintenanceRecords
    .filter((r) => r.adoptionId === current.id)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  let next = records.length > 0
    ? addDays(records[records.length - 1].date, current.intervalDays)
    : addDays(current.startDate, current.intervalDays);

  while (next < today) {
    next = addDays(next, current.intervalDays);
  }

  const effectiveEnd = getEffectiveEndDate(current);
  return next <= effectiveEnd ? next : null;
}

/** 两条日期区间是否重叠（端点相接不算重叠，旧区间提前退出时只取实际覆盖区间） */
export function isDateRangeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

/**
 * 新认养区间是否与已有认养冲突。
 * 冲突时保留原认养：待生效的认养可被整段取消（退出），
 * 因此与其它待生效区间重叠时以最先登记者为准、后到者冲突；
 * 认养中与历史区间均参与冲突判定。
 */
export function findConflictingAdoption(
  existing: Adoption[],
  startDate: string,
  endDate: string,
  excludeId?: string,
  today: string = todayStr(),
): Adoption | undefined {
  return existing.find((adoption) => {
    if (adoption.id === excludeId) return false;
    const status = getAdoptionStatus(adoption, today);
    if (status === 'withdrawn') {
      const withdrawnAt = adoption.withdrawnAt ?? adoption.startDate;
      return isDateRangeOverlap(
        startDate,
        endDate,
        adoption.startDate,
        withdrawnAt,
      );
    }
    return isDateRangeOverlap(startDate, endDate, adoption.startDate, adoption.endDate);
  });
}

export function getMaintenanceRecords(
  bench: Pick<Bench, 'maintenanceRecords'>,
  adoptionId?: string,
): MaintenanceRecord[] {
  const records = adoptionId
    ? bench.maintenanceRecords.filter((r) => r.adoptionId === adoptionId)
    : bench.maintenanceRecords;
  return [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
}
