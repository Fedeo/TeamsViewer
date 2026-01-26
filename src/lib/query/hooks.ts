'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from './keys';
import type { CreateAssignmentInput, UpdateAssignmentInput, Assignment } from '@/domain/types';

// Technicians (Resources)
export function useTechnicians() {
  return useQuery({
    queryKey: queryKeys.technicians.all,
    queryFn: () => api.getTechnicians(),
  });
}

// Teams
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => api.getTeams(),
  });
}

// Team Composition (getTeam with members)
export function useTeamComposition(teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.composition(teamId),
    queryFn: () => api.getTeam(teamId),
    enabled: !!teamId,
  });
}

// Assignments
export function useAssignments() {
  return useQuery({
    queryKey: queryKeys.assignments.all,
    queryFn: () => api.getAssignments(),
  });
}

// Combined scheduler data (efficient single fetch)
export function useSchedulerData() {
  return useQuery({
    queryKey: queryKeys.scheduler.all,
    queryFn: () => api.getSchedulerData(),
    staleTime: 1000 * 30, // 30 seconds for live data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus (handled by refresh button)
  });
}

// Create assignment with optimistic update
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => api.createAssignment(input),
    onMutate: async (newAssignment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.scheduler.all });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.scheduler.all);

      // Optimistically update
      queryClient.setQueryData(queryKeys.scheduler.all, (old: Awaited<ReturnType<typeof api.getSchedulerData>> | undefined) => {
        if (!old) return old;
        const optimisticAssignment: Assignment = {
          ...newAssignment,
          id: `temp-${Date.now()}`,
        };
        return {
          ...old,
          assignments: [...old.assignments, optimisticAssignment],
        };
      });

      return { previousData };
    },
    onError: (_err, _newAssignment, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.scheduler.all, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduler.all });
    },
  });
}

// Update assignment with optimistic update
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAssignmentInput) => {
      console.log('[Mutation] updateAssignment called with:', input);
      return api.updateAssignment(input);
    },
    onMutate: async (updatedAssignment) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.scheduler.all });

      const previousData = queryClient.getQueryData(queryKeys.scheduler.all);

      queryClient.setQueryData(queryKeys.scheduler.all, (old: Awaited<ReturnType<typeof api.getSchedulerData>> | undefined) => {
        if (!old) {
          console.warn('[Mutation] No existing data to update');
          return old;
        }
        const updated = {
          ...old,
          assignments: old.assignments.map((a) => {
            if (a.id === updatedAssignment.id) {
              const merged = { ...a, ...updatedAssignment };
              console.log('[Mutation] Optimistically updating assignment:', {
                id: a.id,
                oldStart: a.start,
                oldEnd: a.end,
                newStart: merged.start,
                newEnd: merged.end,
              });
              return merged;
            }
            return a;
          }),
        };
        return updated;
      });

      return { previousData };
    },
    onSuccess: (data) => {
      console.log('[Mutation] updateAssignment succeeded:', data);
    },
    onError: (err, _updatedAssignment, context) => {
      console.error('[Mutation] updateAssignment failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.scheduler.all, context.previousData);
        console.log('[Mutation] Rolled back to previous data');
      }
    },
    onSettled: () => {
      // Invalidate to refetch from working state
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduler.all });
      console.log('[Mutation] Invalidated scheduler query');
    },
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteAssignment(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.scheduler.all });

      const previousData = queryClient.getQueryData(queryKeys.scheduler.all);

      queryClient.setQueryData(queryKeys.scheduler.all, (old: Awaited<ReturnType<typeof api.getSchedulerData>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          assignments: old.assignments.filter((a) => a.id !== deletedId),
        };
      });

      return { previousData };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.scheduler.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduler.all });
    },
  });
}

// Create team
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; description?: string; color: string }) => 
      api.createTeam(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduler.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}
