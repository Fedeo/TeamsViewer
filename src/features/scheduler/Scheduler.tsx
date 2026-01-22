'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSchedulerData, useCreateAssignment, useUpdateAssignment } from '@/lib/query/hooks';
import { useUIStore } from '@/lib/store/ui-store';
import { ResourcePanel, SchedulerBoard, AssignmentDialog } from './components';
import type { Resource, Team, Assignment } from '@/domain/types';
import styles from './Scheduler.module.css';

export function Scheduler() {
  const { data, isLoading } = useSchedulerData();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleConfirmAssignment = useCallback(
    async (start: string, end: string, isTeamLeader: boolean, role?: string) => {
      if (!pendingAssignment) return;

      setValidationError(null);

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
        }
        closeAssignmentDialog();
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

      <DragOverlay>
        {/* Could render a preview of the dragged item here */}
      </DragOverlay>
    </DndContext>
  );
}
