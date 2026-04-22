# vsmeta-to-jpeg — Roadmap

## Current Milestone
✅ Production-ready — CLI and library complete

### 🔨 In Progress
[Empty]

### 🟢 Ready (Next Up)
[Empty — tool is complete; update only if new image types are found in .vsmeta files]

### 📋 Backlog
- Add support for extracting season poster images (if present in some .vsmeta variants)
- Add --format flag to convert extracted images to WebP for smaller file sizes
- Consider publishing as npm package for broader DS Video migration community

### 🔴 Blocked
[Empty]

## ✅ Completed
- CLI tool: scan directory, extract all .vsmeta images
- Semantic output naming: poster.jpg, fanart.jpg, thumb.jpg
- Dry-run mode
- Overwrite protection with --overwrite flag
- Verbose logging
- Programmatic API for use as a library
- Full vitest test coverage
- Changesets versioning
