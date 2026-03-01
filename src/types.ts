export interface ConvertOptions {
    dryRun?: boolean;
    overwrite?: boolean;
    verbose?: boolean;
}

export interface ConvertResult {
    status: 'SUCCESS' | 'WARN' | 'SKIP' | 'ERROR';
    vsmetaPath: string;
    message: string;
    posterPath?: string;
    fanartPath?: string;
}
