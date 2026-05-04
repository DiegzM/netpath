import { create } from 'zustand';
import type { ValidationStatus } from '../types/curriculum';
import { STAGES } from '../data/stages';
import { useCanvasStore } from './useCanvasStore';
import { useSimStore } from './useSimStore';

interface StoredProgress {
  currentStageIndex: number;
  completedStages: number[];
}

interface CurriculumState {
  activeUserId:      string | null;
  currentStageIndex: number;
  completedStages:   number[];
  validationStatus:  ValidationStatus;
  showHint:          boolean;

  setActiveUser: (userId: string | null) => void;
  goToStage:     (index: number) => void;
  validate:      () => void;
  completeStage: () => void;
  toggleHint:    () => void;
}

const DEFAULT_PROGRESS: StoredProgress = {
  currentStageIndex: 0,
  completedStages: [],
};

function progressKey(userId: string) {
  return `netpath:progress:${userId}`;
}

function loadProgress(userId: string): StoredProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;

  try {
    const raw = window.localStorage.getItem(progressKey(userId));
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const stageIndex = typeof parsed.currentStageIndex === 'number' ? parsed.currentStageIndex : 0;
    const completedStages = Array.isArray(parsed.completedStages) ? parsed.completedStages : [];
    return { currentStageIndex: stageIndex, completedStages };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(userId: string | null, progress: StoredProgress) {
  if (typeof window === 'undefined' || !userId) return;

  window.localStorage.setItem(progressKey(userId), JSON.stringify(progress));
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  activeUserId:      null,
  currentStageIndex: 0,
  completedStages:   [],
  validationStatus:  'idle',
  showHint:          false,

  setActiveUser(userId) {
    if (!userId) {
      useSimStore.getState().stop();
      useCanvasStore.getState().resetToStage(0);
      set({
        activeUserId: userId,
        ...DEFAULT_PROGRESS,
        validationStatus: 'idle',
        showHint: false,
      });
      return;
    }

    const progress = loadProgress(userId);
    const stageIndex = Math.min(progress.currentStageIndex, STAGES.length - 1);
    useSimStore.getState().stop();
    useCanvasStore.getState().resetToStage(stageIndex);
    set({
      activeUserId: userId,
      currentStageIndex: stageIndex,
      completedStages: progress.completedStages,
      validationStatus: 'idle',
      showHint: false,
    });
  },

  goToStage(index) {
    const stage = STAGES[index];
    if (!stage) return;
    // Reset canvas to match the new stage
    useSimStore.getState().stop();
    useCanvasStore.getState().resetToStage(index);
    set((state) => {
      saveProgress(state.activeUserId, {
        currentStageIndex: index,
        completedStages: state.completedStages,
      });
      return {
        currentStageIndex: index,
        validationStatus: 'idle',
        showHint: false,
      };
    });
  },

  validate() {
    const { devices, connections } = useCanvasStore.getState();
    const state = get();
    const stage = STAGES[state.currentStageIndex];
    const status = stage.validateFn(devices, connections);
    const stageId = stage.id;

    const completedStages = status === 'valid' && !state.completedStages.includes(stageId)
      ? [...state.completedStages, stageId]
      : state.completedStages;

    saveProgress(state.activeUserId, {
      currentStageIndex: state.currentStageIndex,
      completedStages,
    });

    set({
      validationStatus: status,
      completedStages,
    });
  },

  completeStage() {
    const { activeUserId, currentStageIndex, completedStages } = get();
    const stageId = STAGES[currentStageIndex].id;
    if (!completedStages.includes(stageId)) {
      const nextCompletedStages = [...completedStages, stageId];
      saveProgress(activeUserId, {
        currentStageIndex,
        completedStages: nextCompletedStages,
      });
      set({ completedStages: nextCompletedStages });
    }
  },

  toggleHint() {
    set(s => ({ showHint: !s.showHint }));
  },
}));
