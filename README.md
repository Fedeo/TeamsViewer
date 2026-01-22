# TeamsViewer - Crew Scheduler

A Gantt-style team and resource scheduling application built with Next.js 14, TypeScript, and TanStack Query.

## Features

- **Resource Panel**: Draggable list of available resources (people/crew members)
- **Gantt Timeline**: Visual representation of team assignments over time
- **Drag & Drop**: Assign resources to teams by dragging them onto the timeline
- **Date Selection**: Set start/end dates when creating assignments
- **Resizable Assignments**: Adjust assignment duration by dragging edges

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: 
  - TanStack Query for server state
  - Zustand for UI state
- **Drag & Drop**: dnd-kit
- **Date Handling**: date-fns
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── src/
│   ├── components/        # Shared presentational components
│   ├── domain/            # Domain types and pure functions
│   │   ├── types.ts       # Core entity types
│   │   ├── validation.ts  # Zod schemas
│   │   └── overlap.ts     # Time overlap detection
│   ├── features/
│   │   └── scheduler/     # Scheduler feature module
│   │       ├── components/
│   │       │   ├── ResourcePanel.tsx
│   │       │   ├── SchedulerBoard.tsx
│   │       │   └── AssignmentDialog.tsx
│   │       └── Scheduler.tsx
│   └── lib/
│       ├── api/           # API client layer
│       ├── query/         # TanStack Query setup
│       └── store/         # Zustand stores
```

## Usage

1. **View Resources**: The left panel shows all available resources
2. **Drag to Assign**: Drag a resource card onto a team row in the timeline
3. **Set Dates**: A dialog will appear to set the assignment's start/end dates
4. **View Assignments**: Colored bars show resource assignments on the timeline
5. **Navigate Time**: Use the arrow buttons in the header to navigate weeks

## License

MIT
