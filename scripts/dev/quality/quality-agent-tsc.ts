#!/usr/bin/env npx tsx
/**
 * Agent-facing tsc — deposit errors only under `.surfy/quality-agent/tsc.json`.
 * Usage: pnpm quality:agent:tsc
 * Stdout: one line OK/FAIL (never full tsc dump).
 *
 * Packages: surfy-demo-auth, demo-server, react-web (project references).
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    buildReport,
    depositQualityAgentReport,
    formatAgentStdoutLine,
    parseTscPrettyFalse,
    resolveRepoBin,
    type QualityAgentError
} from './quality-agent.helper';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

interface TscTarget {
    readonly id: string;
    readonly cwd: string;
    readonly args: readonly string[];
}

const targets: TscTarget[] = [
    {
        id: 'surfy-demo-auth',
        cwd: path.join(repoRoot, 'packages/surfy-demo-auth'),
        args: ['--noEmit', '--pretty', 'false']
    },
    {
        id: 'demo-server',
        cwd: path.join(repoRoot, 'apps/demo-server'),
        args: ['--noEmit', '--pretty', 'false']
    },
    {
        id: 'react-web',
        cwd: path.join(repoRoot, 'apps/react-web'),
        args: ['-b', '--pretty', 'false']
    }
];

function relativizeFile(file: string, cwd: string): string {
    if (path.isAbsolute(file)) {
        return path.relative(repoRoot, file);
    }
    return path.relative(repoRoot, path.resolve(cwd, file));
}

const tscBin = resolveRepoBin(repoRoot, 'tsc');
const allErrors: QualityAgentError[] = [];

for (const target of targets) {
    const result = spawnSync(tscBin, target.args, {
        cwd: target.cwd,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        env: process.env
    });

    if (result.error) {
        allErrors.push({
            message: `${target.id}: ${String(result.error)}`
        });
        continue;
    }

    const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const parsed = parseTscPrettyFalse(text);
    for (const err of parsed) {
        allErrors.push({
            ...err,
            file: err.file ? relativizeFile(err.file, target.cwd) : target.id
        });
    }

    if (parsed.length === 0 && result.status !== 0) {
        allErrors.push({
            message: `${target.id}: tsc exited ${result.status}${text.trim() ? `\n${text.trim().slice(0, 2000)}` : ''}`
        });
    }
}

const report = buildReport('tsc', allErrors);
const reportPath = depositQualityAgentReport(repoRoot, report);
process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);
process.exit(report.ok ? 0 : 1);
