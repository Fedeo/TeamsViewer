// Centralized API client layer
// Facade for IFS Cloud REST API - currently using mock data
// TODO: Replace mock implementations with actual IFS Cloud API calls

import type {
  Resource,
  Team,
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  TeamComposition,
} from '@/domain/types';

// ============================================================================
// MOCK DATA - Will be replaced by IFS Cloud API responses
// ============================================================================

const mockTechnicians: Resource[] = [
  { id: 'tech-001', name: 'James', surname: 'Wilson', role: 'Technician', skills: ['Electrical', 'HVAC'], available: true },
  { id: 'tech-002', name: 'Sarah', surname: 'Mitchell', role: 'Technician', skills: ['Plumbing', 'Gas'], available: true },
  { id: 'tech-003', name: 'Michael', surname: 'Thompson', role: 'Senior Technician', skills: ['Electrical', 'Solar'], available: true },
  { id: 'tech-004', name: 'Emma', surname: 'Davies', role: 'Technician', skills: ['HVAC', 'Refrigeration'], available: true },
  { id: 'tech-005', name: 'Oliver', surname: 'Brown', role: 'Lead Technician', skills: ['All-round', 'Supervision'], available: true },
  { id: 'tech-006', name: 'Charlotte', surname: 'Taylor', role: 'Technician', skills: ['Electrical', 'Automation'], available: true },
  { id: 'tech-007', name: 'William', surname: 'Anderson', role: 'Technician', skills: ['Mechanical', 'Welding'], available: true },
  { id: 'tech-008', name: 'Amelia', surname: 'Roberts', role: 'Technician', skills: ['Plumbing', 'Drainage'], available: true },
];

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Team1', description: 'Primary field service team', color: '#3B82F6', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'team-2', name: 'Team2', description: 'Secondary support team', color: '#10B981', createdAt: '2024-01-15T00:00:00Z' },
];

let mockAssignments: Assignment[] = [
  { id: 'assign-001', resourceId: 'tech-001', teamId: 'team-1', start: '2026-01-20T00:00:00Z', end: '2026-02-05T00:00:00Z', isTeamLeader: false },
  { id: 'assign-001b', resourceId: 'tech-001', teamId: 'team-1', start: '2026-02-15T00:00:00Z', end: '2026-02-28T00:00:00Z', isTeamLeader: false }, // James Wilson second period
  { id: 'assign-002', resourceId: 'tech-003', teamId: 'team-1', start: '2026-01-22T00:00:00Z', end: '2026-02-10T00:00:00Z', isTeamLeader: false },
  { id: 'assign-003', resourceId: 'tech-005', teamId: 'team-1', start: '2026-01-18T00:00:00Z', end: '2026-02-28T00:00:00Z', isTeamLeader: true },
  { id: 'assign-004', resourceId: 'tech-002', teamId: 'team-2', start: '2026-01-25T00:00:00Z', end: '2026-02-20T00:00:00Z', isTeamLeader: true },
  { id: 'assign-005', resourceId: 'tech-006', teamId: 'team-2', start: '2026-01-15T00:00:00Z', end: '2026-03-01T00:00:00Z', isTeamLeader: false },
];

// ============================================================================
// API HELPERS
// ============================================================================

// Simulate network delay (remove when connecting to real API)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if two date ranges overlap
function rangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

// Find conflicting team leader assignments
function findConflictingTeamLeader(
  teamId: string,
  start: Date,
  end: Date,
  excludeAssignmentId?: string
): Assignment | undefined {
  return mockAssignments.find((a) => {
    if (a.teamId !== teamId) return false;
    if (!a.isTeamLeader) return false;
    if (excludeAssignmentId && a.id === excludeAssignmentId) return false;
    
    const aStart = new Date(a.start);
    const aEnd = new Date(a.end);
    return rangesOverlap(start, end, aStart, aEnd);
  });
}

// ============================================================================
// IFS CLOUD API FACADE
// ============================================================================

