import { create } from 'zustand';
import type { TimeRange, Assignment } from '@/domain/types';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';

// Zoom levels: dayWidth in pixels
export const ZOOM_LEVELS = [24, 32, 48, 64, 80, 96] as const;
export type ZoomLevel = typeof ZOOM_LEVELS[number];
const DEFAULT_ZOOM_INDEX = 2; // 48px (middle)

interface UIState {
  // Selected items
  selectedTeamId: string | null;
  selectedResourceId: string | null;
  selectedAssignmentId: string | null;

  // Modal states
  isAssignmentDialogOpen: boolean;
  dialogMode: 'create' | 'edit';
  pendingAssignment: {
    resourceId: string;
    teamId: string;
  } | null;
  editingAssignment: Assignment | null;

  // View range
  viewRange: TimeRange;

  // Zoom
  zoomIndex: number;
  dayWidth: ZoomLevel;

  // Actions
  setSelectedTeam: (id: string | null) => void;
  setSelectedResource: (id: string | null) => void;
  setSelectedAssignment: (id: string | null) => void;
  openAssignmentDialog: (resourceId: string, teamId: string) => void;
  openEditAssignmentDialog: (assignment: Assignment) => void;
  closeAssignmentDialog: () => void;
  setViewRange: (range: TimeRange) => void;
  navigateWeeks: (direction: 'prev' | 'next') => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const today = new Date();
const defaultRange: TimeRange = {
  start: startOfWeek(today, { weekStartsOn: 1 }),
  end: endOfWeek(addWeeks(today, 5), { weekStartsOn: 1 }),
};

export const useUIStore = create<UIState>((set) => ({
  selectedTeamId: null,
  selectedResourceId: null,
  selectedAssignmentId: null,
  isAssignmentDialogOpen: false,
  dialogMode: 'create',
  pendingAssignment: null,
  editingAssignment: null,
  viewRange: defaultRange,
  zoomIndex: DEFAULT_ZOOM_INDEX,
  dayWidth: ZOOM_LEVELS[DEFAULT_ZOOM_INDEX],

  setSelectedTeam: (id) => set({ selectedTeamId: id }),
  setSelectedResource: (id) => set({ selectedResourceId: id }),
  setSelectedAssignment: (id) => set({ selectedAssignmentId: id }),

  openAssignmentDialog: (resourceId, teamId) =>
    set({
      isAssignmentDialogOpen: true,
      dialogMode: 'create',
      pendingAssignment: { resourceId, teamId },
      editingAssignment: null,
    }),

  openEditAssignmentDialog: (assignment) =>
    set({
      isAssignmentDialogOpen: true,
      dialogMode: 'edit',
      pendingAssignment: { resourceId: assignment.resourceId, teamId: assignment.teamId },
      editingAssignment: assignment,
    }),

  closeAssignmentDialog: () =>
    set({
      isAssignmentDialogOpen: false,
      pendingAssignment: null,
      editingAssignment: null,
    }),

  setViewRange: (range) => set({ viewRange: range }),

  navigateWeeks: (direction) =>
    set((state) => {
      const weeks = direction === 'next' ? 1 : -1;
      return {
        viewRange: {
          start: addWeeks(state.viewRange.start, weeks),
          end: addWeeks(state.viewRange.end, weeks),
        },
      };
    }),

  zoomIn: () =>
    set((state) => {
      const newIndex = Math.min(state.zoomIndex + 1, ZOOM_LEVELS.length - 1);
      return {
        zoomIndex: newIndex,
        dayWidth: ZOOM_LEVELS[newIndex],
      };
    }),

  zoomOut: () =>
    set((state) => {
      const newIndex = Math.max(state.zoomIndex - 1, 0);
      return {
        zoomIndex: newIndex,
        dayWidth: ZOOM_LEVELS[newIndex],
      };
    }),

  resetZoom: () =>
    set({
      zoomIndex: DEFAULT_ZOOM_INDEX,
      dayWidth: ZOOM_LEVELS[DEFAULT_ZOOM_INDEX],
    }),
}));
