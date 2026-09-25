import type { Adoption, Bench } from '@/types';

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '/');
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function findConflictingAdoption(
  bench: Bench,
  startDate: string,
  endDate: string,
  excludeId?: string
): Adoption | undefined {
  return bench.adoptions.find(
    (adoption) =>
      adoption.id !== excludeId &&
      rangesOverlap(adoption.startDate, adoption.endDate, startDate, endDate)
  );
}

export function getActiveAdoption(bench: Bench, date = todayString()): Adoption | undefined {
  return bench.adoptions.find(
    (adoption) => adoption.startDate <= date && date <= adoption.endDate
  );
}

export function getAdoptionStatus(bench: Bench, date = todayString()): 'active' | 'pending' {
  return getActiveAdoption(bench, date) ? 'active' : 'pending';
}

export function getNextMaintenanceDate(bench: Bench, today = todayString()): string | null {
  const adoption = getActiveAdoption(bench, today);
  if (!adoption) return null;

  const recordDates = bench.maintenanceRecords
    .filter((record) => record.adoptionId === adoption.id)
    .map((record) => record.date)
    .sort();

  const base = recordDates.length > 0 ? recordDates[recordDates.length - 1] : adoption.startDate;
  const next = addDays(base, adoption.intervalDays);

  if (next > adoption.endDate) return null;
  return next;
}

export function isMaintenanceOverdue(bench: Bench, today = todayString()): boolean {
  const next = getNextMaintenanceDate(bench, today);
  return next !== null && next < today;
}
