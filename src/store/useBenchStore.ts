import { create } from 'zustand';
import type { Bench, BenchExperience, MaterialType, OrientationType, ShadeLevelType, NoiseLevelType, Adoption, MaintenanceRecord } from '@/types';
import { loadBenches, saveBenches } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import { findConflictingAdoption, getAdoptionStatus, todayStr } from '@/utils/adoption';
import { mockBenches } from '@/data/mockBenches';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface BenchState {
  benches: Bench[];
  searchQuery: string;
  materialFilter: MaterialType | null;
  orientationFilter: OrientationType | null;
  shadeFilter: ShadeLevelType | null;
  noiseFilter: NoiseLevelType | null;
  initialized: boolean;
}

interface BenchActions {
  initialize: () => void;
  setSearchQuery: (query: string) => void;
  setMaterialFilter: (material: MaterialType | null) => void;
  setOrientationFilter: (orientation: OrientationType | null) => void;
  setShadeFilter: (shade: ShadeLevelType | null) => void;
  setNoiseFilter: (noise: NoiseLevelType | null) => void;
  clearFilters: () => void;
  addBench: (bench: Omit<Bench, 'id' | 'createdAt' | 'updatedAt' | 'experiences' | 'adoptions' | 'maintenanceRecords'>) => void;
  updateBench: (id: string, updates: Partial<Bench>) => void;
  deleteBench: (id: string) => void;
  getBenchById: (id: string) => Bench | undefined;
  addExperience: (benchId: string, experience: Omit<BenchExperience, 'id' | 'benchId'>) => void;
  updateExperience: (benchId: string, expId: string, updates: Partial<BenchExperience>) => void;
  deleteExperience: (benchId: string, expId: string) => void;
  /** 登记认养：小组、起止日期、养护间隔；区间冲突时保留原认养并返回失败 */
  adoptBench: (
    benchId: string,
    data: { groupName: string; startDate: string; endDate: string; intervalDays: number },
  ) => ActionResult;
  /** 小组提前退出，长椅回到待认养 */
  withdrawAdoption: (benchId: string, adoptionId: string, date?: string) => ActionResult;
  /** 登记养护记录，仅认养期间允许 */
  addMaintenanceRecord: (
    benchId: string,
    data: { adoptionId: string; date: string; note: string },
  ) => ActionResult;
  getFilteredBenches: () => Bench[];
}

const initialState: BenchState = {
  benches: [],
  searchQuery: '',
  materialFilter: null,
  orientationFilter: null,
  shadeFilter: null,
  noiseFilter: null,
  initialized: false,
};

