'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, eachDayOfInterval, isWeekend, isToday, differenceInDays, startOfDay, addDays } from 'date-fns';
import type { Team, Assignment, Resource, TimeRange } from '@/domain/types';
import { findTeamLeaderGaps, formatGapPeriod } from '@/domain/teamLeaderValidation';
import { useUIStore } from '@/lib/store/ui-store';
import styles from './SchedulerBoard.module.css';

interface SchedulerBoardProps {
  teams: Team[];
  assignments: Assignment[];
  resources: Resource[];
  viewRange: TimeRange;
  dayWidth: number;
  onAssignmentDoubleClick?: (assignment: Assignment) => void;
  onAssignmentResize?: (id: string, newStart: string, newEnd: string) => void;
  onAssignmentDelete?: (assignmentId: string) => void;
  autoExpandTeamId?: string | null;
}

// Context menu state
interface ContextMenu {
  x: number;
  y: number;
  assignmentId: string;
}

export function SchedulerBoard({
  teams,
  assignments,
  resources,
  viewRange,
  dayWidth,
  onAssignmentDoubleClick,
  onAssignmentResize,
  onAssignmentDelete,
  autoExpandTeamId,
}: SchedulerBoardProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // Auto-expand team when autoExpandTeamId changes
  const prevAutoExpandRef = useRef<string | null>(null);
  useEffect(() => {
    if (autoExpandTeamId && autoExpandTeamId !== prevAutoExpandRef.current) {
      prevAutoExpandRef.current = autoExpandTeamId;
      setExpandedTeams((prev) => {
        const next = new Set(prev);
        next.add(autoExpandTeamId);
        return next;
      });
    }
  }, [autoExpandTeamId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, assignmentId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, assignmentId });
  }, []);

  const handleDeleteFromContext = useCallback(() => {
    if (contextMenu && onAssignmentDelete) {
      onAssignmentDelete(contextMenu.assignmentId);
    }
    setContextMenu(null);
  }, [contextMenu, onAssignmentDelete]);

  // Check for team leader gaps across all teams
  // Memoize based on stringified keys to prevent unnecessary recalculations
  const teamIds = teams.map(t => t.id).join(',');
  const assignmentKeys = assignments.map(a => `${a.id}:${a.start}:${a.end}:${a.isTeamLeader}`).join(',');
  const viewRangeKey = `${viewRange.start.getTime()}-${viewRange.end.getTime()}`;

  const hasAnyWarnings = useMemo(() => {
    if (teams.length === 0) return false;
    for (const team of teams) {
      const gaps = findTeamLeaderGaps(team.id, assignments, viewRange);
      if (gaps.length > 0) {
        return true;
      }
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamIds, assignmentKeys, viewRangeKey]);

  // Update store when warning state changes
  const prevWarningsRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevWarningsRef.current !== hasAnyWarnings) {
      prevWarningsRef.current = hasAnyWarnings;
      useUIStore.getState().setValidationWarnings(hasAnyWarnings);
    }
  }, [hasAnyWarnings]);

  const days = useMemo(
    () => eachDayOfInterval({ start: viewRange.start, end: viewRange.end }),
    [viewRange]
  );

  const totalDays = days.length;

  const getResourceById = useCallback(
    (id: string) => resources.find((r) => r.id === id),
    [resources]
  );

  const assignmentsByTeam = useMemo(() => {
    const map = new Map<string, (Assignment & { resource: Resource | undefined })[]>();
    teams.forEach((team) => {
      const teamAssignments = assignments
        .filter((a) => a.teamId === team.id)
        .map((a) => {
          const resource = getResourceById(a.resourceId);
          if (!resource) {
            console.warn(`[SchedulerBoard] Assignment ${a.id} has resourceId "${a.resourceId}" but no matching resource found in resources list`);
            console.warn(`[SchedulerBoard] Available resource IDs:`, resources.map(r => r.id).slice(0, 10));
          }
          return {
            ...a,
            resource,
          };
        });
      map.set(team.id, teamAssignments);
      
      // Diagnostic logging for specific team
      if (team.name === 'CR2501-02' || team.id.includes('CR2501-02')) {
        console.log(`[SchedulerBoard] Team ${team.name} (${team.id}):`, {
          totalAssignments: teamAssignments.length,
          assignmentsWithResources: teamAssignments.filter(a => a.resource).length,
          assignmentsWithoutResources: teamAssignments.filter(a => !a.resource).length,
          resourceIds: teamAssignments.map(a => a.resourceId),
        });
      }
    });
    return map;
  }, [teams, assignments, getResourceById, resources]);

  const toggleTeamExpanded = useCallback((teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }, []);

  return (
    <div className={styles.board}>
      {/* Timeline header */}
      <div className={styles.timeline} style={{ width: totalDays * dayWidth }}>
        <div className={styles.timelineHeader}>
          <div className={styles.teamLabelSpacer} />
          <div className={styles.daysHeader}>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`${styles.dayHeader} ${isWeekend(day) ? styles.weekend : ''} ${isToday(day) ? styles.today : ''}`}
                style={{ width: dayWidth }}
              >
                <span className={styles.dayName}>{format(day, 'EEE')}</span>
                <span className={styles.dayNumber}>{format(day, 'd')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teams rows */}
        <div className={styles.teamsContainer}>
          {teams.map((team) => (
            <TeamSection
              key={team.id}
              team={team}
              assignments={assignmentsByTeam.get(team.id) || []}
              allAssignments={assignments}
              days={days}
              dayWidth={dayWidth}
              viewRange={viewRange}
              onAssignmentDoubleClick={onAssignmentDoubleClick}
              onAssignmentResize={onAssignmentResize}
              onAssignmentDelete={onAssignmentDelete}
              onContextMenu={handleContextMenu}
              isExpanded={expandedTeams.has(team.id)}
              onToggleExpand={() => toggleTeamExpanded(team.id)}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.contextMenuItem} onClick={handleDeleteFromContext}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            Delete Assignment
          </button>
        </div>
      )}
    </div>
  );
}

