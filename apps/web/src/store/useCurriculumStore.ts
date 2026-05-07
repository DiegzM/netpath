import { create } from 'zustand';
import type { ValidationStatus } from '../types/curriculum';
import { STAGES } from '../data/stages';
import { combineValidationStatuses, validateStageStream } from '../engine/validation';
import { useCanvasStore } from './useCanvasStore';
import { apiRequest } from '../auth/api';
import { getAccessToken } from '../auth/storage';

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

interface ProgressResponse {
  currentStageIndex: number;
  completedStageIds: number[];
}

function getMaxUnlockedStageIndex(completedStages: number[]): number {
  let maxUnlocked = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (completedStages.includes(STAGES[i].id)) {
      maxUnlocked = Math.min(i + 1, STAGES.length - 1);
      continue;
    }
    break;
  }
  return maxUnlocked;
}

async function loadProgressFromApi(userId: string): Promise<StoredProgress> {
  const token = getAccessToken();
  if (!token) return DEFAULT_PROGRESS;

  try {
    const progress = await apiRequest<ProgressResponse>('/progress', { token });
    return {
      currentStageIndex: progress.currentStageIndex,
      completedStages: progress.completedStageIds,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

async function saveProgressToApi(userId: string | null, progress: StoredProgress) {
  if (!userId) return;

  const token = getAccessToken();
  if (!token) return;

  try {
    await apiRequest('/progress', {
      method: 'PUT',
      token,
      body: {
        currentStageIndex: progress.currentStageIndex,
        completedStageIds: progress.completedStages,
      },
    });
  } catch {
    // Avoid interrupting the game loop on save failures.
  }
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  activeUserId:      null,
  currentStageIndex: 0,
  completedStages:   [],
  validationStatus:  'idle',
  showHint:          false,

  setActiveUser(userId) {
    if (!userId) {
      useCanvasStore.getState().resetToStage(0);
      set({
        activeUserId: userId,
        ...DEFAULT_PROGRESS,
        validationStatus: 'idle',
        showHint: false,
      });
      return;
    }

    set({
      activeUserId: userId,
      ...DEFAULT_PROGRESS,
      validationStatus: 'idle',
      showHint: false,
    });

    void loadProgressFromApi(userId).then((progress) => {
      const maxUnlocked = getMaxUnlockedStageIndex(progress.completedStages);
      const stageIndex = Math.min(Math.min(progress.currentStageIndex, STAGES.length - 1), maxUnlocked);
      useCanvasStore.getState().resetToStage(stageIndex);
      set({
        activeUserId: userId,
        currentStageIndex: stageIndex,
        completedStages: progress.completedStages,
        validationStatus: 'idle',
        showHint: false,
      });
    });
  },

  goToStage(index) {
    const stage = STAGES[index];
    if (!stage) return;
    const maxUnlocked = getMaxUnlockedStageIndex(get().completedStages);
    if (index > maxUnlocked) return;
    // Reset canvas to match the new stage
    useCanvasStore.getState().resetToStage(index);
    set((state) => {
      void saveProgressToApi(state.activeUserId, {
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
    const topologyStatus = stage.validateFn(devices, connections);
    const streamStatus = stage.stream
      ? validateStageStream(stage.stream, devices, connections)
      : 'valid';
    const status = combineValidationStatuses([topologyStatus, streamStatus]);
    const stageId = stage.id;

    const completedStages = status === 'valid' && !state.completedStages.includes(stageId)
      ? [...state.completedStages, stageId]
      : state.completedStages;

    void saveProgressToApi(state.activeUserId, {
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
      void saveProgressToApi(activeUserId, {
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
