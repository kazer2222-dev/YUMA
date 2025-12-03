# Board Experience Refactor Plan

This document outlines the phased approach for the board experience refactor described in the latest architecture review. The objective is to improve maintainability, performance, and developer experience while preserving existing functionality.

## Goals
- Reduce the size and complexity of `components/board/board-view.tsx`.
- Centralise board data fetching with TanStack Query.
- Isolate drag‑and‑drop state management into focused hooks/components.
- Prepare the codebase for better automated testing and future features.

## Phases

### Phase 1 – Planning & Foundations
1. Document the current responsibilities of `BoardView`.
2. Introduce a `useBoardData` hook that loads tasks, statuses, board metadata, sprints, and space information via React Query.
3. Define shared TypeScript types in `components/board/board-types.ts` (already available) and reuse them across hooks/components.
4. Replace the ad‑hoc `fetch` logic in `BoardView` with the new hook while keeping the existing UI intact.

**Deliverables**
- `docs/BOARD_REFACTOR_PLAN.md` (this file).
- `lib/hooks/use-board-data.ts`.
- `BoardView` updated to consume `useBoardData`, removing local loading/error plumbing.

### Phase 2 – UI Decomposition
1. Extract `BoardHeader`, `BoardColumn`, and `BoardCard` into dedicated components (some already exist and will be reused/extended).
2. Introduce a `useBoardState` hook to encapsulate local state (selected task, drag context, filters, etc.).
3. Ensure extracted components accept typed props to reduce implicit coupling.

### Phase 3 – Drag-and-Drop & Optimistic Updates
1. Move drag-and-drop orchestration into a `useBoardDragAndDrop` hook that interacts with React Query caches for optimistic updates.
2. Replace manual `useRef` bookkeeping with declarative state where possible.
3. Ensure SSE handlers and React Query cache updates stay in sync (e.g., via `queryClient.setQueryData`).

### Phase 4 – Testing & Hardening
1. Add unit tests for the new hooks (`useBoardData`, `useBoardState`, `useBoardDragAndDrop`).
2. Add integration tests for critical user flows (loading board, moving tasks, creating items).
3. Update documentation (README / developer guides) to describe the new structure.

## Out of Scope
- Security changes (e.g. removing hard-coded secrets) remain deferred per request.
- Large API redesigns are not included in this pass, though the new hook can evolve to consume aggregated endpoints later.

## Tracking
Progress is tracked via the workspace to-do list:
1. Plan board module refactor scope and sequence ✅
2. Introduce React Query hooks for board data fetching
3. Extract board UI into smaller components
4. Refactor drag-and-drop logic into reusable hooks/components
5. Add unit/integration tests for the new architecture

Each phase will result in incremental pull requests to keep reviews manageable.




















