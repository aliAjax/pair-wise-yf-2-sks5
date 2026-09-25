import { HandHeart, CircleDashed } from 'lucide-react';
import type { Bench } from '@/types';
import { getActiveAdoption, getNextMaintenanceDate, isMaintenanceOverdue, formatDate } from '@/utils/adoption';

interface AdoptionBadgeProps {
  bench: Bench;
  showNext?: boolean;
}

export default function AdoptionBadge({ bench, showNext = false }: AdoptionBadgeProps) {
  const activeAdoption = getActiveAdoption(bench);

  if (!activeAdoption) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-ochre/10 text-ochre text-xs rounded-md border border-ochre/30 border-dashed">
        <CircleDashed className="w-3 h-3" />
        待认养
      </span>
    );
  }

  const nextDate = getNextMaintenanceDate(bench);
  const overdue = isMaintenanceOverdue(bench);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
      <HandHeart className="w-3 h-3" />
      {activeAdoption.groupName}
      {showNext && (
        <span className={`ml-1 ${overdue ? 'text-red-500 font-medium' : 'text-ink-light'}`}>
          · 下次养护 {nextDate ? formatDate(nextDate) : '—'}
          {overdue && '（已逾期）'}
        </span>
      )}
    </span>
  );
}
