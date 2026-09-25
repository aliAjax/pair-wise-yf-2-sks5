import { Users, CalendarClock, Sprout } from 'lucide-react';
import type { BenchAdoptionStatus } from '@/types';
import { BENCH_STATUS_LABELS } from '@/types';

interface AdoptionBadgeProps {
  status: BenchAdoptionStatus;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<
  BenchAdoptionStatus,
  { className: string; icon: typeof Users }
> = {
  active: {
    className: 'bg-moss-green/10 text-moss-green',
    icon: Users,
  },
  upcoming: {
    className: 'bg-ochre/10 text-ochre',
    icon: CalendarClock,
  },
  available: {
    className: 'bg-warm-beige text-ink-light border border-dashed border-ink-light/30',
    icon: Sprout,
  },
  expired: {
    className: 'bg-warm-beige text-ink-light',
    icon: Users,
  },
  withdrawn: {
    className: 'bg-warm-beige text-ink-light',
    icon: Users,
  },
};

export default function AdoptionBadge({ status, size = 'sm' }: AdoptionBadgeProps) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  const sizing =
    size === 'md'
      ? 'px-2.5 py-1 text-sm gap-1.5'
      : 'px-2 py-0.5 text-xs gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizing} ${style.className}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {BENCH_STATUS_LABELS[status]}
    </span>
  );
}