export const useBenchStore = create<BenchState & BenchActions>((set, get) => ({
  ...initialState,

  initialize: () => {
    const stored = loadBenches();
    if (stored.length > 0) {
      set({ benches: stored, initialized: true });
    } else {
      set({ benches: mockBenches, initialized: true });
      saveBenches(mockBenches);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMaterialFilter: (material) => set({ materialFilter: material }),
  setOrientationFilter: (orientation) => set({ orientationFilter: orientation }),
  setShadeFilter: (shade) => set({ shadeFilter: shade }),
  setNoiseFilter: (noise) => set({ noiseFilter: noise }),

  clearFilters: () => set({
    searchQuery: '',
    materialFilter: null,
    orientationFilter: null,
    shadeFilter: null,
    noiseFilter: null,
  }),

  addBench: (benchData) => {
    const now = new Date().toISOString();
    const newBench: Bench = {
      ...benchData,
      id: generateId(),
      experiences: [],
      adoptions: [],
      maintenanceRecords: [],
      createdAt: now,
      updatedAt: now,
    };
    const newBenches = [newBench, ...get().benches];
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateBench: (id, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === id
        ? { ...bench, ...updates, updatedAt: new Date().toISOString() }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteBench: (id) => {
    const newBenches = get().benches.filter((bench) => bench.id !== id);
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  getBenchById: (id) => {
    return get().benches.find((bench) => bench.id === id);
  },

  addExperience: (benchId, experienceData) => {
    const newExperience: BenchExperience = {
      ...experienceData,
      id: generateId(),
      benchId,
    };
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: [...bench.experiences, newExperience],
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateExperience: (benchId, expId, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.map((exp) =>
              exp.id === expId ? { ...exp, ...updates } : exp
            ),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteExperience: (benchId, expId) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.filter((exp) => exp.id !== expId),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  adoptBench: (benchId, data) => {
    const groupName = data.groupName.trim();
    if (!groupName) return { ok: false, error: '请填写认养小组名称' };
    if (!data.startDate || !data.endDate) {
      return { ok: false, error: '请选择认养起止日期' };
    }
    if (data.endDate < data.startDate) {
      return { ok: false, error: '截止日期不能早于起始日期' };
    }
    if (!Number.isInteger(data.intervalDays) || data.intervalDays <= 0) {
      return { ok: false, error: '请选择有效的养护间隔' };
    }

    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) return { ok: false, error: '长椅不存在' };

    const conflict = findConflictingAdoption(
      bench.adoptions,
      data.startDate,
      data.endDate,
    );
    if (conflict) {
      // 冲突时保留原认养，拒绝新登记
      return {
        ok: false,
        error: `该日期区间与「${conflict.groupName}」的认养时间重叠，已保留原认养`,
      };
    }

    const now = new Date().toISOString();
    const newAdoption: Adoption = {
      id: generateId(),
      groupName,
      startDate: data.startDate,
      endDate: data.endDate,
      intervalDays: data.intervalDays,
      withdrawnAt: null,
      createdAt: now,
    };
    const newBenches = get().benches.map((b) =>
      b.id === benchId
        ? { ...b, adoptions: [...b.adoptions, newAdoption], updatedAt: now }
        : b,
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  withdrawAdoption: (benchId, adoptionId, date) => {
    const bench = get().benches.find((b) => b.id === benchId);
    const adoption = bench?.adoptions.find((a) => a.id === adoptionId);
    if (!bench || !adoption) return { ok: false, error: '认养记录不存在' };

    const status = getAdoptionStatus(adoption);
    if (status !== 'active' && status !== 'upcoming') {
      return { ok: false, error: '该认养已结束，无法退出' };
    }

    // 认养中退出记录退出日期；待生效取消时记录取消日期（早于起始日，不占用区间）
    const withdrawnAt = date || todayStr();
    const now = new Date().toISOString();
    const newBenches = get().benches.map((b) =>
      b.id === benchId
        ? {
            ...b,
            adoptions: b.adoptions.map((a) =>
              a.id === adoptionId ? { ...a, withdrawnAt } : a,
            ),
            updatedAt: now,
          }
        : b,
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  addMaintenanceRecord: (benchId, data) => {
    const bench = get().benches.find((b) => b.id === benchId);
    const adoption = bench?.adoptions.find((a) => a.id === data.adoptionId);
    if (!bench || !adoption) return { ok: false, error: '认养记录不存在' };

    // 待认养（含已到期、已退出）期间不能补养护记录
    const status = getAdoptionStatus(adoption);
    if (status !== 'active') {
      return { ok: false, error: '仅认养中可以登记养护记录' };
    }
    if (!data.date) return { ok: false, error: '请选择养护日期' };
    if (data.date < adoption.startDate || data.date > adoption.endDate) {
      return { ok: false, error: '养护日期需在认养区间内' };
    }
    if (data.date > todayStr()) {
      return { ok: false, error: '不能登记未来的养护记录' };
    }

    const newRecord: MaintenanceRecord = {
      id: generateId(),
      adoptionId: data.adoptionId,
      date: data.date,
      note: data.note.trim(),
      createdAt: new Date().toISOString(),
    };
    const newBenches = get().benches.map((b) =>
      b.id === benchId
        ? {
            ...b,
            maintenanceRecords: [...b.maintenanceRecords, newRecord],
            updatedAt: new Date().toISOString(),
          }
        : b,
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  getFilteredBenches: () => {
    const { benches, searchQuery, materialFilter, orientationFilter, shadeFilter, noiseFilter } = get();
    
    return benches.filter((bench) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = bench.name.toLowerCase().includes(query);
        const matchLocation = bench.location.toLowerCase().includes(query);
        const matchReview = bench.review.toLowerCase().includes(query);
        if (!matchName && !matchLocation && !matchReview) return false;
      }
      
      if (materialFilter && bench.material !== materialFilter) return false;
      if (orientationFilter && bench.orientation !== orientationFilter) return false;
      if (shadeFilter && bench.shadeLevel !== shadeFilter) return false;
      if (noiseFilter && bench.noiseLevel !== noiseFilter) return false;
      
      return true;
    });
  },
}));