export const api = {
  /**
   * GET /technicians
   * Retrieve all technicians for the specific resource group
   */
  async getTechnicians(): Promise<Resource[]> {
    await delay(200);
    return [...mockTechnicians];
  },

  /**
   * GET /teams
   * Retrieve all Teams
   */
  async getTeams(): Promise<Team[]> {
    await delay(200);
    return [...mockTeams];
  },

  /**
   * GET /teams/:teamId
   * Retrieve the Team composition with member details
   */
  async getTeam(teamId: string): Promise<TeamComposition | undefined> {
    await delay(150);
    
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) return undefined;

    const teamAssignments = mockAssignments.filter((a) => a.teamId === teamId);
    const members = teamAssignments.map((assignment) => {
      const technician = mockTechnicians.find((t) => t.id === assignment.resourceId);
      return {
        resourceId: assignment.resourceId,
        resourceName: technician?.name || 'Unknown',
        resourceSurname: technician?.surname || '',
        startDate: assignment.start,
        endDate: assignment.end,
        isTeamLeader: assignment.isTeamLeader,
      };
    });

    return {
      teamId: team.id,
      teamName: team.name,
      description: team.description,
      color: team.color,
      members,
    };
  },

  /**
   * Get a single technician by ID
   */
  async getTechnician(id: string): Promise<Resource | undefined> {
    await delay(100);
    return mockTechnicians.find((t) => t.id === id);
  },

  /**
   * Get all assignments
   */
  async getAssignments(): Promise<Assignment[]> {
    await delay(200);
    return [...mockAssignments];
  },

  /**
   * Validate if a team leader assignment is allowed
   */
  async validateTeamLeader(
    teamId: string,
    start: string,
    end: string,
    excludeAssignmentId?: string
  ): Promise<{ valid: boolean; conflictingAssignment?: Assignment; message?: string }> {
    await delay(100);
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const conflict = findConflictingTeamLeader(teamId, startDate, endDate, excludeAssignmentId);
    
    if (conflict) {
      const conflictTech = mockTechnicians.find((t) => t.id === conflict.resourceId);
      return {
        valid: false,
        conflictingAssignment: conflict,
        message: `${conflictTech?.name} ${conflictTech?.surname} is already Team Leader during this period`,
      };
    }
    
    return { valid: true };
  },

  /**
   * Create a new assignment (add technician to team)
   */
  async createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
    await delay(300);
    
    // Validate team leader if setting as leader
    if (input.isTeamLeader) {
      const validation = await this.validateTeamLeader(input.teamId, input.start, input.end);
      if (!validation.valid) {
        throw new Error(validation.message || 'Team leader conflict');
      }
    }
    
    const newAssignment: Assignment = {
      resourceId: input.resourceId,
      teamId: input.teamId,
      start: input.start,
      end: input.end,
      role: input.role,
      isTeamLeader: input.isTeamLeader || false,
      id: `assign-${Date.now()}`,
    };
    mockAssignments.push(newAssignment);
    return newAssignment;
  },

  /**
   * Update an existing assignment (change dates or team)
   */
  async updateAssignment(input: UpdateAssignmentInput): Promise<Assignment> {
    await delay(300);
    
    const index = mockAssignments.findIndex((a) => a.id === input.id);
    if (index === -1) {
      throw new Error('Assignment not found');
    }
    
    const existing = mockAssignments[index];
    const newStart = input.start || existing.start;
    const newEnd = input.end || existing.end;
    const newIsLeader = input.isTeamLeader !== undefined ? input.isTeamLeader : existing.isTeamLeader;
    
    // Validate team leader if setting as leader or changing dates while being leader
    if (newIsLeader) {
      const validation = await this.validateTeamLeader(
        input.teamId || existing.teamId,
        newStart,
        newEnd,
        input.id
      );
      if (!validation.valid) {
        throw new Error(validation.message || 'Team leader conflict');
      }
    }
    
    const updated: Assignment = {
      ...existing,
      ...input,
      isTeamLeader: newIsLeader,
    };
    mockAssignments[index] = updated;
    return updated;
  },

  /**
   * Delete an assignment (remove technician from team)
   */
  async deleteAssignment(id: string): Promise<void> {
    await delay(200);
    mockAssignments = mockAssignments.filter((a) => a.id !== id);
  },

  /**
   * Create a new team
   */
  async createTeam(input: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    await delay(300);
    const newTeam: Team = {
      ...input,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockTeams.push(newTeam);
    return newTeam;
  },

  /**
   * Delete a team and all its assignments
   */
  async deleteTeam(id: string): Promise<void> {
    await delay(200);
    const index = mockTeams.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTeams.splice(index, 1);
      mockAssignments = mockAssignments.filter((a) => a.teamId !== id);
    }
  },

  /**
   * Get all scheduler data in one call
   */
  async getSchedulerData(): Promise<{
    resources: Resource[];
    teams: Team[];
    assignments: Assignment[];
  }> {
    await delay(300);
    return {
      resources: [...mockTechnicians],
      teams: [...mockTeams],
      assignments: [...mockAssignments],
    };
  },

  /**
   * Check for periods without a team leader
   */
  async getTeamLeaderGaps(
    teamId: string,
    viewStart: string,
    viewEnd: string
  ): Promise<{ start: Date; end: Date }[]> {
    await delay(100);
    
    const teamAssignments = mockAssignments
      .filter((a) => a.teamId === teamId && a.isTeamLeader)
      .map((a) => ({ start: new Date(a.start), end: new Date(a.end) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const viewStartDate = new Date(viewStart);
    const viewEndDate = new Date(viewEnd);
    const gaps: { start: Date; end: Date }[] = [];
    
    // If no leaders at all, the entire range is a gap
    if (teamAssignments.length === 0) {
      gaps.push({ start: viewStartDate, end: viewEndDate });
      return gaps;
    }
    
    // Check gap at the beginning
    if (teamAssignments[0].start > viewStartDate) {
      const gapEnd = teamAssignments[0].start < viewEndDate ? teamAssignments[0].start : viewEndDate;
      gaps.push({ start: viewStartDate, end: gapEnd });
    }
    
    // Check gaps between leader assignments
    for (let i = 0; i < teamAssignments.length - 1; i++) {
      const currentEnd = teamAssignments[i].end;
      const nextStart = teamAssignments[i + 1].start;
      
      if (currentEnd < nextStart) {
        const gapStart = currentEnd > viewStartDate ? currentEnd : viewStartDate;
        const gapEnd = nextStart < viewEndDate ? nextStart : viewEndDate;
        if (gapStart < gapEnd) {
          gaps.push({ start: gapStart, end: gapEnd });
        }
      }
    }
    
    // Check gap at the end
    const lastEnd = teamAssignments[teamAssignments.length - 1].end;
    if (lastEnd < viewEndDate) {
      const gapStart = lastEnd > viewStartDate ? lastEnd : viewStartDate;
      gaps.push({ start: gapStart, end: viewEndDate });
    }
    
    return gaps;
  },
};
