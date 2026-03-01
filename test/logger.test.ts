import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logConvertResult, getResultMessage } from '../src/logger.js';
import { ConvertResult } from '../src/types.js';

describe('logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should format message correctly', () => {
        const result: ConvertResult = { status: 'SUCCESS', vsmetaPath: 'test.vsmeta', message: 'test' };
        expect(getResultMessage(result)).toBe('[SUCCESS] test');
    });

    it('should log SUCCESS to console.log', () => {
        const result: ConvertResult = { status: 'SUCCESS', vsmetaPath: 'X', message: 'Y' };
        logConvertResult(result);
        expect(console.log).toHaveBeenCalledWith('[SUCCESS] Y');
    });

    it('should log WARN to console.warn', () => {
        const result: ConvertResult = { status: 'WARN', vsmetaPath: 'X', message: 'Y' };
        logConvertResult(result);
        expect(console.warn).toHaveBeenCalledWith('[WARN] Y');
    });

    it('should log ERROR to console.error', () => {
        const result: ConvertResult = { status: 'ERROR', vsmetaPath: 'X', message: 'Y' };
        logConvertResult(result);
        expect(console.error).toHaveBeenCalledWith('[ERROR] Y');
    });
});
