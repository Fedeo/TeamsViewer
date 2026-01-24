// Centralized API client layer
// Facade for IFS Cloud REST API
// Supports both mock data (development) and live IFS Cloud API

import type {
  Resource,
  Team,
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  TeamComposition,
} from '@/domain/types';
// Note: IFS Cloud calls are now handled by server-side API routes
// See app/api/technicians/route.ts
// Note: Crews API calls are handled via server-side API routes
// See app/api/crews/route.ts, app/api/crews/[resourceSeq]/members/route.ts, etc.

// ============================================================================
// API MODE CONFIGURATION
// ============================================================================

// Set to true to use IFS Cloud API, false for mock data
const USE_IFS_CLOUD = process.env.NEXT_PUBLIC_USE_IFS_CLOUD === 'true';

// Debug: Log the API mode on module load
console.log(`[API Client] USE_IFS_CLOUD = ${USE_IFS_CLOUD} (env: ${process.env.NEXT_PUBLIC_USE_IFS_CLOUD})`);

// Cache for IFS technicians (to avoid repeated API calls)
let cachedIFSTechnicians: Resource[] | null = null;

// ============================================================================
// MOCK DATA - Will be replaced by IFS Cloud API responses
// ============================================================================

const mockTechnicians: Resource[] = [
  { id: 'tech-001', description: 'James Wilson', ResourceSeq: 1001, role: 'Technician', skills: [] },
  { id: 'tech-002', description: 'Sarah Mitchell', ResourceSeq: 1002, role: 'Technician', skills: [] },
  { id: 'tech-003', description: 'Michael Thompson', ResourceSeq: 1003, role: 'Technician', skills: [] },
  { id: 'tech-004', description: 'Emma Davies', ResourceSeq: 1004, role: 'Technician', skills: [] },
  { id: 'tech-005', description: 'Oliver Brown', ResourceSeq: 1005, role: 'Technician', skills: [] },
  { id: 'tech-006', description: 'Charlotte Taylor', ResourceSeq: 1006, role: 'Technician', skills: [] },
  { id: 'tech-007', description: 'William Anderson', ResourceSeq: 1007, role: 'Technician', skills: [] },
  { id: 'tech-008', description: 'Amelia Roberts', ResourceSeq: 1008, role: 'Technician', skills: [] },
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

// Check if a membership period overlaps with a leader period
function isLeaderForPeriod(
  resourceId: string,
  membershipStart: Date,
  membershipEnd: Date,
  leaders: Array<{ ResourceId: string; ValidFrom: string; ValidTo: string }>
): boolean {
  return leaders.some((leader) => {
    if (leader.ResourceId !== resourceId) return false;
    const leaderStart = new Date(leader.ValidFrom);
    const leaderEnd = new Date(leader.ValidTo);
    return rangesOverlap(membershipStart, membershipEnd, leaderStart, leaderEnd);
  });
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
   * Uses IFS Cloud API when enabled, otherwise mock data
   */
  async getTechnicians(): Promise<Resource[]> {
    console.log('[API Client] getTechnicians called, USE_IFS_CLOUD:', USE_IFS_CLOUD);
    
    if (USE_IFS_CLOUD) {
      try {
        console.log('[API Client] Fetching from /api/technicians...');
        
        // Use cache if available
        if (cachedIFSTechnicians) {
          console.log('[API Client] Returning cached technicians:', cachedIFSTechnicians.length);
          return [...cachedIFSTechnicians];
        }
        
        // Fetch from server-side API route (handles IFS Cloud auth securely)
        const response = await fetch('/api/technicians');
        if (!response.ok) {
          throw new Error(`Failed to fetch technicians: ${response.status}`);
        }
        
        cachedIFSTechnicians = await response.json();
        console.log('[API Client] Fetched technicians:', cachedIFSTechnicians?.length);
        return [...(cachedIFSTechnicians || [])];
      } catch (error) {
        console.error('[API Client] Failed to fetch technicians:', error);
        // Fallback to mock data on error
        return [...mockTechnicians];
      }
    }
    
    // Use mock data
    console.log('[API Client] Using mock data (IFS Cloud disabled)');
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
      // Parse description to get name parts
      const descParts = technician?.description?.split(' ') || ['Unknown'];
      const resourceName = descParts[0] || 'Unknown';
      const resourceSurname = descParts.slice(1).join(' ') || '';
      return {
        resourceId: assignment.resourceId,
        resourceName,
        resourceSurname,
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
        message: `${conflictTech?.description || 'Unknown'} is already Team Leader during this period`,
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
   * Fetch crews, memberships, and leaders from IFS Cloud via server-side API routes
   * and map to domain types
   */
  async getCrewsDataFromIFS(): Promise<{
    teams: Team[];
    assignments: Assignment[];
  }> {
    console.log('[API] Fetching crews data from IFS Cloud via API routes...');
    
    // 1) Get all crews from server-side API route
    const crewsResponse = await fetch('/api/crews');
    if (!crewsResponse.ok) {
      throw new Error(`Failed to fetch crews: ${crewsResponse.status} ${crewsResponse.statusText}`);
    }
    const crews: Array<{ ResourceSeq: number; ResourceId: string; Description: string }> = await crewsResponse.json();
    console.log(`[API] Retrieved ${crews.length} crews from IFS Cloud`);
    
    const teams: Team[] = [];
    const assignments: Assignment[] = [];
    
    // 2) For each crew, fetch memberships and leaders from server-side API routes
    for (const crew of crews) {
      const teamId = `crew-${crew.ResourceSeq}`;
      
      // Map crew to team
      const team: Team = {
        id: teamId,
        name: crew.ResourceId,
        description: crew.Description,
        color: '#3B82F6', // Default color (could be enhanced later)
        createdAt: new Date().toISOString(), // IFS doesn't provide this, use current date
      };
      teams.push(team);
      
      try {
        // Fetch memberships for this crew from server-side API route
        const membershipsUrl = `/api/crews/${crew.ResourceSeq}/members`;
        console.log(`[API] Fetching memberships for crew ${crew.ResourceId} (${crew.ResourceSeq}) from ${membershipsUrl}`);
        const membershipsResponse = await fetch(membershipsUrl);
        
        if (!membershipsResponse.ok) {
          const errorText = await membershipsResponse.text();
          console.error(`[API] Failed to fetch memberships for crew ${crew.ResourceId} (${crew.ResourceSeq}): ${membershipsResponse.status} ${membershipsResponse.statusText}`);
          console.error(`[API] Error response: ${errorText}`);
          // Don't continue - still create the team, just without members
        } else {
          const memberships: Array<{
            ResourceSeq: number;
            ResourceMemberSeq: number;
            ResourceId: string;
            PeriodStart: string;
            PeriodEnd: string;
          }> = await membershipsResponse.json();
          console.log(`[API] Crew ${crew.ResourceId} (${crew.ResourceSeq}): ${memberships.length} memberships found`);
          
          if (memberships.length > 0) {
            console.log(`[API] Sample membership ResourceIds:`, memberships.slice(0, 3).map(m => m.ResourceId));
          }
          
          // Fetch leaders for this crew from server-side API route
          const leadersUrl = `/api/crews/${crew.ResourceSeq}/leaders`;
          console.log(`[API] Fetching leaders for crew ${crew.ResourceId} (${crew.ResourceSeq}) from ${leadersUrl}`);
          const leadersResponse = await fetch(leadersUrl);
          
          let leaders: Array<{
            ResourceSeq: number;
            ResourceCrewLeaderSeq: number;
            ResourceId: string;
            ValidFrom: string;
            ValidTo: string;
          }> = [];
          
          if (!leadersResponse.ok) {
            const errorText = await leadersResponse.text();
            console.warn(`[API] Failed to fetch leaders for crew ${crew.ResourceId} (${crew.ResourceSeq}): ${leadersResponse.status} ${leadersResponse.statusText}`);
            console.warn(`[API] Error response: ${errorText}`);
          } else {
            leaders = await leadersResponse.json();
            console.log(`[API] Crew ${crew.ResourceId} (${crew.ResourceSeq}): ${leaders.length} leaders found`);
          }
          
          // Map memberships to assignments
          for (const membership of memberships) {
            const membershipStart = new Date(membership.PeriodStart);
            const membershipEnd = new Date(membership.PeriodEnd);
            
            // Check if this membership is also a leader
            const isTeamLeader = isLeaderForPeriod(
              membership.ResourceId,
              membershipStart,
              membershipEnd,
              leaders
            );
            
            const assignment: Assignment = {
              id: `assign-${crew.ResourceSeq}-${membership.ResourceMemberSeq}`,
              resourceId: membership.ResourceId, // This should match a Resource.id
              teamId: teamId,
              start: membership.PeriodStart,
              end: membership.PeriodEnd,
              isTeamLeader,
            };
            assignments.push(assignment);
            console.debug(`[API] Created assignment for resource ${membership.ResourceId} in team ${teamId} (${crew.ResourceId})`);
          }
        }
      } catch (error) {
        console.error(`[API] Error fetching data for crew ${crew.ResourceId} (${crew.ResourceSeq}):`, error);
        // Continue with other crews even if one fails, but still create the team
      }
    }
    
    console.log(`[API] Mapped ${teams.length} teams and ${assignments.length} assignments from IFS Cloud`);
    
    // Diagnostic: Log assignments per team
    const assignmentsByTeam = new Map<string, number>();
    const resourceIdsInAssignments = new Set<string>();
    assignments.forEach(a => {
      assignmentsByTeam.set(a.teamId, (assignmentsByTeam.get(a.teamId) || 0) + 1);
      resourceIdsInAssignments.add(a.resourceId);
    });
    console.log('[API] Assignments per team:', Array.from(assignmentsByTeam.entries()).map(([teamId, count]) => {
      const team = teams.find(t => t.id === teamId);
      return `${team?.name || teamId}: ${count}`;
    }).join(', '));
    console.log(`[API] Unique resourceIds in assignments: ${resourceIdsInAssignments.size}`, Array.from(resourceIdsInAssignments).slice(0, 10));
    
    return { teams, assignments };
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
    
    // Use real API for technicians when IFS Cloud is enabled
    console.log('[API] getSchedulerData called, fetching technicians...');
    const resources = await this.getTechnicians();
    console.log('[API] getSchedulerData got', resources.length, 'technicians');
    
    // Use IFS Cloud APIs for crews when enabled
    if (USE_IFS_CLOUD) {
      try {
        const { teams, assignments } = await this.getCrewsDataFromIFS();
        return {
          resources,
          teams,
          assignments,
        };
      } catch (error) {
        console.error('[API] Error fetching crews data from IFS Cloud, falling back to mock data:', error);
        // Fall back to mock data if IFS Cloud fails
        return {
          resources,
          teams: [...mockTeams],
          assignments: [...mockAssignments],
        };
      }
    }
    
    // Use mock data when IFS Cloud is disabled
    return {
      resources,
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