interface TeamSectionProps {
  team: Team;
  assignments: (Assignment & { resource: Resource | undefined })[];
  allAssignments: Assignment[];
  days: Date[];
  dayWidth: number;
  viewRange: TimeRange;
  onAssignmentDoubleClick?: (assignment: Assignment) => void;
  onAssignmentResize?: (id: string, newStart: string, newEnd: string) => void;
  onAssignmentDelete?: (assignmentId: string) => void;
  onContextMenu?: (e: React.MouseEvent, assignmentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function TeamSection({
  team,
  assignments,
  allAssignments,
  days,
  dayWidth,
  viewRange,
  onAssignmentDoubleClick,
  onAssignmentResize,
  onAssignmentDelete,
  onContextMenu,
  isExpanded,
  onToggleExpand,
}: TeamSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `team-${team.id}`,
    data: {
      type: 'team',
      team,
    },
  });

  const totalWidth = days.length * dayWidth;

  // Filter assignments that overlap with the current view range
  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const assignmentStart = new Date(assignment.start);
      const assignmentEnd = new Date(assignment.end);
      // Check if assignment overlaps with view range
      return assignmentStart < viewRange.end && assignmentEnd > viewRange.start;
    });
  }, [assignments, viewRange]);

  // Count unique members (not assignments)
  const uniqueMemberCount = useMemo(() => {
    const uniqueResourceIds = new Set(visibleAssignments.map((a) => a.resourceId));
    return uniqueResourceIds.size;
  }, [visibleAssignments]);

  // Check for team leader gaps
  const leaderGaps = useMemo(() => {
    return findTeamLeaderGaps(team.id, allAssignments, viewRange);
  }, [team.id, allAssignments, viewRange]);

  const hasLeaderWarning = leaderGaps.length > 0;

  return (
    <div className={`${styles.teamSection} ${hasLeaderWarning ? styles.hasWarning : ''}`}>
      {/* Team Header Row */}
      <div className={styles.teamRow}>
        {/* Team label */}
        <div className={styles.teamLabel}>
          <button
            className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse team' : 'Expand team'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <div className={styles.teamColor} style={{ background: team.color }} />
          <div className={styles.teamInfo}>
            <div className={styles.teamNameRow}>
              <span className={styles.teamName}>{team.name}</span>
              {hasLeaderWarning && (
                <span className={styles.warningBadge} title="No Team Leader assigned for some periods">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </span>
              )}
            </div>
            <span className={styles.memberCount}>{uniqueMemberCount} member{uniqueMemberCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Drop zone for the team */}
        <div
          ref={setNodeRef}
          className={`${styles.teamTimeline} ${isOver ? styles.dropTarget : ''}`}
          style={{ width: totalWidth }}
        >
          {/* Grid lines */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`${styles.dayCell} ${isWeekend(day) ? styles.weekend : ''} ${isToday(day) ? styles.today : ''}`}
              style={{ width: dayWidth }}
            />
          ))}
        </div>
      </div>

      {/* Team Leader Warning Banner */}
      {hasLeaderWarning && (
        <div className={styles.leaderWarning}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div className={styles.warningContent}>
            <strong>No Team Leader assigned</strong>
            <span>
              {leaderGaps.length === 1 
                ? `Period: ${formatGapPeriod(leaderGaps[0])}`
                : `${leaderGaps.length} periods without leader: ${leaderGaps.map(formatGapPeriod).join(', ')}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Expanded Member Rows - grouped by resource */}
      {isExpanded && visibleAssignments.length > 0 && (
        <div className={styles.membersContainer}>
          {(() => {
            // Group assignments by resourceId
            const groupedByResource = new Map<string, (Assignment & { resource: Resource | undefined })[]>();
            visibleAssignments.forEach((assignment) => {
              const resourceId = assignment.resourceId;
              if (!groupedByResource.has(resourceId)) {
                groupedByResource.set(resourceId, []);
              }
              groupedByResource.get(resourceId)!.push(assignment);
            });

            return Array.from(groupedByResource.entries()).map(([resourceId, resourceAssignments]) => (
              <MemberRow
                key={resourceId}
                assignments={resourceAssignments}
                team={team}
                days={days}
                dayWidth={dayWidth}
                viewRange={viewRange}
                onAssignmentDoubleClick={onAssignmentDoubleClick}
                onAssignmentResize={onAssignmentResize}
                onAssignmentDelete={onAssignmentDelete}
                onContextMenu={onContextMenu}
              />
            ));
          })()}
        </div>
      )}

      {/* Empty state when expanded but no members in view */}
      {isExpanded && visibleAssignments.length === 0 && (
        <div className={styles.emptyMembers}>
          <span>No members assigned. Drag a technician here to add them.</span>
        </div>
      )}
    </div>
  );
}

interface MemberRowProps {
  assignments: (Assignment & { resource: Resource | undefined })[];
  team: Team;
  days: Date[];
  dayWidth: number;
  viewRange: TimeRange;
  onAssignmentDoubleClick?: (assignment: Assignment) => void;
  onAssignmentResize?: (id: string, newStart: string, newEnd: string) => void;
  onAssignmentDelete?: (assignmentId: string) => void;
  onContextMenu?: (e: React.MouseEvent, assignmentId: string) => void;
}

function MemberRow({
  assignments,
  team,
  days,
  dayWidth,
  viewRange,
  onAssignmentDoubleClick,
  onAssignmentResize,
  onAssignmentDelete,
  onContextMenu,
}: MemberRowProps) {
  const totalWidth = days.length * dayWidth;
  const resource = assignments[0]?.resource;

  const initials = resource
    ? (() => {
      const words = resource.description.split(' ');
      return words.length >= 2 
        ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
        : resource.description.substring(0, 2).toUpperCase();
    })()
    : '??';

  // Sort assignments by start date for display
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Format date ranges for display
  const dateRangesText = sortedAssignments.length === 1
    ? `${format(new Date(sortedAssignments[0].start), 'MMM d')} — ${format(new Date(sortedAssignments[0].end), 'MMM d')}`
    : `${sortedAssignments.length} periods`;

  return (
    <div className={styles.memberRow}>
      {/* Member label */}
      <div className={styles.memberLabel}>
        <div className={styles.memberAvatar} style={{ background: `${team.color}30`, color: team.color }}>
          {initials}
        </div>
        <div className={styles.memberInfo}>
          <span className={styles.memberName}>
            {resource ? resource.description : 'Unknown'}
          </span>
          <span className={styles.memberDates}>
            {dateRangesText}
          </span>
        </div>
      </div>

      {/* Member timeline */}
      <div className={styles.memberTimeline} style={{ width: totalWidth }}>
        {/* Grid lines */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`${styles.dayCell} ${styles.memberCell} ${isWeekend(day) ? styles.weekend : ''} ${isToday(day) ? styles.today : ''}`}
            style={{ width: dayWidth }}
          />
        ))}

        {/* Assignment bars - one for each period */}
        {sortedAssignments.map((assignment) => (
          <ResizableAssignmentBar
            key={assignment.id}
            assignment={assignment}
            teamColor={team.color}
            viewRange={viewRange}
            dayWidth={dayWidth}
            onDoubleClick={() => onAssignmentDoubleClick?.(assignment)}
            onResize={onAssignmentResize}
            onDelete={() => onAssignmentDelete?.(assignment.id)}
            onContextMenu={(e) => onContextMenu?.(e, assignment.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ResizableAssignmentBarProps {
  assignment: Assignment & { resource: Resource | undefined };
  teamColor: string;
  viewRange: TimeRange;
  dayWidth: number;
  onDoubleClick?: () => void;
  onResize?: (id: string, newStart: string, newEnd: string) => void;
  onDelete?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

function ResizableAssignmentBar({
  assignment,
  teamColor,
  viewRange,
  dayWidth,
  onDoubleClick,
  onResize,
  onDelete,
  onContextMenu,
}: ResizableAssignmentBarProps) {
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeOffset, setResizeOffset] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const originalStartRef = useRef(assignment.start);
  const originalEndRef = useRef(assignment.end);

  const startDate = new Date(assignment.start);
  const endDate = new Date(assignment.end);
  
  // Calculate position and width
  const viewStart = startOfDay(viewRange.start);
  const offsetDays = differenceInDays(startOfDay(startDate), viewStart);
  const durationDays = differenceInDays(endDate, startDate);
  
  // Clamp to visible range
  const visibleStartDays = Math.max(0, offsetDays);
  const visibleEndDays = Math.min(
    differenceInDays(viewRange.end, viewStart),
    offsetDays + durationDays
  );
  const visibleWidthDays = Math.max(0, visibleEndDays - visibleStartDays);

  if (visibleWidthDays <= 0) return null;

  // Apply resize offset during drag
  let adjustedLeft = visibleStartDays * dayWidth;
  let adjustedWidth = visibleWidthDays * dayWidth - 4;

  if (isResizing === 'left') {
    adjustedLeft += resizeOffset;
    adjustedWidth -= resizeOffset;
  } else if (isResizing === 'right') {
    adjustedWidth += resizeOffset;
  }

  // Ensure minimum width
  adjustedWidth = Math.max(adjustedWidth, dayWidth);

  const handleMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(side);
    startXRef.current = e.clientX;
    originalStartRef.current = assignment.start;
    originalEndRef.current = assignment.end;
    setResizeOffset(0);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      setResizeOffset(deltaX);
    };

    const handleMouseUp = () => {
      if (isResizing && onResize) {
        // Calculate the number of days changed
        const daysDelta = Math.round(resizeOffset / dayWidth);
        
        if (daysDelta !== 0) {
          const originalStart = new Date(originalStartRef.current);
          const originalEnd = new Date(originalEndRef.current);
          
          let newStart = originalStart;
          let newEnd = originalEnd;

          if (isResizing === 'left') {
            newStart = addDays(originalStart, daysDelta);
            // Ensure start doesn't go past end - 1 day
            if (newStart >= newEnd) {
              newStart = addDays(newEnd, -1);
            }
          } else {
            newEnd = addDays(originalEnd, daysDelta);
            // Ensure end doesn't go before start + 1 day
            if (newEnd <= newStart) {
              newEnd = addDays(newStart, 1);
            }
          }

          onResize(assignment.id, newStart.toISOString(), newEnd.toISOString());
        }
      }
      
      setIsResizing(null);
      setResizeOffset(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeOffset, dayWidth, assignment.id, onResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isResizing) return;
    if (e.key === 'Enter') {
      onDoubleClick?.();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete?.();
    }
  };

  return (
    <div
      ref={barRef}
      className={`${styles.assignmentBar} ${isResizing ? styles.resizing : ''} ${assignment.isTeamLeader ? styles.teamLeaderBar : ''}`}
      style={{
        left: adjustedLeft,
        width: adjustedWidth,
        background: assignment.isTeamLeader ? `${teamColor}40` : `${teamColor}25`,
        borderColor: teamColor,
      }}
      onDoubleClick={isResizing ? undefined : onDoubleClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Team Leader Icon */}
      {assignment.isTeamLeader && (
        <div className={styles.teamLeaderIcon} style={{ color: teamColor }}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            {/* Person with crown - Team Leader */}
            <circle cx="12" cy="7" r="4" />
            <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
            <path d="M12 1l1.5 2.5L16 4l-1.5 1L16 6H8l1.5-1L8 4l2.5-.5L12 1z" />
          </svg>
        </div>
      )}
      
      {/* Resize handles */}
      <div
        className={styles.resizeHandleLeft}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      />
      <div
        className={styles.resizeHandleRight}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      />
    </div>
  );
}
