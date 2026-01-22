import type { Assignment } from './types';

/**
 * Check if two time ranges overlap
 */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Find overlapping assignments for a resource
 */
export function findOverlappingAssignments(
  resourceId: string,
  start: Date,
  end: Date,
  existingAssignments: Assignment[],
  excludeAssignmentId?: string
): Assignment[] {
  return existingAssignments.filter((assignment) => {
    if (assignment.resourceId !== resourceId) return false;
    if (excludeAssignmentId && assignment.id === excludeAssignmentId) return false;
    
    const assignmentStart = new Date(assignment.start);
    const assignmentEnd = new Date(assignment.end);
    
    return rangesOverlap(start, end, assignmentStart, assignmentEnd);
  });
}

/**
 * Check if an assignment can be created without conflicts
 */
export function canCreateAssignment(
  resourceId: string,
  start: Date,
  end: Date,
  existingAssignments: Assignment[],
  allowOverlap = false
): { valid: boolean; conflicts: Assignment[] } {
  if (allowOverlap) {
    return { valid: true, conflicts: [] };
  }
  
  const conflicts = findOverlappingAssignments(
    resourceId,
    start,
    end,
    existingAssignments
  );
  
  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}
