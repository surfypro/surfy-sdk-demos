#!/usr/bin/env npx tsx
/**
 * Agent-facing oxlint — deposit errors only under `.surfy/quality-agent/lint.json`.
 * Usage: pnpm quality:agent:lint              (autofix by default, then report remaining)
 *        pnpm quality:agent:lint -- --no-fix (check-only; used by quality:agent:gate)
 * Stdout: one line OK/FAIL (never full oxlint dump).
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    buildReport,
    depositQualityAgentReport,
    formatAgentStdoutLine,
    parseOxlintJson,
    resolveRepoBin,
    type QualityAgentError
} from './quality-agent.helper';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const reactWebRoot = path.join(repoRoot, 'apps/react-web');
const oxlintBin = resolveRepoBin(repoRoot, 'oxlint', 'apps/react-web');

/** Autofix by default; opt out with `--no-fix` or `QUALITY_AGENT_LINT_FIX=0`. */
const noFix =
    process.argv.includes('--no-fix') || process.env.QUALITY_AGENT_LINT_FIX === '0';
const withFix = !noFix;

const oxlintArgs = ['--format=json', '--quiet'];
if (withFix) {
    oxlintArgs.push('--fix');
}

const result = spawnSync(oxlintBin, oxlintArgs, {
    cwd: reactWebRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: process.env
});

function parseOxlintStdout(out: string): unknown {
    const trimmed = out.trim();
    if (!trimmed) return { diagnostics: [] };
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    return JSON.parse(trimmed) as unknown;
}

let json: unknown = { diagnostics: [] };
try {
    json = parseOxlintStdout(result.stdout ?? '');
} catch {
    const errors: QualityAgentError[] = [
        {
            message: `oxlint JSON parse failed; stderr=${(result.stderr ?? '').slice(0, 2000)}`
        }
    ];
    const report = buildReport('lint', errors);
    const reportPath = depositQualityAgentReport(repoRoot, report);
    process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);
    process.exit(1);
}

const errors = parseOxlintJson(json).map((err) => {
    if (!err.file) return err;
    const abs = path.isAbsolute(err.file) ? err.file : path.resolve(reactWebRoot, err.file);
    return { ...err, file: path.relative(repoRoot, abs) };
});

const report = buildReport('lint', errors);
const reportPath = depositQualityAgentReport(repoRoot, report);
process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);

if (result.error) {
    process.stderr.write(String(result.error));
    process.exit(1);
}

process.exit(report.ok ? 0 : 1);
