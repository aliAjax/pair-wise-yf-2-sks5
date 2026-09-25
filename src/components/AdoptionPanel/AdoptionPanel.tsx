import { useState } from 'react';
import {
  Users,
  Sprout,
  CalendarRange,
  Repeat,
  Wrench,
  Plus,
  LogOut,
  History,
  CheckCircle2,
} from 'lucide-react';
import type { Bench } from '@/types';
import { MAINTENANCE_INTERVAL_OPTIONS } from '@/types';
import { useBenchStore } from '@/store/useBenchStore';
import AdoptionBadge from '@/components/AdoptionBadge/AdoptionBadge';
import {
  getAdoptionStatus,
  getBenchStatus,
  getCurrentAdoption,
  getEffectiveEndDate,
  getMaintenanceRecords,
  getNextMaintenanceDate,
  todayStr,
  formatDate,
} from '@/utils/adoption';

interface AdoptionPanelProps {
  bench: Bench;
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white/60 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors';

export default function AdoptionPanel({ bench }: AdoptionPanelProps) {
  const { adoptBench, withdrawAdoption, addMaintenanceRecord } = useBenchStore();

  const status = getBenchStatus(bench);
  const current = getCurrentAdoption(bench);
  const currentStatus = current ? getAdoptionStatus(current) : undefined;
  const nextMaintenance = getNextMaintenanceDate(bench, current);

  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState('');
  const [intervalDays, setIntervalDays] = useState(MAINTENANCE_INTERVAL_OPTIONS[1]);
  const [formError, setFormError] = useState('');

  const [maintenanceDate, setMaintenanceDate] = useState(todayStr());
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceDone, setMaintenanceDone] = useState(false);

  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const pastAdoptions = bench.adoptions
    .filter((a) => !current || a.id !== current.id)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  const handleAdopt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const result = adoptBench(bench.id, {
      groupName,
      startDate,
      endDate,
      intervalDays,
    });
    if (!result.ok) {
      setFormError(result.error || '认养登记失败');
      return;
    }
    setGroupName('');
    setEndDate('');
  };

  const handleWithdraw = () => {
    if (!current) return;
    const result = withdrawAdoption(bench.id, current.id);
    if (!result.ok) {
      setFormError(result.error || '退出失败');
    }
    setShowWithdrawConfirm(false);
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    setMaintenanceError('');
    const result = addMaintenanceRecord(bench.id, {
      adoptionId: current.id,
      date: maintenanceDate,
      note: maintenanceNote,
    });
    if (!result.ok) {
      setMaintenanceError(result.error || '养护登记失败');
      return;
    }
    setMaintenanceNote('');
    setMaintenanceDate(todayStr());
    setMaintenanceDone(true);
    window.setTimeout(() => setMaintenanceDone(false), 2000);
  };

  const currentRecords = current ? getMaintenanceRecords(bench, current.id) : [];

  return (
    <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-deep-brown">
          认养档案
        </h2>
        <AdoptionBadge status={status} size="md" />
      </div>

      {current ? (
        <div className="space-y-4">
          <div className="p-4 bg-moss-green/5 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-moss-green flex-shrink-0" />
              <span className="font-medium text-deep-brown">
                {current.groupName}
              </span>
              <span className="ml-auto text-xs text-ink-light">
                {currentStatus === 'upcoming' ? '待生效' : `每 ${current.intervalDays} 天养护一次`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-ink-light">
              <CalendarRange className="w-4 h-4 flex-shrink-0" />
              <span>
                {formatDate(current.startDate)} — {formatDate(current.endDate)}
              </span>
            </div>

            {currentStatus === 'active' && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-ochre flex-shrink-0" />
                {nextMaintenance ? (
                  <span className="text-deep-brown">
                    下次养护日：
                    <span className="font-medium text-ochre">
                      {formatDate(nextMaintenance)}
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-light">本轮养护已全部完成</span>
                )}
              </div>
            )}

            {currentStatus === 'upcoming' && (
              <p className="text-xs text-ochre">
                认养尚未开始，待生效期间不能登记养护记录。
              </p>
            )}

            {current.withdrawnAt && (
              <p className="text-xs text-ink-light">
                已于 {formatDate(current.withdrawnAt)} 提前退出
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowWithdrawConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {currentStatus === 'upcoming' ? '取消认养' : '提前退出'}
            </button>
          </div>

          {/* 养护登记：仅认养中开放，到期/退出后不能补记 */}
          {currentStatus === 'active' ? (
            <form onSubmit={handleAddMaintenance} className="p-4 bg-warm-cream/60 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-deep-brown">
                <Plus className="w-4 h-4 text-moss-green" />
                登记养护记录
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-light mb-1 block">养护日期</label>
                  <input
                    type="date"
                    value={maintenanceDate}
                    min={current.startDate}
                    max={todayStr()}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-1.5 text-xs text-ink-light">
                    <Repeat className="w-3.5 h-3.5" />
                    间隔 {current.intervalDays} 天
                  </div>
                </div>
              </div>
              <textarea
                value={maintenanceNote}
                onChange={(e) => setMaintenanceNote(e.target.value)}
                placeholder="本次养护内容（清洁、紧固、上漆……）"
                rows={2}
                className={`${inputClass} resize-none`}
              />
              {maintenanceError && (
                <p className="text-xs text-red-500">{maintenanceError}</p>
              )}
              {maintenanceDone && (
                <p className="text-xs text-moss-green flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  养护记录已保存
                </p>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors"
              >
                保存养护记录
              </button>

              {currentRecords.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-medium text-ink-light">
                    本轮养护（{currentRecords.length} 次）
                  </p>
                  {currentRecords.map((record) => (
                    <div key={record.id} className="flex items-start gap-2 text-xs">
                      <Wrench className="w-3.5 h-3.5 text-ochre mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-deep-brown font-medium">
                          {formatDate(record.date)}
                        </span>
                        {record.note && (
                          <span className="text-ink-light ml-2">{record.note}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <p className="text-xs text-ink-light bg-warm-cream/60 rounded-lg p-3">
              认养结束后长椅回到待认养，期间不能补登记养护记录。
            </p>
          )}
        </div>
      ) : (
        /* 待认养：登记认养档案 */
        <form onSubmit={handleAdopt} className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-moss-green/80 mb-1">
            <Sprout className="w-4 h-4" />
            <span>这张长椅正等待志愿者小组认养</span>
          </div>

          <div>
            <label className="text-xs text-ink-light mb-1 block">认养小组 *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例如：梧桐护绿志愿队"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-light mb-1 block">起始日期 *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-ink-light mb-1 block">截止日期 *</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-light mb-1 block">养护间隔</label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className={`${inputClass} cursor-pointer`}
            >
              {MAINTENANCE_INTERVAL_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  每 {days} 天养护一次
                </option>
              ))}
            </select>
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <button
            type="submit"
            className="w-full px-4 py-2 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            登记认养
          </button>
        </form>
      )}

      {/* 历史认养 */}
      {pastAdoptions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-deep-brown/10">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-deep-brown mb-3">
            <History className="w-4 h-4 text-ink-light" />
            历史认养
          </h3>
          <div className="space-y-2">
            {pastAdoptions.map((adoption) => {
              const pastStatus = getAdoptionStatus(adoption);
              const records = getMaintenanceRecords(bench, adoption.id);
              return (
                <div key={adoption.id} className="p-3 bg-warm-cream/50 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-deep-brown">
                      {adoption.groupName}
                    </span>
                    <span className="text-ink-light">
                      {pastStatus === 'withdrawn' ? '已退出' : '已到期'}
                    </span>
                  </div>
                  <div className="text-ink-light flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5" />
                    {formatDate(adoption.startDate)} — {formatDate(getEffectiveEndDate(adoption))}
                  </div>
                  <div className="text-ink-light flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    养护 {records.length} 次
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showWithdrawConfirm && current && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="paper-texture rounded-xl shadow-paper-hover p-6 max-w-sm w-full fade-in">
            <h3 className="font-serif text-lg font-semibold text-deep-brown mb-2">
              {currentStatus === 'upcoming' ? '取消认养' : '确认退出认养'}
            </h3>
            <p className="text-ink-light text-sm mb-6">
              {currentStatus === 'upcoming'
                ? `确定取消「${current.groupName}」对这张长椅的认养吗？取消后长椅将回到待认养。`
                : `确定让「${current.groupName}」提前退出吗？退出后长椅将回到待认养，且不能补登记养护记录。`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
              >
                再想想
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
