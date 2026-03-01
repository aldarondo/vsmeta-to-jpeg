import fs from 'fs';
import path from 'path';
import { parseVsMeta, VsMetaData } from 'vsmeta-parser';
import { ConvertOptions, ConvertResult } from './types.js';

// Common video extensions checked when verifying a matching media file exists.
const MEDIA_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.m4v', '.m2ts', '.ts', '.mpg', '.mpeg']);

// Per-directory cache for readdirSync results — avoids redundant I/O when
// multiple .vsmeta files share the same folder during a batch conversion.
const readdirCache = new Map<string, string[]>();

/** Clear the internal directory listing cache. Call after a batch run completes. */
export function clearReaddirCache(): void {
    readdirCache.clear();
}

export function hasMatchingMediaFile(vsmetaPath: string): boolean {
    const dir = path.dirname(vsmetaPath);
    const basename = path.basename(vsmetaPath, '.vsmeta');

    if (fs.existsSync(path.join(dir, basename))) {
        return true;
    }

    let files = readdirCache.get(dir);
    if (!files) {
        files = fs.readdirSync(dir) as string[];
        readdirCache.set(dir, files);
    }

    for (const file of files) {
        if (file.startsWith(basename) && file !== path.basename(vsmetaPath)) {
            const ext = path.extname(file).toLowerCase();
            if (MEDIA_EXTENSIONS.has(ext)) {
                return true;
            }
        }
    }

    return false;
}

export function convertVsMetaToJpeg(vsmetaPath: string, options: ConvertOptions = {}): ConvertResult {
    try {
        if (!hasMatchingMediaFile(vsmetaPath)) {
            return {
                status: 'SKIP',
                vsmetaPath,
                message: `No matching media file found for: ${vsmetaPath}`
            };
        }

        const buffer = fs.readFileSync(vsmetaPath);
        let meta: VsMetaData;
        try {
            meta = parseVsMeta(buffer);
        } catch (e) {
            return {
                status: 'WARN',
                vsmetaPath,
                message: `Failed to parse ${vsmetaPath}: ${(e as Error).message}`
            };
        }

        const isEpisode = meta.contentType === 2 || (meta.season != null && meta.episode != null);
        const posterPath = vsmetaPath.replace(/\.vsmeta$/i, '-poster.jpg');
        const fanartPath = vsmetaPath.replace(/\.vsmeta$/i, isEpisode ? '-thumb.jpg' : '-fanart.jpg');

        const posterExists = fs.existsSync(posterPath);
        const fanartExists = fs.existsSync(fanartPath);

        if (!options.overwrite && posterExists && fanartExists) {
            return {
                status: 'SKIP',
                vsmetaPath,
                message: `Images already exist (use --overwrite to replace): ${vsmetaPath}`,
                posterPath,
                fanartPath
            };
        }

        const results: string[] = [];
        let anyExtracted = false;

        if (meta.posterImage) {
            if (options.overwrite || !posterExists) {
                if (!options.dryRun) {
                    fs.writeFileSync(posterPath, meta.posterImage);
                }
                results.push(`poster: ${posterPath}`);
                anyExtracted = true;
            }
        }

        if (meta.backdropImage) {
            if (options.overwrite || !fanartExists) {
                if (!options.dryRun) {
                    fs.writeFileSync(fanartPath, meta.backdropImage);
                }
                results.push(`${isEpisode ? 'thumb' : 'fanart'}: ${fanartPath}`);
                anyExtracted = true;
            }
        }

        if (!anyExtracted) {
            return {
                status: 'WARN',
                vsmetaPath,
                message: `No images found in ${vsmetaPath}`
            };
        }

        const prefix = options.dryRun ? '[DRY RUN] ' : '';
        return {
            status: 'SUCCESS',
            vsmetaPath,
            message: `${prefix}Extracted ${results.join(', ')}`,
            posterPath: meta.posterImage ? posterPath : undefined,
            fanartPath: meta.backdropImage ? fanartPath : undefined
        };

    } catch (err) {
        const e = err as Error & { code?: string };
        let msg = '';
        if (e.code === 'EACCES' || e.code === 'EPERM') {
            msg = `Permission denied: Cannot read/write files. Please check permissions for ${vsmetaPath}`;
        } else {
            msg = `Processing ${vsmetaPath}: ${e.message || err}`;
        }
        return { status: 'ERROR', vsmetaPath, message: msg };
    }
}
