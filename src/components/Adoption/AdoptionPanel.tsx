import { useState } from 'react';
import {
  HandHeart,
  CircleDashed,
  CalendarDays,
  ClipboardList,
  Plus,
  LogOut,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { Bench } from '@/types';
import { useBenchStore } from '@/store/useBenchStore';
import {
  getActiveAdoption,
  getNextMaintenanceDate,
  isMaintenanceOverdue,
  formatDate,
  todayString,
  addDays,
} from '@/utils/adoption';

interface AdoptionPanelProps {
  bench: Bench;
}

export default function AdoptionPanel({ bench }: AdoptionPanelProps) {
  const { addAdoption, endAdoption, addMaintenanceRecord, deleteMaintenanceRecord } = useBenchStore();

  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState(addDays(todayString(), 90));
  const [intervalDays, setIntervalDays] = useState(14);
  const [adoptionError, setAdoptionError] = useState('');
  const [adoptionSuccess, setAdoptionSuccess] = useState('');
  const [confirmQuitId, setConfirmQuitId] = useState<string | null>(null);

  const [recordDate, setRecordDate] = useState(todayString());
  const [recordNotes, setRecordNotes] = useState('');
  const [recordError, setRecordError] = useState('');

  const activeAdoption = getActiveAdoption(bench);
  const nextDate = getNextMaintenanceDate(bench);
  const overdue = isMaintenanceOverdue(bench);

  const sortedAdoptions = [...bench.adoptions].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedRecords = [...bench.maintenanceRecords].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdopt = (e: React.FormEvent) => {
    e.preventDefault();
    setAdoptionError('');
    setAdoptionSuccess('');
    const result = addAdoption(bench.id, { groupName, startDate, endDate, intervalDays });
    if (result.ok) {
      setAdoptionSuccess('认养登记成功');
      setGroupName('');
    } else {
      setAdoptionError(result.error || '认养登记失败');
    }
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError('');
    const result = addMaintenanceRecord(bench.id, { date: recordDate, notes: recordNotes });
    if (result.ok) {
      setRecordNotes('');
    } else {
      setRecordError(result.error || '养护记录失败');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors';

  return (
    <>
      <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-deep-brown">认养信息</h2>
          {activeAdoption ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-full">
              <HandHeart className="w-3 h-3" />
              认养中
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-ochre/10 text-ochre text-xs rounded-full border border-ochre/30 border-dashed">
              <CircleDashed className="w-3 h-3" />
              待认养
            </span>
          )}
        </div>

        {activeAdoption ? (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-ink-light">认养小组</span>
              <span className="text-deep-brown font-medium">{activeAdoption.groupName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light">认养期限</span>
              <span className="text-deep-brown">
                {formatDate(activeAdoption.startDate)} ~ {formatDate(activeAdoption.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light">养护间隔</span>
              <span className="text-deep-brown">每 {activeAdoption.intervalDays} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light">下次养护日</span>
              <span className={overdue ? 'text-red-500 font-medium' : 'text-deep-brown'}>
                {nextDate ? formatDate(nextDate) : '—'}
                {overdue && '（已逾期）'}
              </span>
            </div>

            <div className="pt-2">
              {confirmQuitId === activeAdoption.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-light flex-1">确认退出认养？</span>
                  <button
                    onClick={() => {
                      endAdoption(bench.id, activeAdoption.id);
                      setConfirmQuitId(null);
                    }}
                    className="px-3 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    确认退出
                  </button>
                  <button
                    onClick={() => setConfirmQuitId(null)}
                    className="px-3 py-1.5 text-xs text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmQuitId(activeAdoption.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  退出认养
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-light mb-4">
            当前暂无小组认养，待认养期间不能补养护记录。
          </p>
        )}

        <form onSubmit={handleAdopt} className="pt-4 border-t border-deep-brown/10 space-y-3">
          <h3 className="text-sm font-medium text-deep-brown">登记认养</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="认养小组名称"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ink-light mb-1 block">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-ink-light mb-1 block">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-light mb-1 block">养护间隔（天）</label>
            <input
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value, 10) || 0)}
              className={inputClass}
            />
          </div>

          {adoptionError && (
            <p className="flex items-start gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {adoptionError}
            </p>
          )}
          {adoptionSuccess && (
            <p className="text-xs text-moss-green">{adoptionSuccess}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-moss-green text-white text-sm rounded-lg font-medium hover:bg-moss-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            登记认养
          </button>
        </form>

        {sortedAdoptions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-deep-brown/10">
            <h3 className="text-sm font-medium text-deep-brown mb-2">认养历史</h3>
            <div className="space-y-2">
              {sortedAdoptions.map((adoption) => {
                const isActive = activeAdoption?.id === adoption.id;
                return (
                  <div
                    key={adoption.id}
                    className="flex items-center justify-between text-xs p-2 bg-warm-cream/50 rounded-lg"
                  >
                    <span className={isActive ? 'text-moss-green font-medium' : 'text-deep-brown'}>
                      {adoption.groupName}
                      {isActive && '（进行中）'}
                    </span>
                    <span className="text-ink-light">
                      {formatDate(adoption.startDate)} ~ {formatDate(adoption.endDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-3">
        <h2 className="font-serif text-lg font-semibold text-deep-brown mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-moss-green" />
          养护记录
        </h2>

        {sortedRecords.length > 0 ? (
          <div className="space-y-3 mb-4">
            {sortedRecords.map((record) => (
              <div key={record.id} className="p-3 bg-warm-cream/50 rounded-lg group">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs text-ink-light">
                    <CalendarDays className="w-3.5 h-3.5 text-ochre" />
                    {formatDate(record.date)}
                  </span>
                  <button
                    onClick={() => deleteMaintenanceRecord(bench.id, record.id)}
                    className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {record.notes && (
                  <p className="text-sm text-ink-light leading-relaxed">{record.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-light mb-4">还没有养护记录</p>
        )}

        <form onSubmit={handleAddRecord} className="pt-4 border-t border-deep-brown/10 space-y-3">
          <h3 className="text-sm font-medium text-deep-brown">补记养护</h3>
          <div>
            <label className="text-xs text-ink-light mb-1 block">养护日期</label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <textarea
            value={recordNotes}
            onChange={(e) => setRecordNotes(e.target.value)}
            placeholder="养护内容备注..."
            rows={2}
            className={`${inputClass} resize-none`}
          />

          {recordError && (
            <p className="flex items-start gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {recordError}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-ochre text-white text-sm rounded-lg font-medium hover:bg-ochre-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加养护记录
          </button>
        </form>
      </div>
    </>
  );
}
