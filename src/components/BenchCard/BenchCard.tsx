import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Volume2, Sun, Armchair, Users, Sprout, Wrench } from 'lucide-react';
import type { Bench } from '@/types';
import { MATERIAL_LABELS, SHADE_LABELS, NOISE_LABELS, STAY_DURATION_LABELS } from '@/types';
import Rating from '@/components/Rating/Rating';
import AdoptionBadge from '@/components/AdoptionBadge/AdoptionBadge';
import { calculateComfortScore, getComfortLevel, getComfortColor } from '@/utils/comfort';
import { getBenchStatus, getCurrentAdoption, getNextMaintenanceDate, formatDate } from '@/utils/adoption';

interface BenchCardProps {
  bench: Bench;
  index?: number;
}

export default function BenchCard({ bench, index = 0 }: BenchCardProps) {
  const navigate = useNavigate();
  const comfortScore = calculateComfortScore(bench);
  const comfortLevel = getComfortLevel(comfortScore);
  const comfortColor = getComfortColor(comfortScore);

  const status = getBenchStatus(bench);
  const currentAdoption = getCurrentAdoption(bench);
  const nextMaintenance = getNextMaintenanceDate(bench, currentAdoption);
  const available = status === 'available';

  const staggerClass = `stagger-${(index % 6) + 1}`;

  return (
    <div
      onClick={() => navigate(`/bench/${bench.id}`)}
      className={`paper-texture rounded-xl shadow-card card-hover cursor-pointer overflow-hidden fade-in opacity-0 ${staggerClass} ${
        available ? 'border border-dashed border-moss-green/50' : ''
      }`}
    >
      <div className={`h-36 relative overflow-hidden ${
        available
          ? 'bg-gradient-to-br from-warm-cream to-moss-green/10'
          : 'bg-gradient-to-br from-warm-cream to-warm-beige'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {available ? (
            <div className="w-20 h-20 rounded-full bg-moss-green/10 flex items-center justify-center border border-dashed border-moss-green/40">
              <Sprout className="w-10 h-10 text-moss-green/60" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-moss-green/10 flex items-center justify-center">
              <Armchair className="w-10 h-10 text-moss-green/50" />
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium">
          <span className={comfortColor}>{comfortLevel}</span>
          <span className="text-ink-light ml-1">{comfortScore}</span>
        </div>

        <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs text-ink-light">
          {MATERIAL_LABELS[bench.material]}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-lg font-semibold text-deep-brown line-clamp-1">
            {bench.name}
          </h3>
          <AdoptionBadge status={status} />
        </div>

        <div className="flex items-center gap-1 text-ink-light text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{bench.location}</span>
        </div>

        {/* 认养小组与下次养护日 */}
        {currentAdoption ? (
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-moss-green">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium truncate">{currentAdoption.groupName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-light">
              <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
              {nextMaintenance ? (
                <span>下次养护日：{formatDate(nextMaintenance)}</span>
              ) : (
                <span>本轮养护已完成</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-moss-green/80">
            <Sprout className="w-3.5 h-3.5 flex-shrink-0" />
            <span>等待志愿者小组认养</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
            <Sun className="w-3 h-3" />
            {SHADE_LABELS[bench.shadeLevel]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-ochre/10 text-ochre text-xs rounded-md">
            <Volume2 className="w-3 h-3" />
            {NOISE_LABELS[bench.noiseLevel]}
          </span>
          {bench.hasBackrest && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
              有靠背
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Rating value={bench.rating} readOnly size="sm" />
          <div className="flex items-center gap-1 text-xs text-ink-light">
            <Clock className="w-3.5 h-3.5" />
            <span>{STAY_DURATION_LABELS[bench.stayDuration]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
