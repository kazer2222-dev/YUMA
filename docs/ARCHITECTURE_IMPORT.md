How to view and import the architecture diagram

1) Diagrams.net (draw.io)
- Open `https://app.diagrams.net` (or your local desktop app)
- File → Import From → Device → select `docs/architecture.drawio`
- Edit or export to PNG/SVG/PDF as needed

2) Figma (FigJam)
- Option A: Use the “diagrams.net” community plugin in FigJam to import `.drawio`
  - In FigJam, go to Plugins → Browse all plugins → search “diagrams.net” → Run → Import file → choose `architecture.drawio`
- Option B: Export from diagrams.net to SVG/PNG and paste into FigJam/Figma
  - In diagrams.net: File → Export as → SVG (recommended) or PNG → import into Figma

3) Versioning
- Keep the source diagram in `docs/architecture.drawio`
- When exporting updated assets (PNG/SVG), save alongside (e.g., `docs/architecture.svg`)

4) Scope covered by the diagram
- Client (React, shadcn/ui, Tailwind) → Next.js App Router → API routes
- AuthService (JWT cookies), Prisma, Database
- SSE (realtime), AI Assistant UI and `/api/ai/suggestions` flow
- Notes on board-specific statuses, localStorage board memory, roadmap timeline logic

5) Updating
- Open the `.drawio`, make edits, and commit back to the repo













