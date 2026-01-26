# TeamsViewer - Functional and Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Functional Requirements](#functional-requirements)
3. [Technical Architecture](#technical-architecture)
4. [Data Models](#data-models)
5. [API Integration](#api-integration)
6. [User Interface](#user-interface)
7. [State Management](#state-management)
8. [Change Tracking System](#change-tracking-system)
9. [Validation Rules](#validation-rules)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Purpose

TeamsViewer is a Gantt-style team and resource scheduling application designed to manage crew assignments for IFS Cloud. It provides an intuitive interface for assigning technicians to teams over specific time periods, with real-time validation and synchronization capabilities.

### Key Objectives

- Visual scheduling of resources to teams using a Gantt chart interface
- Real-time validation of team leader assignments and cross-team conflicts
- Integration with IFS Cloud REST API for data retrieval and synchronization
- Efficient change tracking for incremental sync operations
- Responsive, user-friendly interface with drag-and-drop functionality

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: 
  - TanStack Query (React Query) for server state
  - Zustand for UI state
- **Drag & Drop**: `@dnd-kit/core`
- **Date Handling**: `date-fns`
- **Styling**: CSS Modules
- **Testing**: Jest, `ts-jest`
- **API**: IFS Cloud REST API (OData v4)

---

## Functional Requirements

### Core Features

#### 1. Resource Management
- **FR-1.1**: Display list of available technicians/resources in a left panel
- **FR-1.2**: Filter resources by name using search functionality
- **FR-1.3**: Resources are retrieved from IFS Cloud API or mock data
- **FR-1.4**: Each resource displays: ID, description (full name), ResourceSeq, role, skills

#### 2. Team Management
- **FR-2.1**: Display all teams in the main Gantt view
- **FR-2.2**: Teams can be expanded/collapsed to show/hide members
- **FR-2.3**: Create new teams via Floating Action Button (FAB)
- **FR-2.4**: Each team has: ID, name, description, color, creation date
- **FR-2.5**: Teams are retrieved from IFS Cloud Crews API

#### 3. Assignment Management
- **FR-3.1**: Assign resources to teams via drag-and-drop
- **FR-3.2**: Set assignment period (start date, end date) via dialog
- **FR-3.3**: Mark assignments as "Team Leader"
- **FR-3.4**: Resize assignment periods by dragging bar edges
- **FR-3.5**: Edit assignments by double-clicking on Gantt bars
- **FR-3.6**: Delete assignments via Delete key or right-click context menu
- **FR-3.7**: Support multiple independent assignment periods for same resource in same team
- **FR-3.8**: Display multiple assignment bars for same resource in single row

#### 4. Team Leader Management
- **FR-4.1**: Each team must have exactly one Team Leader per time period
- **FR-4.2**: Prevent assigning multiple Team Leaders for overlapping periods
- **FR-4.3**: Display warning when no Team Leader is assigned for a period
- **FR-4.4**: Visual indicator (person with crown icon) on Gantt bars for Team Leaders
- **FR-4.5**: Team Leader status is determined by matching Crew Leaders API data

#### 5. Validation and Constraints
- **FR-5.1**: Prevent resource from being assigned to multiple teams in overlapping periods (hard error)
- **FR-5.2**: Validate Team Leader uniqueness per team per period
- **FR-5.3**: Display validation warnings for periods without Team Leader
- **FR-5.4**: Disable "Push to IFS Cloud" button when validation warnings exist
- **FR-5.5**: Validate date ranges (start < end)

#### 6. Gantt Chart Features
- **FR-6.1**: Display timeline with date headers
- **FR-6.2**: Navigate weeks forward/backward
- **FR-6.3**: Zoom in/out functionality (6 zoom levels: 24px to 96px per day)
- **FR-6.4**: Reset zoom to default (48px)
- **FR-6.5**: Highlight weekends and today
- **FR-6.6**: Auto-expand team when new technician is added

#### 7. Data Synchronization
- **FR-7.1**: Track all changes (create, update, delete) for teams and assignments
- **FR-7.2**: "Push to IFS Cloud" button enabled only when changes exist
- **FR-7.3**: Button disabled when validation warnings exist
- **FR-7.4**: Refresh button to reload data from IFS Cloud
- **FR-7.5**: Change tracking persists until successful sync

#### 8. IFS Cloud Integration
- **FR-8.1**: Authenticate with IFS Cloud using OAuth2 password grant
- **FR-8.2**: Fetch technicians from IFS Cloud API
- **FR-8.3**: Fetch crews (teams) from IFS Cloud API
- **FR-8.4**: Fetch crew memberships for each team
- **FR-8.5**: Fetch crew leaders for each team
- **FR-8.6**: Map IFS Cloud data to application domain models
- **FR-8.7**: Support toggle between IFS Cloud API and mock data

---

## Technical Architecture

### Application Structure

```
TeamsViewer/
├── app/                          # Next.js App Router
│   ├── api/                      # Server-side API routes
│   │   ├── technicians/          # Technician API endpoints
│   │   └── crews/                # Crew/Team API endpoints
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── src/
│   ├── components/               # Shared UI components
│   │   └── TopMenu.tsx          # Top navigation menu
│   ├── domain/                   # Domain logic and types
│   │   ├── types.ts              # Core entity types
│   │   ├── validation.ts         # Validation schemas
│   │   ├── overlap.ts            # Overlap detection logic
│   │   └── teamLeaderValidation.ts # Team leader validation
│   ├── features/
│   │   └── scheduler/            # Scheduler feature module
│   │       ├── components/       # Feature-specific components
│   │       │   ├── ResourcePanel.tsx
│   │       │   ├── SchedulerBoard.tsx
│   │       │   ├── AssignmentDialog.tsx
│   │       │   └── NewTeamFab.tsx
│   │       └── Scheduler.tsx     # Main scheduler component
│   └── lib/
│       ├── api/                  # API client layer
│       │   ├── client.ts         # Main API facade
│       │   ├── ifs-auth.ts       # IFS Cloud authentication
│       │   ├── ifs-config.ts     # IFS Cloud configuration
│       │   ├── ifs-technicians.ts # Technician API
│       │   ├── ifs-crews.ts      # Crew/Team API
│       │   └── __tests__/        # API unit tests
│       ├── query/                # TanStack Query setup
│       │   ├── provider.tsx      # Query client provider
│       │   ├── keys.ts           # Query key constants
│       │   └── hooks.ts          # Custom query hooks
│       └── store/                # Zustand stores
│           └── ui-store.ts       # UI state management
├── docs/                         # Documentation
│   ├── CHANGE_TRACKING.md       # Change tracking system docs
│   └── PROJECT_DOCUMENTATION.md # This document
└── postman/                      # API collection for reference
```

### Architecture Patterns

#### 1. Feature-Based Organization
- Features are self-contained modules with their own components and logic
- Shared components live in `src/components/`
- Domain logic is separated from UI components

#### 2. API Client Facade
- Single entry point for all API calls (`src/lib/api/client.ts`)
- Supports both IFS Cloud API and mock data
- Server-side API routes for secure authentication

#### 3. State Management Strategy
- **Server State**: TanStack Query for data fetching and caching
- **UI State**: Zustand for view preferences, dialogs, zoom levels
- **Working State**: Module-level variables for temporary changes

#### 4. Change Tracking
- Hybrid approach: Original state snapshots + ID-based change sets
- Automatic tracking during mutations
- Efficient change detection for sync operations

---

## Data Models

### Core Entities

#### Resource
Represents a technician or resource that can be assigned to teams.

```typescript
interface Resource {
  id: string;                    // Unique identifier (ResourceId from IFS)
  description: string;            // Full name (name + surname)
  ResourceSeq: number;            // IFS Cloud sequence number
  role: string;                  // Role (e.g., "Technician")
  skills: string[];              // Array of skills
}
```

**IFS Cloud Mapping:**
- `id` ← `ResourceId`
- `description` ← `Description`
- `ResourceSeq` ← `ResourceSeq`

#### Team
Represents a crew/team that resources can be assigned to.

```typescript
interface Team {
  id: string;                    // Unique identifier (crew-{ResourceSeq})
  name: string;                  // Team name (ResourceId from IFS)
  description?: string;           // Team description
  color: string;                 // Display color (hex)
  createdAt: string;             // Creation timestamp (ISO)
}
```

**IFS Cloud Mapping:**
- `id` ← `crew-{ResourceSeq}`
- `name` ← `ResourceId`
- `description` ← `Description`

#### Assignment
Represents a resource's assignment to a team for a specific time period.

```typescript
interface Assignment {
  id: string;                    // Unique identifier
  resourceId: string;             // Reference to Resource.id
  teamId: string;                // Reference to Team.id
  start: string;                 // Start date (ISO UTC)
  end: string;                   // End date (ISO UTC)
  role?: string;                 // Optional role
  isTeamLeader: boolean;         // Team leader flag
}
```

**IFS Cloud Mapping:**
- `resourceId` ← `ResourceId` from Crew Membership
- `teamId` ← `crew-{ResourceSeq}` from Crew
- `start` ← `PeriodStart` from Crew Membership
- `end` ← `PeriodEnd` from Crew Membership
- `isTeamLeader` ← Determined by matching Crew Leaders data

### Data Flow

```
IFS Cloud API
    ↓
Server-side API Routes (/api/technicians, /api/crews)
    ↓
API Client (client.ts)
    ↓
Working State Variables (workingTeams, workingAssignments)
    ↓
TanStack Query Cache
    ↓
React Components
```

### Working State Management

The application maintains working state variables that hold temporary changes:

```typescript
// Working state (modified by user)
let workingTeams: Team[] = [];
let workingAssignments: Assignment[] = [];

// Original state (snapshot from IFS Cloud)
let originalTeams: Team[] = [];
let originalAssignments: Assignment[] = [];
```

**Initialization:**
1. Data loaded from IFS Cloud → stored in `originalTeams` and `originalAssignments`
2. Working state initialized as copy of original state
3. User modifications update working state
4. On sync: original state updated to current working state

---

## API Integration

### IFS Cloud Authentication

**Endpoint**: `https://{baseUrl}/auth/realms/{environmentId}/protocol/openid-connect/token`

**Method**: OAuth2 Password Grant

**Configuration** (stored in `.env.local`):
```env
IFS_CLIENT_ID=Postman-API
IFS_CLIENT_SECRET=<secret>
IFS_USERNAME=<username>
IFS_PASSWORD=<password>
NEXT_PUBLIC_IFS_BASE_URL=<base-url>
NEXT_PUBLIC_IFS_ENVIRONMENT_ID=<env-id>
```

**Token Management:**
- Uses `access_token` (not `id_token`) for API authorization
- Token cached with expiration tracking
- Automatic retry on 401 errors
- Scope: `openid microprofile-jwt`

**Implementation**: `src/lib/api/ifs-auth.ts`

### API Endpoints

#### 1. Get Technicians
**Server Route**: `GET /api/technicians`

**IFS Endpoint**: `ServiceResourceDetailsHandling.svc/ResourceSet`

**Query Parameters**:
- `$filter`: `(ResourceParentSeq eq {resourceGroupSeq}) and (ServiceOrganizationId eq '{serviceOrgId}')`
- `$select`: `ResourceSeq,ResourceId,Description,ServiceOrganizationId`

**Response Mapping**:
```typescript
IFS Resource → Application Resource
ResourceId → id
Description → description
ResourceSeq → ResourceSeq
```

**Implementation**: `src/lib/api/ifs-technicians.ts`

#### 2. Get Crews (Teams)
**Server Route**: `GET /api/crews`

**IFS Endpoint**: `ResourceCrewHandling.svc/ResourceSet`

**Query Parameters**:
- `$filter`: `ResourceParentSeq eq {resourceGroupSeqCrews}`
- `$select`: `ResourceSeq,ResourceId,Description`

**Response Mapping**:
```typescript
IFS Crew → Application Team
ResourceSeq → id (as crew-{ResourceSeq})
ResourceId → name
Description → description
```

**Implementation**: `src/lib/api/ifs-crews.ts` → `getCrewsFromIFS()`

#### 3. Get Crew Memberships
**Server Route**: `GET /api/crews/{resourceSeq}/members`

**IFS Endpoint**: `ResourceCrewHandling.svc/ResourceSet(ResourceSeq={resourceSeq})/ResourceCrewMembersArray`

**Query Parameters**:
- `$select`: `ResourceSeq,ResourceMemberSeq,ResourceId,PeriodStart,PeriodEnd`

**Response Mapping**:
```typescript
IFS Crew Membership → Application Assignment
ResourceId → resourceId
ResourceSeq → teamId (as crew-{ResourceSeq})
PeriodStart → start
PeriodEnd → end
ResourceMemberSeq → id (as assign-{ResourceSeq}-{ResourceMemberSeq})
```

**Implementation**: `src/lib/api/ifs-crews.ts` → `getCrewMembershipsFromIFS()`

#### 4. Get Crew Leaders
**Server Route**: `GET /api/crews/{resourceSeq}/leaders`

**IFS Endpoint**: `ResourceCrewHandling.svc/ResourceCrewSet(ResourceSeq={resourceSeq})/ResourceCrewLeadersArray`

**Query Parameters**:
- `$select`: `ResourceSeq,ResourceCrewLeaderSeq,ResourceId,ValidFrom,ValidTo`

**Response Mapping**:
Used to determine `isTeamLeader` flag by matching:
- `ResourceId` matches assignment `resourceId`
- Date ranges overlap (`ValidFrom`/`ValidTo` vs `PeriodStart`/`PeriodEnd`)

**Implementation**: `src/lib/api/ifs-crews.ts` → `getCrewLeadersFromIFS()`

### Server-Side API Routes

All IFS Cloud API calls are made through Next.js API routes for security:

- **`app/api/technicians/route.ts`**: Fetches technicians, handles authentication
- **`app/api/crews/route.ts`**: Fetches all crews
- **`app/api/crews/[resourceSeq]/members/route.ts`**: Fetches crew memberships
- **`app/api/crews/[resourceSeq]/leaders/route.ts`**: Fetches crew leaders

**Benefits:**
- Keeps credentials secure (server-side only)
- Handles authentication automatically
- Provides fallback to mock data
- Centralized error handling

### URL Construction

OData query parameters are manually constructed to prevent incorrect encoding:

```typescript
// ❌ Wrong: URLSearchParams encodes $ to %24
const params = new URLSearchParams({ '$filter': 'ResourceParentSeq eq 1937' });

// ✅ Correct: Manual construction
const filter = encodeURIComponent('ResourceParentSeq eq 1937');
const url = `${baseUrl}/ResourceSet?$filter=${filter}`;
```

---

## User Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ TopMenu (Header)                                        │
│ [Logo] [Date Navigation] [Zoom] [Refresh] [Push]       │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│ Resource │          Gantt Chart (Main Panel)            │
│ Panel    │          ┌─────────────────────────────┐    │
│          │          │ Team 1 Header [+/-]          │    │
│ [Search] │          │ ├─ Member 1 [=====]         │    │
│          │          │ ├─ Member 2 [=====]         │    │
│ [List]   │          │ └─ Member 3 [=====]         │    │
│          │          │ Team 2 Header [+/-]          │    │
│          │          │ └─ Member 1 [=====]         │    │
│          │          └─────────────────────────────┘    │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
           [FAB: New Team]
```

### Components

#### TopMenu
**Location**: `src/components/TopMenu.tsx`

**Features**:
- Brand logo and title
- Date range navigation (prev/next week)
- Current date range display
- Zoom controls (in/out/reset)
- "Today" button
- Refresh button
- "Push to IFS Cloud" button (with change indicator)

**State**:
- View range (from UI store)
- Zoom level (from UI store)
- Unsaved changes (from change tracking)
- Validation warnings (from UI store)
- Sync status (from UI store)

#### ResourcePanel
**Location**: `src/features/scheduler/components/ResourcePanel.tsx`

**Features**:
- Search/filter input
- Scrollable list of resources
- Draggable resource items
- Resource display: description, role

**Interactions**:
- Drag resource to team → opens AssignmentDialog
- Search filters resources in real-time

#### SchedulerBoard
**Location**: `src/features/scheduler/components/SchedulerBoard.tsx`

**Features**:
- Timeline header with date cells
- Team sections (collapsible)
- Member rows (grouped by resource)
- Resizable assignment bars
- Context menu for deletion
- Team leader indicators
- Warning badges for missing leaders

**Interactions**:
- Click team header → expand/collapse
- Drag assignment bar edges → resize period
- Double-click assignment → edit dialog
- Right-click assignment → context menu
- Delete key → delete assignment

#### AssignmentDialog
**Location**: `src/features/scheduler/components/AssignmentDialog.tsx`

**Features**:
- Date pickers (start/end)
- Team Leader checkbox
- Validation error display
- Confirm/Cancel buttons

**Modes**:
- Create: When dragging resource to team
- Edit: When double-clicking assignment

#### NewTeamFab
**Location**: `src/features/scheduler/components/NewTeamFab.tsx`

**Features**:
- Floating Action Button (bottom-right)
- Dialog for team creation
- Input fields: name, description, color picker
- Preview of team appearance

### Styling

- **CSS Modules**: Component-scoped styles
- **CSS Variables**: Theme colors and spacing
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Keyboard navigation, ARIA labels

---

## State Management

### TanStack Query (Server State)

**Purpose**: Manage data fetching, caching, and synchronization

**Key Hooks**:
```typescript
useSchedulerData()        // Combined data (resources, teams, assignments)
useCreateAssignment()     // Create assignment mutation
useUpdateAssignment()     // Update assignment mutation
useDeleteAssignment()     // Delete assignment mutation
useCreateTeam()           // Create team mutation
```

**Query Keys**:
```typescript
queryKeys.scheduler.all           // Main scheduler data
queryKeys.technicians.all         // All technicians
queryKeys.teams.all               // All teams
queryKeys.assignments.all         // All assignments
```

**Cache Strategy**:
- `staleTime`: 30 seconds
- `refetchOnMount`: true
- `refetchOnWindowFocus`: false
- Optimistic updates for mutations

### Zustand (UI State)

**Store**: `src/lib/store/ui-store.ts`

**State**:
```typescript
interface UIState {
  // Selection
  selectedTeamId: string | null;
  selectedResourceId: string | null;
  selectedAssignmentId: string | null;
  
  // Dialogs
  isAssignmentDialogOpen: boolean;
  dialogMode: 'create' | 'edit';
  pendingAssignment: { resourceId: string; teamId: string } | null;
  editingAssignment: Assignment | null;
  
  // View
  viewRange: TimeRange;
  zoomIndex: number;
  dayWidth: ZoomLevel;
  
  // Sync
  hasUnsavedChanges: boolean;      // Deprecated (use API change tracking)
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  
  // Validation
  hasValidationWarnings: boolean;
  autoExpandTeamId: string | null;
}
```

**Actions**:
- `setViewRange()` - Update date range
- `navigateWeeks()` - Navigate forward/backward
- `zoomIn()`, `zoomOut()`, `resetZoom()` - Zoom controls
- `openAssignmentDialog()` - Open create/edit dialog
- `markAsChanged()` - Mark as having unsaved changes
- `setValidationWarnings()` - Update validation state

### Working State (Module-Level)

**Location**: `src/lib/api/client.ts`

**Variables**:
```typescript
let workingTeams: Team[] = [];
let workingAssignments: Assignment[] = [];
let isWorkingStateInitialized = false;
```

**Purpose**: Hold temporary changes before sync to IFS Cloud

**Lifecycle**:
1. Initialized from IFS Cloud data
2. Modified by user actions (mutations)
3. Returned by `getSchedulerData()`
4. Cleared/reset on refresh or after sync

---

## Change Tracking System

See [CHANGE_TRACKING.md](./CHANGE_TRACKING.md) for detailed documentation.

### Overview

The application implements a hybrid change tracking system that:
- Stores original state snapshots from IFS Cloud
- Tracks changed/deleted entity IDs in Sets
- Provides efficient change detection
- Enables incremental sync operations

### Key Functions

```typescript
api.hasUnsavedChanges()           // Check if changes exist
api.getChangeSummary()            // Get detailed change breakdown
api.clearChangeTracking()         // Clear after successful sync
api.resetWorkingState()           // Reset on refresh
```

### Change Categories

- **Created**: New entities (not in original state)
- **Updated**: Modified entities (in both original and working state)
- **Deleted**: Removed entities (in original but not working state)

---

## Validation Rules

### 1. Team Leader Validation

**Rule**: Each team must have exactly one Team Leader per time period.

**Implementation**: `src/domain/teamLeaderValidation.ts`

**Validation Points**:
- When creating assignment with `isTeamLeader: true`
- When updating assignment to `isTeamLeader: true`
- When resizing assignment that is a team leader
- Continuous check for gaps (periods without leader)

**Error Handling**:
- Prevents creating second leader for overlapping period
- Shows warning banner for periods without leader
- Disables "Push to IFS Cloud" when warnings exist

### 2. Cross-Team Overlap Validation

**Rule**: A resource cannot be assigned to multiple teams in overlapping periods.

**Implementation**: `src/domain/overlap.ts` → `findCrossTeamOverlaps()`

**Validation Points**:
- When creating new assignment
- When updating assignment dates or team

**Error Handling**:
- Hard error (no "assign anyway" option)
- Shows error dialog with conflicting team names
- Blocks assignment creation/update

### 3. Date Range Validation

**Rule**: Start date must be before end date.

**Validation Points**:
- AssignmentDialog form submission
- Assignment resize operations

**Error Handling**:
- Form validation error
- Minimum 1-day duration enforced

### 4. Resource Existence Validation

**Rule**: Assignment must reference valid resource and team.

**Validation Points**:
- All assignment operations

**Error Handling**:
- Error if resource not found
- Error if team not found

---

## Testing

### Unit Tests

**Location**: `src/lib/api/__tests__/`

**Test Files**:
- `ifs-auth.test.ts` - Authentication tests
- `ifs-technicians.test.ts` - Technician API tests
- `ifs-crews.test.ts` - Crew API tests

**Test Framework**: Jest with `ts-jest`

**Run Tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Coverage

- Authentication token management
- API URL construction
- OData query parameter encoding
- Error handling
- Data mapping from IFS Cloud to domain models

### Manual Testing URLs

- `http://localhost:3000/api/technicians` - Test technician API
- `http://localhost:3000/api/crews` - Test crews API
- `http://localhost:3000/api/crews/{resourceSeq}/members` - Test memberships
- `http://localhost:3000/api/crews/{resourceSeq}/leaders` - Test leaders

---

## Deployment

### Environment Variables

**Required** (`.env.local`):
```env
# IFS Cloud Integration
NEXT_PUBLIC_USE_IFS_CLOUD=true|false
NEXT_PUBLIC_IFS_BASE_URL=<base-url>
NEXT_PUBLIC_IFS_ENVIRONMENT_ID=<env-id>
NEXT_PUBLIC_IFS_RESOURCE_GROUP_SEQ=1937
NEXT_PUBLIC_IFS_RESOURCE_GROUP_SEQ_CREWS=1938
NEXT_PUBLIC_IFS_SERVICE_ORG_ID=2501

# Authentication (server-side only)
IFS_CLIENT_ID=<client-id>
IFS_CLIENT_SECRET=<client-secret>
IFS_USERNAME=<username>
IFS_PASSWORD=<password>
```

**Template**: See `env.example`

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check
```

### Security Considerations

1. **Credentials**: Never expose `IFS_CLIENT_SECRET` or `IFS_PASSWORD` to client
2. **API Routes**: All IFS Cloud calls go through server-side routes
3. **Token Storage**: Tokens cached server-side only
4. **Environment Variables**: Use `.env.local` (gitignored) for secrets

---

## Future Enhancements

### Planned Features

1. **IFS Cloud Sync Implementation**
   - Implement actual sync operations for create/update/delete
   - Handle sync conflicts
   - Batch operations for efficiency

2. **Advanced Filtering**
   - Filter teams by date range
   - Filter resources by skills/role
   - Search across all entities

3. **Export/Import**
   - Export schedule to Excel/PDF
   - Import assignments from CSV
   - Print-friendly views

4. **User Management**
   - Multi-user support
   - Permission-based access control
   - Audit logging

5. **Performance Optimizations**
   - Virtual scrolling for large datasets
   - Lazy loading of team members
   - Optimistic UI updates

6. **Enhanced Validation**
   - Skill/role compatibility checks
   - Capacity planning
   - Resource availability validation

7. **Analytics and Reporting**
   - Team utilization reports
   - Resource workload analysis
   - Historical trend analysis

### Technical Improvements

1. **Error Handling**
   - Comprehensive error boundaries
   - User-friendly error messages
   - Retry mechanisms for failed operations

2. **Accessibility**
   - Full keyboard navigation
   - Screen reader support
   - ARIA labels and roles

3. **Internationalization**
   - Multi-language support
   - Date/time localization
   - Currency formatting

4. **Mobile Support**
   - Responsive design improvements
   - Touch-optimized interactions
   - Mobile-specific UI patterns

---

## Appendix

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/api/client.ts` | Main API facade, working state, change tracking |
| `src/features/scheduler/Scheduler.tsx` | Main scheduler component, orchestrates UI |
| `src/features/scheduler/components/SchedulerBoard.tsx` | Gantt chart rendering |
| `src/lib/store/ui-store.ts` | UI state management (Zustand) |
| `src/lib/query/hooks.ts` | TanStack Query hooks |
| `src/domain/types.ts` | Core domain types |
| `src/domain/overlap.ts` | Overlap detection logic |
| `src/domain/teamLeaderValidation.ts` | Team leader validation |

### API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/technicians` | GET | Get all technicians |
| `/api/crews` | GET | Get all crews/teams |
| `/api/crews/[resourceSeq]/members` | GET | Get crew memberships |
| `/api/crews/[resourceSeq]/leaders` | GET | Get crew leaders |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (gitignored) |
| `env.example` | Template for environment variables |
| `next.config.js` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |
| `jest.config.js` | Jest test configuration |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-24 | 1.0 | Initial documentation |

---

**Document Status**: Current as of January 24, 2026

**Maintained By**: Development Team

**Last Updated**: January 24, 2026
