'use client';

import { useCallback, useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSchedulerData, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from '@/lib/query/hooks';
import { useUIStore } from '@/lib/store/ui-store';
import { findCrossTeamOverlaps } from '@/domain/overlap';

const { markAsChanged } = useUIStore.getState();
import { ResourcePanel, SchedulerBoard, AssignmentDialog, NewTeamFab } from './components';
import type { Resource, Team, Assignment } from '@/domain/types';
import styles from './Scheduler.module.css';

interface OverlapWarning {
  overlappingTeams: string[];
}

export function Scheduler() {
  const { data, isLoading } = useSchedulerData();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<OverlapWarning | null>(null);
  const [autoExpandTeamId, setAutoExpandTeamId] = useState<string | null>(null);

  // Create a map of team IDs to team names for overlap warnings
  const teamNameMap = useMemo(() => {
    const map = new Map<string, string>();
    data?.teams.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [data?.teams]);

  const {
    viewRange,
    dayWidth,
    isAssignmentDialogOpen,
    dialogMode,
    pendingAssignment,
    editingAssignment,
    openAssignmentDialog,
    openEditAssignmentDialog,
    closeAssignmentDialog,
  } = useUIStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    console.debug('Drag started:', active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Dragging a resource onto a team
      if (activeData?.type === 'resource' && overData?.type === 'team') {
        const resource = activeData.resource as Resource;
        const team = overData.team as Team;

        // Open dialog to set dates
        setValidationError(null);
        openAssignmentDialog(resource.id, team.id);
      }
    },
    [openAssignmentDialog]
  );

  const handleCloseDialog = useCallback(() => {
    setValidationError(null);
    closeAssignmentDialog();
  }, [closeAssignmentDialog]);

  const executeAssignment = useCallback(
    async (start: string, end: string, isTeamLeader: boolean, role?: string) => {
      if (!pendingAssignment) return;

      try {
        if (dialogMode === 'edit' && editingAssignment) {
          // Update existing assignment
          await updateAssignment.mutateAsync({
            id: editingAssignment.id,
            start,
            end,
            isTeamLeader,
          });
        } else {
          // Create new assignment
          await createAssignment.mutateAsync({
            resourceId: pendingAssignment.resourceId,
            teamId: pendingAssignment.teamId,
            start,
            end,
            role,
            isTeamLeader,
          });
          // Auto-expand the team that received the new assignment
          setAutoExpandTeamId(pendingAssignment.teamId);
        }
        markAsChanged();
        closeAssignmentDialog();
        setOverlapWarning(null);
      } catch (error) {
        if (error instanceof Error) {
          setValidationError(error.message);
        } else {
          setValidationError('An error occurred while saving the assignment');
        }
      }
    },
    [pendingAssignment, dialogMode, editingAssignment, createAssignment, updateAssignment, closeAssignmentDialog]
  );

  const handleConfirmAssignment = useCallback(
    async (start: string, end: string, isTeamLeader: boolean, role?: string) => {
      if (!pendingAssignment || !data?.assignments) return;

      setValidationError(null);

      // Check for cross-team overlaps
      const overlaps = findCrossTeamOverlaps(
        pendingAssignment.resourceId,
        pendingAssignment.teamId,
        new Date(start),
        new Date(end),
        data.assignments,
        editingAssignment?.id
      );

      if (overlaps.length > 0) {
        // Get unique team names
        const overlappingTeamNames = [...new Set(overlaps.map((o) => teamNameMap.get(o.teamId) || 'Unknown Team'))];
        
        // Show error - technician cannot belong to multiple teams at the same time
        setOverlapWarning({
          overlappingTeams: overlappingTeamNames,
        });
        return;
      }

      // No overlaps, proceed directly
      await executeAssignment(start, end, isTeamLeader, role);
    },
    [pendingAssignment, data?.assignments, editingAssignment, teamNameMap, executeAssignment]
  );

  const handleAssignmentResize = useCallback(
    (id: string, newStart: string, newEnd: string) => {
      // Find the assignment to preserve isTeamLeader
      const assignment = data?.assignments.find((a) => a.id === id);
      updateAssignment.mutate({
        id,
        start: newStart,
        end: newEnd,
        isTeamLeader: assignment?.isTeamLeader,
      });
      markAsChanged();
    },
    [updateAssignment, data?.assignments]
  );

  const handleAssignmentDoubleClick = useCallback(
    (assignment: Assignment) => {
      setValidationError(null);
      openEditAssignmentDialog(assignment);
    },
    [openEditAssignmentDialog]
  );

  const handleAssignmentDelete = useCallback(
    (assignmentId: string) => {
      deleteAssignment.mutate(assignmentId);
      markAsChanged();
    },
    [deleteAssignment]
  );

  const pendingResource = data?.resources.find(
    (r) => r.id === pendingAssignment?.resourceId
  );
  const pendingTeam = data?.teams.find(
    (t) => t.id === pendingAssignment?.teamId
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        <ResourcePanel
          resources={data?.resources || []}
          isLoading={isLoading}
        />

        <SchedulerBoard
          teams={data?.teams || []}
          assignments={data?.assignments || []}
          resources={data?.resources || []}
          viewRange={viewRange}
          dayWidth={dayWidth}
          onAssignmentDoubleClick={handleAssignmentDoubleClick}
          onAssignmentResize={handleAssignmentResize}
          onAssignmentDelete={handleAssignmentDelete}
          autoExpandTeamId={autoExpandTeamId}
        />
      </div>

      <AssignmentDialog
        isOpen={isAssignmentDialogOpen}
        mode={dialogMode}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAssignment}
        resource={pendingResource}
        team={pendingTeam}
        existingAssignment={editingAssignment}
        validationError={validationError}
      />

      {/* Overlap Error Dialog */}
      {overlapWarning && (
        <div className={styles.warningOverlay} onClick={() => setOverlapWarning(null)}>
          <div className={styles.warningDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h3>Cannot Assign</h3>
            <p>
              Resource already working in <strong>{overlapWarning.overlappingTeams.join(', ')}</strong> within this time period.
            </p>
            <p className={styles.warningSubtext}>
              A technician cannot belong to different teams at the same time. Please adjust the dates.
            </p>
            <div className={styles.warningActions}>
              <button 
                className={styles.okButton} 
                onClick={() => setOverlapWarning(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <DragOverlay>
        {/* Could render a preview of the dragged item here */}
      </DragOverlay>

      <NewTeamFab />
    </DndContext>
  );
}
