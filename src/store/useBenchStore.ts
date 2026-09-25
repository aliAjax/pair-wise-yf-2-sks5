import { create } from 'zustand';
import type { Bench, BenchExperience, Adoption, MaintenanceRecord, MaterialType, OrientationType, ShadeLevelType, NoiseLevelType, StayDurationType } from '@/types';
import { loadBenches, saveBenches } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import { findConflictingAdoption, getActiveAdoption, formatDate, addDays, todayString } from '@/utils/adoption';
import { mockBenches } from '@/data/mockBenches';

interface ActionResult {
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
  addAdoption: (benchId: string, adoption: { groupName: string; startDate: string; endDate: string; intervalDays: number }) => ActionResult;
  endAdoption: (benchId: string, adoptionId: string) => void;
  addMaintenanceRecord: (benchId: string, record: { date: string; notes: string }) => ActionResult;
  deleteMaintenanceRecord: (benchId: string, recordId: string) => void;
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

function normalizeBench(bench: Bench): Bench {
  return {
    ...bench,
    experiences: bench.experiences ?? [],
    adoptions: bench.adoptions ?? [],
    maintenanceRecords: bench.maintenanceRecords ?? [],
  };
}

export const useBenchStore = create<BenchState & BenchActions>((set, get) => ({
  ...initialState,

  initialize: () => {
    const stored = loadBenches();
    if (stored.length > 0) {
      set({ benches: stored.map(normalizeBench), initialized: true });
    } else {
      const benches = mockBenches.map(normalizeBench);
      set({ benches, initialized: true });
      saveBenches(benches);
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

  addAdoption: (benchId, adoptionData) => {
    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) return { ok: false, error: '长椅不存在' };

    const groupName = adoptionData.groupName.trim();
    if (!groupName) return { ok: false, error: '请填写认养小组名称' };
    if (!adoptionData.startDate || !adoptionData.endDate) {
      return { ok: false, error: '请选择认养起止日期' };
    }
    if (adoptionData.startDate > adoptionData.endDate) {
      return { ok: false, error: '开始日期不能晚于结束日期' };
    }
    if (!Number.isInteger(adoptionData.intervalDays) || adoptionData.intervalDays < 1) {
      return { ok: false, error: '养护间隔至少为 1 天' };
    }

    const conflict = findConflictingAdoption(bench, adoptionData.startDate, adoptionData.endDate);
    if (conflict) {
      return {
        ok: false,
        error: `与「${conflict.groupName}」的认养期（${formatDate(conflict.startDate)} ~ ${formatDate(conflict.endDate)}）重叠，已保留原认养`,
      };
    }

    const newAdoption: Adoption = {
      id: generateId(),
      benchId,
      groupName,
      startDate: adoptionData.startDate,
      endDate: adoptionData.endDate,
      intervalDays: adoptionData.intervalDays,
      createdAt: new Date().toISOString(),
    };
    const newBenches = get().benches.map((b) =>
      b.id === benchId
        ? {
            ...b,
            adoptions: [...b.adoptions, newAdoption],
            updatedAt: new Date().toISOString(),
          }
        : b
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  endAdoption: (benchId, adoptionId) => {
    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) return;

    const today = todayString();
    const newBenches = get().benches.map((b) => {
      if (b.id !== benchId) return b;
      const adoption = b.adoptions.find((a) => a.id === adoptionId);
      if (!adoption) return b;
      // 尚未开始的认养直接移除；进行中的认养提前到昨天结束，即刻回到待认养
      if (adoption.startDate >= today) {
        return {
          ...b,
          adoptions: b.adoptions.filter((a) => a.id !== adoptionId),
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...b,
        adoptions: b.adoptions.map((a) =>
          a.id === adoptionId ? { ...a, endDate: addDays(today, -1) } : a
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  addMaintenanceRecord: (benchId, recordData) => {
    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) return { ok: false, error: '长椅不存在' };
    if (!recordData.date) return { ok: false, error: '请选择养护日期' };

    const adoption = getActiveAdoption(bench, recordData.date);
    if (!adoption) {
      return { ok: false, error: '该日期处于待认养期间，不能补养护记录' };
    }

    const newRecord: MaintenanceRecord = {
      id: generateId(),
      benchId,
      adoptionId: adoption.id,
      date: recordData.date,
      notes: recordData.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const newBenches = get().benches.map((b) =>
      b.id === benchId
        ? {
            ...b,
            maintenanceRecords: [...b.maintenanceRecords, newRecord],
            updatedAt: new Date().toISOString(),
          }
        : b
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  deleteMaintenanceRecord: (benchId, recordId) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            maintenanceRecords: bench.maintenanceRecords.filter((r) => r.id !== recordId),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
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
