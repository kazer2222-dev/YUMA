Navigation and routing details

Overview of routes
- Spaces list: `/spaces` (if present) or deep links to a specific space: `/spaces/{slug}`.
- Space page (hub): `/spaces/{slug}` with client-side tabs: Overview, Tasks, Board, Calendar, Roadmap, AI.
- Board deep link: `/spaces/{slug}?boardId={boardId}` (also supported: `/spaces/{slug}/boards/{boardId}`) which persists last board.
- Individual board page (optional): `/spaces/{slug}/boards/{boardId}`.

Sidebar behavior (`components/layout/notion-sidebar.tsx`)
- Spaces render as primary entries. Clicking a space:
  - If `lastBoard_{slug}` exists in localStorage, navigates to `/spaces/{slug}?boardId={id}`.
  - Otherwise, navigates to `/spaces/{slug}`.
- Spaces expand/collapse to show child boards.
- Boards are indented child rows; clicking navigates to `/spaces/{slug}?boardId={boardId}` and sets `lastBoard_{slug}`.
- Space row menu (three dots): “Create Board”, “Delete Space”.

Space page tabs (`app/spaces/[slug]/page.tsx`)
- Tabs are client state; switching does not reload.
- Tabs:
  - Overview: summary cards (members, tasks, boards).
  - Tasks: spreadsheet-like table (`components/tasks/tasks-table.tsx`).
  - Board: renders `BoardView` when `boardId` is present; otherwise shows guidance.
    - “Board” tab shows a hover Popover listing boards; select navigates and updates localStorage.
    - “Create Board” in the Popover opens `CreateBoardDialog`.
  - Calendar: calendar with event creation (participants chips).
  - Roadmap: Jira-like timeline with scales, drag-to-pan, infinite extension; supports item creation.
  - AI: assistant dashboard (suggestions/mockups).
- On initial load:
  - Reads `boardId` from URL (query/path).
  - Falls back to `localStorage.lastBoard_{slug}` if available.
  - If still none, fetches boards; if any exist, uses the first for board-dependent views.

Board selection memory
- Any board navigation (sidebar, Popover, direct link) updates `lastBoard_{slug}` in localStorage.
- `app/spaces/[slug]/boards/[boardId]/page.tsx` also writes `lastBoard_{slug}` on load for consistency.

URL patterns and back/forward behavior
- Tabs are client-only state; URL remains `/spaces/{slug}` (plus `boardId` when applicable).
- Selecting a board updates the query param so browser back/forward moves between board selections.
- Deep links to `/spaces/{slug}?boardId={id}` open the Board tab with the correct board.

Boards hover menu (tab bar)
- Hover over “Board” to open a Popover listing all boards for the space.
- Selecting a board navigates and updates `lastBoard_{slug}`.
- “Create Board” at the bottom opens `CreateBoardDialog`; newly created boards appear immediately.

Empty/edge states
- No boards: sidebar shows space without children; “Create Board” available in menus; Board tab shows guidance.
- Invalid/missing `boardId`: falls back to `lastBoard_{slug}` or shows no-board-selected UI.
- Permissions: API returns 403 for non-members; UI surfaces error states.

Persistence and SSR/CSR
- Board choice persistence is client-side via `localStorage`.
- Navigation uses Next.js client hooks (`usePathname`, `useRouter`, `useSearchParams`).
- Space page is a client component to manage tabs, query params, and localStorage.

Files involved
- `app/spaces/[slug]/page.tsx`: tab logic, board selection, localStorage, query parsing.
- `components/layout/notion-sidebar.tsx`: nested space/board navigation and actions.
- `components/board/create-board-dialog.tsx`: create flow used from sidebar and boards Popover.
- `app/spaces/[slug]/boards/[boardId]/page.tsx`: deep link, writes `lastBoard_{slug}`.

Optional enhancements
- Reflect tab state in the URL (e.g., `?tab=tasks`) to support back/forward for tabs.













