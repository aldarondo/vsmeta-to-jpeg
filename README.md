# vsmeta-to-jpeg

Extract embedded JPEG images (poster and backdrop) from Synology Video Station `.vsmeta` metadata files.

Synology has officially deprecated Video Station with DSM 7.2.2. If you are migrating to Jellyfin, Kodi, Plex, or other generic ecosystems, this tool helps you recover the high-quality artwork (posters and backdrops) currently trapped inside your binary `.vsmeta` files and saves them as standard `.jpg` sidecars directly alongside your source media.

Looking to generate `.nfo` metadata files as well? Check out the sibling package [vsmeta-to-nfo](https://github.com/aldarondo/vsmeta-to-nfo).

This package provides both a **command-line tool** for batch extraction and a **programmatic interface**.

## Installation

```bash
# Global install for CLI use
npm install -g vsmeta-to-jpeg

# Or install locally
npm install vsmeta-to-jpeg
```

## CLI Usage

### Installed Package

```bash
# Process a single file
vsmeta-to-jpeg ./path/to/movie.mp4.vsmeta

# Recursively scan a directory and extract images from all discovered .vsmeta files
vsmeta-to-jpeg ./path/to/library
```

### Options

*   **`-d, --dry-run`**: Simulate the process without writing any actual `.jpg` files.
*   **`-f, --overwrite`**: By default, the script skips extraction if the target `.jpg` files already exist. This option overrides that safeguard.
*   **`-v, --verbose`**: Append a concise list of all skipped or failed files and errors at the end of the console execution run.

### Image Naming Convention

Images are extracted using a prefix based on the `.vsmeta` filename:
- `poster.jpg`: The main artwork / cover.
- `fanart.jpg`: The backdrop / background (**Movies/Others**).
- `thumb.jpg`: The backdrop / background (**TV Episodes**).

If your file is `MyMovie.mp4.vsmeta`, the tool will generate `MyMovie.mp4-poster.jpg` and `MyMovie.mp4-fanart.jpg`.
If your file is `S01E01.mp4.vsmeta` (and contains episode metadata), it will generate `S01E01.mp4-poster.jpg` and `S01E01.mp4-thumb.jpg`.

## Programmatic API

```javascript
import { convertVsMetaToJpeg } from 'vsmeta-to-jpeg';

const result = convertVsMetaToJpeg('./libraries/movies/MyMovie (2020).mp4.vsmeta', {
  dryRun: false,
  overwrite: true,
});

if (result.status === 'SUCCESS') {
    console.log(`Extracted images for: ${result.vsmetaPath}`);
}
```

## License

MIT License
