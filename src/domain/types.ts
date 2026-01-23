// Domain types for the Crew/Team Scheduler
// Aligned with IFS Cloud data structures

export interface Resource {
  id: string;
  description: string; // Full name (name + surname)
  ResourceSeq: number; // Unique sequence number from IFS Cloud
  role: string;
  skills: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string; // ISO string
}

export interface Assignment {
  id: string;
  resourceId: string;
  teamId: string;
  start: string; // ISO string UTC
  end: string;   // ISO string UTC
  role?: string;
  isTeamLeader: boolean;
}

// Team composition returned by getTeam(teamId)
export interface TeamMember {
  resourceId: string;
  resourceName: string;
  resourceSurname: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  isTeamLeader: boolean;
}

export interface TeamComposition {
  teamId: string;
  teamName: string;
  description?: string;
  color: string;
  members: TeamMember[];
}

// View models for UI
export interface AssignmentWithResource extends Assignment {
  resource: Resource;
}

export interface TeamWithAssignments extends Team {
  assignments: AssignmentWithResource[];
}

// Input types for mutations
export interface CreateAssignmentInput {
  resourceId: string;
  teamId: string;
  start: string;
  end: string;
  role?: string;
  isTeamLeader?: boolean;
}

export interface UpdateAssignmentInput {
  id: string;
  start?: string;
  end?: string;
  teamId?: string;
  isTeamLeader?: boolean;
}

// Time range for the scheduler view
export interface TimeRange {
  start: Date;
  end: Date;
}

// Drag/drop context
export interface DragContext {
  type: 'resource' | 'assignment';
  id: string;
  sourceTeamId?: string;
}

// Validation error for team leader conflicts
export interface TeamLeaderValidation {
  hasLeader: boolean;
  conflictingAssignment?: Assignment;
  gapPeriods?: { start: Date; end: Date }[];
}
