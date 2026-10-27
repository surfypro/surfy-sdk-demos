/**
 * Shared helpers for agent-facing quality scripts.
 * Deposit only structured failures under `.surfy/quality-agent/` (gitignored).
 */

import fs from 'node:fs';
import path from 'node:path';

export const QUALITY_AGENT_DIR_NAME = 'quality-agent';
export const DEFAULT_MAX_ERRORS = 50;

export interface QualityAgentError {
    readonly file?: string;
    readonly line?: number;
    readonly col?: number;
    readonly code?: string;
    readonly ruleId?: string;
    readonly message: string;
}

export interface QualityAgentReport {
    readonly ok: boolean;
    readonly kind: string;
    readonly count: number;
    readonly truncated?: boolean;
    readonly errors: readonly QualityAgentError[];
    readonly message?: string;
}

export function qualityAgentDir(repoRoot: string): string {
    return path.join(repoRoot, '.surfy', QUALITY_AGENT_DIR_NAME);
}

export function qualityAgentReportPath(repoRoot: string, kind: string): string {
    return path.join(qualityAgentDir(repoRoot), `${kind}.json`);
}

export function capErrors(
    errors: readonly QualityAgentError[],
    maxErrors = DEFAULT_MAX_ERRORS
): { errors: QualityAgentError[]; truncated: boolean } {
    if (errors.length <= maxErrors) {
        return { errors: [...errors], truncated: false };
    }
    return { errors: errors.slice(0, maxErrors), truncated: true };
}

/**
 * Success → remove report file (no file = no errors).
 * Failure → write JSON report.
 */
export function depositQualityAgentReport(
    repoRoot: string,
    report: QualityAgentReport
): string | null {
    const dir = qualityAgentDir(repoRoot);
    const filePath = qualityAgentReportPath(repoRoot, report.kind);
    fs.mkdirSync(dir, { recursive: true });
    if (report.ok) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return null;
    }
    fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return filePath;
}

/** One-line stdout for agents (never dump full tool output). */
export function formatAgentStdoutLine(
    report: QualityAgentReport,
    reportPath: string | null
): string {
    if (report.ok) {
        return `OK ${report.kind}`;
    }
    const where = reportPath ? ` → ${reportPath}` : '';
    const trunc = report.truncated ? ' truncated' : '';
    return `FAIL ${report.kind} n=${report.count}${trunc}${where}`;
}

/**
 * Parse `tsc --pretty false` lines:
 *   path(line,col): error TSxxxx: message
 */
export function parseTscPrettyFalse(text: string): QualityAgentError[] {
    const errors: QualityAgentError[] = [];
    const re = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s*(.*)$/;
    for (const line of text.split(/\r?\n/)) {
        const m = re.exec(line);
        if (!m) continue;
        errors.push({
            file: m[1],
            line: Number(m[2]),
            col: Number(m[3]),
            code: m[4],
            message: m[5] ?? ''
        });
    }
    return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Parse oxlint `--format=json` output.
 * Keep severity "error" only (warnings stay out of deposits).
 */
export function parseOxlintJson(oxlintJson: unknown): QualityAgentError[] {
    if (!isRecord(oxlintJson)) return [];
    const diagnostics = Array.isArray(oxlintJson.diagnostics) ? oxlintJson.diagnostics : [];
    const errors: QualityAgentError[] = [];
    for (const diag of diagnostics) {
        if (!isRecord(diag)) continue;
        if (diag.severity !== 'error') continue;
        const filename = typeof diag.filename === 'string' ? diag.filename : undefined;
        const code = typeof diag.code === 'string' ? diag.code : undefined;
        const message = typeof diag.message === 'string' ? diag.message : String(diag.message ?? '');
        let line: number | undefined;
        let col: number | undefined;
        const labels = Array.isArray(diag.labels) ? diag.labels : [];
        const firstLabel = labels[0];
        if (isRecord(firstLabel) && isRecord(firstLabel.span)) {
            if (typeof firstLabel.span.line === 'number') line = firstLabel.span.line;
            if (typeof firstLabel.span.column === 'number') col = firstLabel.span.column;
        }
        errors.push({
            file: filename,
            line,
            col,
            code,
            ruleId: code,
            message
        });
    }
    return errors;
}

/** Generic step fail (build, merge, …): one clipped structured error. */
export function reportFromCommandFail(
    kind: string,
    stdout: string,
    stderr: string,
    maxChars = 4000
): QualityAgentReport {
    const combined = [stderr, stdout].filter(Boolean).join('\n').trim();
    const clipped =
        combined.length > maxChars ? `${combined.slice(0, maxChars)}\n…` : combined;
    return {
        ok: false,
        kind,
        count: 1,
        errors: [{ message: clipped || `command failed (${kind})` }]
    };
}

export function buildReport(
    kind: string,
    errors: readonly QualityAgentError[],
    maxErrors = DEFAULT_MAX_ERRORS
): QualityAgentReport {
    if (errors.length === 0) {
        return { ok: true, kind, count: 0, errors: [] };
    }
    const capped = capErrors(errors, maxErrors);
    return {
        ok: false,
        kind,
        count: errors.length,
        truncated: capped.truncated || undefined,
        errors: capped.errors
    };
}

export function resolveRepoBin(repoRoot: string, binName: string, packageDir?: string): string {
    if (packageDir) {
        const local = path.join(repoRoot, packageDir, 'node_modules', '.bin', binName);
        if (fs.existsSync(local)) return local;
    }
    const root = path.join(repoRoot, 'node_modules', '.bin', binName);
    if (fs.existsSync(root)) return root;
    throw new Error(`binary not found: ${binName}${packageDir ? ` (looked in ${packageDir})` : ''}`);
}
