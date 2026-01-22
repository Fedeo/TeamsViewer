// Centralized query keys for TanStack Query
// Reuse these everywhere to ensure consistent cache invalidation

export const queryKeys = {
  // Technicians (Resources)
  technicians: {
    all: ['technicians'] as const,
    detail: (id: string) => ['technicians', id] as const,
  },

  // Teams
  teams: {
    all: ['teams'] as const,
    detail: (id: string) => ['teams', id] as const,
    composition: (id: string) => ['teams', id, 'composition'] as const,
  },

  // Assignments
  assignments: {
    all: ['assignments'] as const,
    byTeam: (teamId: string) => ['assignments', 'team', teamId] as const,
    byResource: (resourceId: string) => ['assignments', 'resource', resourceId] as const,
  },

  // Combined scheduler data
  scheduler: {
    all: ['scheduler'] as const,
  },
} as const;
