# vsmeta-to-jpeg

## What This Project Is
CLI tool + programmatic library to extract embedded JPEG images (posters and backdrops) from Synology .vsmeta files. Part of the DS Video → Jellyfin migration toolkit. Supports batch directory scanning, dry-run mode, overwrite options, and verbose logging. Images are saved with semantic naming (poster.jpg, fanart.jpg, thumb.jpg).

## Tech Stack
- Node.js / TypeScript
- vsmeta-parser (sibling library — image extraction)
- vitest (testing)
- ESLint
- Changesets (versioning)

## Key Decisions
- Semantic output naming (poster.jpg, fanart.jpg) matches Jellyfin's expected artwork filenames
- Dry-run mode is safe by default
- Depends on vsmeta-parser — do not duplicate binary parsing logic here

## Session Startup Checklist
1. Read ROADMAP.md to find the current active task
2. Check MEMORY.md if it exists — it contains auto-saved learnings from prior sessions
3. Run `npm install` if node_modules are stale
4. Run `npm test` to verify all tests pass before making changes
5. Do not make architectural changes without confirming with Charles first

## Key Files
- `src/` — CLI and library source
- `test/` — vitest tests
- `CHANGELOG.md` — version history

---
@~/Documents/GitHub/CLAUDE.md

## Git Rules
- Never create pull requests. Push directly to main.
- solo/auto-push OK
