# Change Tracking System Documentation

## Overview

The TeamsViewer application implements a **Hybrid Change Tracking System** (Approach 3) to track all modifications made to teams and assignments. This system enables efficient synchronization with IFS Cloud by identifying exactly what has been created, updated, or deleted since the last sync.

## Architecture

### Core Components

The change tracking system consists of:

1. **Original State Storage** - Snapshot of data when loaded from IFS Cloud
2. **Change Tracking Sets** - Efficient ID-based tracking of modifications
3. **Change Summary API** - Functions to query and manage tracked changes

### Data Structures

```typescript
// Original state from IFS Cloud (snapshot when initialized)
let originalTeams: Team[] = [];
let originalAssignments: Assignment[] = [];

// Change tracking - IDs of entities that have been modified
let changedAssignments = new Set<string>();      // Created or updated assignments
let changedTeams = new Set<string>();            // Created or updated teams
let deletedAssignments = new Set<string>();      // Deleted assignments
let deletedTeams = new Set<string>();            // Deleted teams
```

## How It Works

### 1. Initialization

When data is loaded from IFS Cloud (or mock data), the system:

- Stores a snapshot in `originalTeams` and `originalAssignments`
- Clears all change tracking sets
- Initializes working state variables

```typescript
// On first load from IFS Cloud:
originalTeams = [...teams];           // Snapshot
originalAssignments = [...assignments]; // Snapshot
workingTeams = [...teams];            // Working copy
workingAssignments = [...assignments]; // Working copy
```

### 2. Change Tracking During Mutations

#### Creating an Assignment
- New assignment is added to `workingAssignments`
- Assignment ID is added to `changedAssignments` (marks as new)

#### Updating an Assignment
- Assignment is updated in `workingAssignments`
- Assignment ID is added to `changedAssignments` (marks as modified)
- If assignment was previously deleted, it's removed from `deletedAssignments`

#### Deleting an Assignment
- Assignment is removed from `workingAssignments`
- If assignment existed in `originalAssignments`:
  - ID is added to `deletedAssignments` (marks for deletion in IFS Cloud)
- ID is removed from `changedAssignments` (no longer tracked as changed)

#### Creating a Team
- New team is added to `workingTeams`
- Team ID is added to `changedTeams` (marks as new)

#### Deleting a Team
- Team is removed from `workingTeams`
- All assignments for that team are handled:
  - If assignment existed in original state, added to `deletedAssignments`
  - Removed from `changedAssignments`
- If team existed in `originalTeams`:
  - Team ID is added to `deletedTeams`
- Team ID is removed from `changedTeams`

### 3. Change Detection Logic

The system distinguishes between:

- **Created**: Entity exists in working state but NOT in original state
- **Updated**: Entity exists in BOTH working and original state, but is tracked in change sets
- **Deleted**: Entity exists in original state but NOT in working state (or tracked in deleted sets)

## API Functions

### `hasUnsavedChanges(): boolean`

Checks if there are any unsaved changes.

```typescript
const hasChanges = api.hasUnsavedChanges();
// Returns true if any of the change tracking sets have entries
```

**Returns:**
- `true` if there are any tracked changes
- `false` if no changes exist

### `getChangeSummary(): ChangeSummary`

Returns a detailed breakdown of all changes.

```typescript
const changes = api.getChangeSummary();
```

**Returns:**
```typescript
{
  createdAssignments: Assignment[];    // New assignments to create in IFS Cloud
  updatedAssignments: Assignment[];      // Existing assignments to update
  deletedAssignments: Assignment[];      // Assignments to delete
  createdTeams: Team[];                 // New teams to create
  updatedTeams: Team[];                  // Existing teams to update
  deletedTeams: Team[];                 // Teams to delete
}
```

**Example Usage:**
```typescript
const changes = api.getChangeSummary();

console.log(`Will create ${changes.createdAssignments.length} assignments`);
console.log(`Will update ${changes.updatedAssignments.length} assignments`);
console.log(`Will delete ${changes.deletedAssignments.length} assignments`);
```

### `clearChangeTracking(): void`

Clears all change tracking. Should be called after successful sync to IFS Cloud.

```typescript
// After successful sync:
api.clearChangeTracking();
```

**What it does:**
- Updates `originalTeams` and `originalAssignments` to current working state (new baseline)
- Clears all change tracking sets
- Resets the system for the next change cycle

### `resetWorkingState(): void`

Resets working state and clears change tracking. Used when refreshing data from IFS Cloud.

```typescript
api.resetWorkingState();
// Next call to getSchedulerData() will re-initialize from IFS Cloud
```

## Usage for IFS Cloud Sync

### Step 1: Check for Changes

```typescript
if (api.hasUnsavedChanges()) {
  // Proceed with sync
}
```

### Step 2: Get Change Summary

```typescript
const changes = api.getChangeSummary();
```

### Step 3: Sync to IFS Cloud

```typescript
// Create new assignments
for (const assignment of changes.createdAssignments) {
  await createAssignmentInIFS(assignment);
}

// Update existing assignments
for (const assignment of changes.updatedAssignments) {
  await updateAssignmentInIFS(assignment);
}

// Delete assignments
for (const assignment of changes.deletedAssignments) {
  await deleteAssignmentInIFS(assignment.id);
}

// Similar for teams...
```

### Step 4: Clear Change Tracking

```typescript
// After successful sync:
api.clearChangeTracking();
```

## Integration with UI

### TopMenu Component

The "Push to IFS Cloud" button uses change tracking:

```typescript
// Check for changes periodically
useEffect(() => {
  const checkChanges = async () => {
    const { api } = await import('@/lib/api/client');
    setHasUnsavedChanges(api.hasUnsavedChanges());
  };
  const interval = setInterval(checkChanges, 500);
  return () => clearInterval(interval);
}, []);
```

### Button State

The button is enabled when:
- `hasUnsavedChanges === true` (from change tracking)
- `!isSyncing`
- `!hasValidationWarnings`

## Benefits

1. **Efficient**: Only tracks IDs, not full objects
2. **Accurate**: Distinguishes between create, update, and delete
3. **Flexible**: Can get full change summary when needed
4. **Scalable**: Works well with large datasets
5. **Automatic**: Tracks changes as they happen, no manual intervention needed

## Implementation Details

### File Location

- **Implementation**: `src/lib/api/client.ts`
- **UI Integration**: `src/components/TopMenu.tsx`

### Key Variables

All change tracking variables are module-level in `client.ts`:
- `originalTeams`, `originalAssignments` - Original state snapshots
- `changedAssignments`, `changedTeams` - Sets of modified entity IDs
- `deletedAssignments`, `deletedTeams` - Sets of deleted entity IDs

### Mutation Tracking

All mutation functions automatically update change tracking:
- `createAssignment()`
- `updateAssignment()`
- `deleteAssignment()`
- `createTeam()`
- `deleteTeam()`

## Future Enhancements

Potential improvements:

1. **Change History**: Store full change history with timestamps
2. **Undo/Redo**: Implement undo/redo functionality using change tracking
3. **Conflict Resolution**: Track conflicts when multiple users edit simultaneously
4. **Batch Operations**: Optimize sync by batching similar operations
5. **Change Preview**: Show user what will be synced before pushing

## Notes

- Change tracking is automatically cleared when refreshing data from IFS Cloud
- The system distinguishes between local-only entities (created in app) and IFS entities (loaded from API)
- Deleted entities that were never in IFS Cloud are not tracked (they never existed in original state)
