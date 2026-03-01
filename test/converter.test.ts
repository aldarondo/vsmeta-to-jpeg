/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertVsMetaToJpeg, clearReaddirCache } from '../src/converter.js';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';
import * as vsmetaParser from 'vsmeta-parser';

vi.mock('node:fs');
vi.mock('vsmeta-parser');

describe('convertVsMetaToJpeg', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        clearReaddirCache();
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });

        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const str = String(pathStr);
            if (str.endsWith('.jpg')) return false;
            if (str.includes('test')) return true;
            return false;
        });
        vi.mocked(fs.readdirSync).mockReturnValue([] as any);
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return WARN if vsmeta parsing fails', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('bad data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockImplementation(() => { throw new Error('parse error'); });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('WARN');
        expect(result.message).toContain('Failed to parse test.vsmeta: parse error');
    });

    it('should return ERROR if file reading fails', () => {
        const readErr = new Error('read error') as any;
        readErr.code = 'EACCES';
        vi.mocked(fs.readFileSync).mockImplementation(() => { throw readErr; });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Permission denied');
    });

    it('should skip if media file is missing', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SKIP');
        expect(result.message).toContain('No matching media file found');
    });

    it('should skip if both images already exist and overwrite is false', () => {
        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const str = String(pathStr);
            if (str.endsWith('.jpg')) return true;
            if (str.includes('test')) return true;
            return false;
        });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SKIP');
        expect(result.message).toContain('Images already exist');
    });

    it('should extract images successfully for a movie (fanart)', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('poster');
        expect(result.message).toContain('fanart');
        expect(result.fanartPath).toContain('-fanart.jpg');
    });

    it('should extract images successfully for an episode (thumb)', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            contentType: 2,
            season: 1,
            episode: 1,
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('poster');
        expect(result.message).toContain('thumb');
        expect(result.fanartPath).toContain('-thumb.jpg');
    });

    it('should only extract what is present', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            posterImage: Buffer.from('poster')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('poster');
        expect(result.message).not.toContain('fanart');
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should extract images successfully for an episode (thumb) via contentType', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            contentType: 2,
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('thumb');
        expect(result.fanartPath).toContain('-thumb.jpg');
    });

    it('should extract images successfully for an episode (thumb) via season/episode', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            season: 1,
            episode: 1,
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('thumb');
        expect(result.fanartPath).toContain('-thumb.jpg');
    });

    it('should extract images successfully for an episode (thumb) via contentType and partial season', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            contentType: 2,
            season: 1,
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('thumb');
    });

    it('should return WARN if no images are found in vsmeta', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({} as any);

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('WARN');
        expect(result.message).toContain('No images found');
    });

    it('should support dry-run', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta', { dryRun: true });

        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('[DRY RUN]');
        expect(result.message).toContain('fanart');
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should use readdirCache', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.readdirSync).mockReturnValue([] as any);

        convertVsMetaToJpeg('dir/a.vsmeta');
        convertVsMetaToJpeg('dir/b.vsmeta');

        expect(fs.readdirSync).toHaveBeenCalledTimes(1);
    });

    it('should match media file if it has the prefix name directly', () => {
        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const p = String(pathStr).replace(/\\/g, '/');
            if (p === 'movie.mp4' || p === './movie.mp4') return true;
            return false;
        });

        const result = convertVsMetaToJpeg('movie.mp4.vsmeta');
        expect(result.status).not.toBe('SKIP');
    });

    it('should handle EACCES error on write', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            posterImage: Buffer.from('poster')
        } as any);
        const writeErr = new Error('write error') as any;
        writeErr.code = 'EACCES';
        vi.mocked(fs.writeFileSync).mockImplementation(() => { throw writeErr; });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Permission denied');
    });

    it('should match media file via readdir if direct check fails', () => {
        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const p = String(pathStr).replace(/\\/g, '/');
            if (p === 'movie' || p === './movie') return false;
            if (p === 'movie.vsmeta' || p === './movie.vsmeta') return true;
            return false;
        });
        // Include files that trigger false paths in the branches
        vi.mocked(fs.readdirSync).mockReturnValue([
            'other.mp4',      // does not start with movie
            'movie.vsmeta',   // is the vsmeta itself
            'movie.txt',      // wrong extension
            'movie.mp4'       // the actual match
        ] as any);

        const result = convertVsMetaToJpeg('movie.vsmeta');
        expect(result.status).not.toBe('SKIP');
    });

    it('should handle partial image existence', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            posterImage: Buffer.from('poster'),
            backdropImage: Buffer.from('fanart')
        } as any);

        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const str = String(pathStr);
            if (str.endsWith('-poster.jpg')) return true; // poster exists
            if (str.endsWith('-fanart.jpg')) return false; // fanart missing
            if (str.includes('test')) return true;
            return false;
        });

        const result = convertVsMetaToJpeg('test.vsmeta', { overwrite: false });
        expect(result.status).toBe('SUCCESS');
        expect(result.message).toContain('fanart');
        expect(result.message).not.toContain('poster');
    });

    it('should handle missing poster or backdrop in metadata object', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        // Poster missing, Backdrop exists (to cover false path of poster ternary)
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            backdropImage: Buffer.from('fanart')
        } as any);

        const result = convertVsMetaToJpeg('test.vsmeta');
        expect(result.status).toBe('SUCCESS');
        expect(result.posterPath).toBeUndefined();
        expect(result.fanartPath).toBeDefined();
    });

    it('should skip fanart extraction if it exists and overwrite is false', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            backdropImage: Buffer.from('fanart')
        } as any);

        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const str = String(pathStr);
            if (str.endsWith('-fanart.jpg')) return true; // fanart exists
            if (str.endsWith('-poster.jpg')) return false; // poster missing
            if (str.includes('test')) return true;
            return false;
        });

        const result = convertVsMetaToJpeg('test.vsmeta', { overwrite: false });
        // Since only fanart was present and it existed, result should be WARN (no images extracted)
        expect(result.status).toBe('WARN');
        expect(result.message).toContain('No images found');
    });

    it('should handle EPERM error', () => {
        vi.mocked(fs.readFileSync).mockImplementation(() => {
            const err = new Error('perm error') as any;
            err.code = 'EPERM';
            throw err;
        });

        const result = convertVsMetaToJpeg('test.vsmeta');
        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Permission denied');
    });

    it('should handle generic errors in convertVsMetaToJpeg', () => {
        vi.mocked(fs.readFileSync).mockImplementation(() => { throw new Error('critical failure'); });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Processing test.vsmeta: critical failure');
    });

    it('should extract fanart if overwrite is true even if it exists', () => {
        vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
        vi.mocked(vsmetaParser.parseVsMeta).mockReturnValue({
            backdropImage: Buffer.from('fanart')
        } as any);

        vi.mocked(fs.existsSync).mockImplementation((pathStr: unknown) => {
            const str = String(pathStr);
            if (str.endsWith('-fanart.jpg')) return true; // exists
            if (str.includes('test')) return true;
            return false;
        });

        const result = convertVsMetaToJpeg('test.vsmeta', { overwrite: true });
        expect(result.status).toBe('SUCCESS');
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle thrown strings in convertVsMetaToJpeg', () => {
        vi.mocked(fs.readFileSync).mockImplementation(() => { throw 'string error'; });

        const result = convertVsMetaToJpeg('test.vsmeta');

        expect(result.status).toBe('ERROR');
        expect(result.message).toContain('Processing test.vsmeta: string error');
    });
});
