import type { Bench } from '@/types';

const STORAGE_KEY = 'bench-archive-data';

/**
 * 兼容旧档案：没有认养信息的长椅统一补空档案，按待认养处理；
 * 记录仍保存在本地，刷新后可继续查看。
 */
function normalizeBench(raw: Record<string, unknown>): Bench {
  const bench = raw as Partial<Bench>;
  return {
    ...(raw as unknown as Bench),
    adoptions: Array.isArray(bench.adoptions) ? bench.adoptions : [],
    maintenanceRecords: Array.isArray(bench.maintenanceRecords)
      ? bench.maintenanceRecords
      : [],
  };
}

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: unknown = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeBench(item as Record<string, unknown>));
      }
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}
