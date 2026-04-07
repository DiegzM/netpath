import { create } from 'zustand';
import type { ValidationStatus } from '../types/curriculum';
import { STAGES } from '../data/stages';
import { useCanvasStore } from './useCanvasStore';

interface CurriculumState {
  currentStageIndex: number;
  completedStages:   number[];
  validationStatus:  ValidationStatus;
  showHint:          boolean;

  goToStage:     (index: number) => void;
  validate:      () => void;
  completeStage: () => void;
  toggleHint:    () => void;
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  currentStageIndex: 0,
  completedStages:   [],
  validationStatus:  'idle',
  showHint:          false,

  goToStage(index) {
    const stage = STAGES[index];
    if (!stage) return;
    // Reset canvas to match the new stage
    useCanvasStore.getState().resetToStage(index);
    set({
      currentStageIndex: index,
      validationStatus:  'idle',
      showHint:          false,
    });
  },

  validate() {
    const { devices, connections } = useCanvasStore.getState();
    const stage  = STAGES[get().currentStageIndex];
    const status = stage.validateFn(devices, connections);
    set({ validationStatus: status });
  },

  completeStage() {
    const { currentStageIndex, completedStages } = get();
    const stageId = STAGES[currentStageIndex].id;
    if (!completedStages.includes(stageId)) {
      set({ completedStages: [...completedStages, stageId] });
    }
  },

  toggleHint() {
    set(s => ({ showHint: !s.showHint }));
  },
}));
