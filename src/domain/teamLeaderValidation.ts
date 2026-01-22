import type { Assignment, TimeRange } from './types';

export interface LeaderGap {
  start: Date;
  end: Date;
}

/**
 * Find periods within the view range where a team has no team leader assigned
 */
export function findTeamLeaderGaps(
  teamId: string,
  assignments: Assignment[],
  viewRange: TimeRange
): LeaderGap[] {
  // Get all team leader assignments for this team, sorted by start date
  const leaderAssignments = assignments
    .filter((a) => a.teamId === teamId && a.isTeamLeader)
    .map((a) => ({ start: new Date(a.start), end: new Date(a.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: LeaderGap[] = [];
  const viewStart = viewRange.start;
  const viewEnd = viewRange.end;

  // Check if there are any team members at all in this period
  const anyTeamMembers = assignments.some((a) => {
    if (a.teamId !== teamId) return false;
    const aStart = new Date(a.start);
    const aEnd = new Date(a.end);
    return aStart < viewEnd && aEnd > viewStart;
  });

  // If no team members, no need to warn about missing leader
  if (!anyTeamMembers) {
    return [];
  }

  // If no leaders at all, the entire range is a gap
  if (leaderAssignments.length === 0) {
    // Find the actual coverage period of team members
    const memberAssignments = assignments
      .filter((a) => a.teamId === teamId)
      .map((a) => ({ start: new Date(a.start), end: new Date(a.end) }));
    
    if (memberAssignments.length > 0) {
      const earliestStart = memberAssignments.reduce(
        (min, a) => (a.start < min ? a.start : min),
        memberAssignments[0].start
      );
      const latestEnd = memberAssignments.reduce(
        (max, a) => (a.end > max ? a.end : max),
        memberAssignments[0].end
      );
      
      const gapStart = earliestStart > viewStart ? earliestStart : viewStart;
      const gapEnd = latestEnd < viewEnd ? latestEnd : viewEnd;
      
      if (gapStart < gapEnd) {
        gaps.push({ start: gapStart, end: gapEnd });
      }
    }
    return gaps;
  }

  // Merge overlapping leader periods
  const mergedLeaderPeriods: { start: Date; end: Date }[] = [];
  for (const period of leaderAssignments) {
    if (mergedLeaderPeriods.length === 0) {
      mergedLeaderPeriods.push({ ...period });
    } else {
      const last = mergedLeaderPeriods[mergedLeaderPeriods.length - 1];
      if (period.start <= last.end) {
        // Overlapping or adjacent, extend the last period
        last.end = period.end > last.end ? period.end : last.end;
      } else {
        mergedLeaderPeriods.push({ ...period });
      }
    }
  }

  // Find gaps where team members exist but no leader
  const memberAssignments = assignments
    .filter((a) => a.teamId === teamId)
    .map((a) => ({ start: new Date(a.start), end: new Date(a.end) }));

  // Get the overall team coverage period (when any member is assigned)
  const teamCoverageStart = memberAssignments.reduce(
    (min, a) => (a.start < min ? a.start : min),
    memberAssignments[0].start
  );
  const teamCoverageEnd = memberAssignments.reduce(
    (max, a) => (a.end > max ? a.end : max),
    memberAssignments[0].end
  );

  // Only look at the intersection with view range
  const checkStart = teamCoverageStart > viewStart ? teamCoverageStart : viewStart;
  const checkEnd = teamCoverageEnd < viewEnd ? teamCoverageEnd : viewEnd;

  if (checkStart >= checkEnd) {
    return [];
  }

  // Check gap at the beginning
  if (mergedLeaderPeriods[0].start > checkStart) {
    const gapEnd = mergedLeaderPeriods[0].start < checkEnd ? mergedLeaderPeriods[0].start : checkEnd;
    if (checkStart < gapEnd) {
      gaps.push({ start: checkStart, end: gapEnd });
    }
  }

  // Check gaps between leader periods
  for (let i = 0; i < mergedLeaderPeriods.length - 1; i++) {
    const currentEnd = mergedLeaderPeriods[i].end;
    const nextStart = mergedLeaderPeriods[i + 1].start;

    if (currentEnd < nextStart) {
      const gapStart = currentEnd > checkStart ? currentEnd : checkStart;
      const gapEnd = nextStart < checkEnd ? nextStart : checkEnd;
      if (gapStart < gapEnd) {
        gaps.push({ start: gapStart, end: gapEnd });
      }
    }
  }

  // Check gap at the end
  const lastEnd = mergedLeaderPeriods[mergedLeaderPeriods.length - 1].end;
  if (lastEnd < checkEnd) {
    const gapStart = lastEnd > checkStart ? lastEnd : checkStart;
    if (gapStart < checkEnd) {
      gaps.push({ start: gapStart, end: checkEnd });
    }
  }

  return gaps;
}

/**
 * Format a gap period for display
 */
export function formatGapPeriod(gap: LeaderGap): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = gap.start.toLocaleDateString('en-US', options);
  const endStr = gap.end.toLocaleDateString('en-US', options);
  return `${startStr} — ${endStr}`;
}
