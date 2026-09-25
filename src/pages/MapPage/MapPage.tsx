import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Armchair, Info, Users, Sprout, Wrench, CalendarClock } from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import type { Bench, BenchAdoptionStatus } from '@/types';
import {
  getBenchStatus,
  getCurrentAdoption,
  getNextMaintenanceDate,
  formatDate,
} from '@/utils/adoption';

const PIN_COLOR: Record<BenchAdoptionStatus, string> = {
  active: 'text-moss-green',
  upcoming: 'text-ochre',
  available: 'text-ink-light/50',
  expired: 'text-ink-light/50',
  withdrawn: 'text-ink-light/50',
};

export default function MapPage() {
  const { benches, initialize, initialized } = useBenchStore();
  const navigate = useNavigate();
  const [hoveredBench, setHoveredBench] = useState<Bench | null>(null);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const getPositionStyle = (bench: Bench) => {
    const latRange = { min: 31.22, max: 31.25 };
    const lngRange = { min: 121.46, max: 121.495 };

    const normalizedLat = (bench.lat - latRange.min) / (latRange.max - latRange.min);
    const normalizedLng = (bench.lng - lngRange.min) / (lngRange.max - lngRange.min);

    return {
      left: `${10 + normalizedLng * 80}%`,
      top: `${85 - normalizedLat * 70}%`,
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-deep-brown mb-1">
          地图分布
        </h2>
        <p className="text-ink-light text-sm">
          查看长椅在城市中的分布位置与认养情况
        </p>
      </div>

      <div className="paper-texture rounded-xl shadow-paper overflow-hidden">
        <div className="relative w-full h-[600px] bg-gradient-to-br from-moss-green/5 via-warm-beige to-ochre/5">
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6B8E5A" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-20 rounded-full bg-moss-green/10 blur-xl" />
            <div className="absolute bottom-1/3 right-1/4 w-40 h-24 rounded-full bg-ochre/10 blur-xl" />
            <div className="absolute top-1/2 left-1/2 w-24 h-16 rounded-full bg-moss-green/5 blur-lg" />
          </div>

          {benches.map((bench) => {
            const position = getPositionStyle(bench);
            const status = getBenchStatus(bench);
            const currentAdoption = getCurrentAdoption(bench);
            const nextMaintenance = getNextMaintenanceDate(bench, currentAdoption);
            const available = status === 'available';

            return (
              <button
                key={bench.id}
                onClick={() => navigate(`/bench/${bench.id}`)}
                onMouseEnter={() => setHoveredBench(bench)}
                onMouseLeave={() => setHoveredBench(null)}
                className="absolute -translate-x-1/2 -translate-y-full group"
                style={position}
              >
                <div className={`relative ${
                  hoveredBench?.id === bench.id ? 'scale-125 z-10' : 'z-0'
                } transition-transform duration-200`}>
                  {available ? (
                    /* 待认养点单独标出：空心虚线圆 + 嫩芽 */
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-moss-green/60 bg-white/70 flex items-center justify-center drop-shadow-md group-hover:drop-shadow-lg transition-all">
                      <Sprout className="w-4 h-4 text-moss-green/70" />
                    </div>
                  ) : (
                    <>
                      <MapPin
                        className={`w-8 h-8 ${PIN_COLOR[status]} drop-shadow-md group-hover:drop-shadow-lg transition-all`}
                        fill="currentColor"
                      />
                      <div className="absolute top-1 left-1/2 -translate-x-1/2">
                        {status === 'upcoming' ? (
                          <CalendarClock className="w-3 h-3 text-white" />
                        ) : (
                          <Armchair className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {hoveredBench?.id === bench.id && (
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full w-56 paper-texture rounded-lg shadow-paper-hover p-3 z-20 pointer-events-none">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-serif font-medium text-deep-brown text-sm line-clamp-1">
                        {bench.name}
                      </h4>
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        status === 'active'
                          ? 'text-moss-green'
                          : status === 'upcoming'
                            ? 'text-ochre'
                            : 'text-ink-light'
                      }`}>
                        {status === 'active'
                          ? '认养中'
                          : status === 'upcoming'
                            ? '待生效'
                            : '待认养'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-light line-clamp-1 mb-2">
                      {bench.location}
                    </p>
                    {currentAdoption ? (
                      <div className="space-y-1 border-t border-deep-brown/10 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-deep-brown">
                          <Users className="w-3 h-3 text-moss-green flex-shrink-0" />
                          <span className="line-clamp-1">{currentAdoption.groupName}</span>
                        </div>
                        {status === 'active' && (
                          <div className="flex items-center gap-1.5 text-xs text-ink-light">
                            <Wrench className="w-3 h-3 text-ochre flex-shrink-0" />
                            <span>
                              下次养护：
                              {nextMaintenance ? formatDate(nextMaintenance) : '本轮已完成'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-moss-green/80 border-t border-deep-brown/10 pt-2">
                        <Sprout className="w-3 h-3 flex-shrink-0" />
                        <span>等待志愿者小组认养</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 paper-texture rounded-lg shadow-paper p-3">
            <div className="flex items-center gap-2 text-xs text-ink-light">
              <Info className="w-3.5 h-3.5" />
              <span>点击标记查看详情</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 paper-texture rounded-lg shadow-paper p-3">
            <h4 className="text-xs font-medium text-deep-brown mb-2">图例</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-moss-green" fill="currentColor" />
                <span className="text-xs text-ink-light">认养中</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ochre" fill="currentColor" />
                <span className="text-xs text-ink-light">待生效</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-dashed border-moss-green/60 bg-white/70 flex items-center justify-center">
                  <Sprout className="w-2.5 h-2.5 text-moss-green/70" />
                </div>
                <span className="text-xs text-ink-light">待认养</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-ink-light">
          共 <span className="font-medium text-deep-brown">{benches.length}</span> 张长椅，其中
          <span className="font-medium text-moss-green mx-1">
            {benches.filter((b) => getBenchStatus(b) === 'available').length}
          </span>
          张待认养
        </p>
      </div>
    </div>
  );
}
