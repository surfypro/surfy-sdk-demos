#!/usr/bin/env npx tsx
/**
 * Agent-facing merge + full gate — merge-dry vs origin/main + quality:agent:gate.
 * Usage: pnpm quality:agent:ci
 * Stdout: one line per step + final summary (never full gate dump).
 * Failures: `.surfy/quality-agent/merge-main.json` | gate deposits | `ci.summary.json`
 *
 * Before push/PR only. After milestones prefer quality:agent:code (lint + tsc).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    depositQualityAgentReport,
    formatAgentStdoutLine,
    qualityAgentDir,
    reportFromCommandFail,
    resolveRepoBin
} from './quality-agent.helper';

interface CiStepResult {
    readonly id: string;
    readonly ok: boolean;
    readonly reportPath?: string | null;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxBin = resolveRepoBin(repoRoot, 'tsx');
const steps: CiStepResult[] = [];

function finish(code: number): never {
    const summary = {
        ok: code === 0,
        kind: 'ci',
        count: steps.filter((s) => !s.ok).length,
        steps: steps.map((s) => ({
            id: s.id,
            ok: s.ok,
            report: s.ok ? null : (s.reportPath ?? `.surfy/quality-agent/${s.id}.json`)
        }))
    };
    const summaryPath = path.join(qualityAgentDir(repoRoot), 'ci.summary.json');
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    const rel = path.relative(repoRoot, summaryPath);
    if (code === 0) {
        process.stdout.write(`OK ci → ${rel}\n`);
    } else {
        process.stdout.write(`FAIL ci n=${summary.count} → ${rel}\n`);
    }
    process.exit(code);
}

function checkMergeWithMain(): CiStepResult {
    const id = 'merge-main';
    const fetch = spawnSync('git', ['fetch', 'origin', 'main'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        env: process.env
    });
    if (fetch.status !== 0 || fetch.error) {
        const report = reportFromCommandFail(
            id,
            fetch.stdout ?? '',
            fetch.stderr ?? String(fetch.error ?? 'git fetch origin main failed')
        );
        const reportPath = depositQualityAgentReport(repoRoot, report);
        process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);
        return { id, ok: false, reportPath };
    }

    const merge = spawnSync('git', ['merge-tree', '--write-tree', 'HEAD', 'origin/main'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        env: process.env
    });
    if (merge.status === 0 && !merge.error) {
        const report = { ok: true as const, kind: id, count: 0, errors: [] };
        depositQualityAgentReport(repoRoot, report);
        process.stdout.write(`${formatAgentStdoutLine(report, null)}\n`);
        return { id, ok: true, reportPath: null };
    }

    const report = reportFromCommandFail(
        id,
        merge.stdout ?? '',
        merge.stderr ??
            'Merge with origin/main: CONFLICT — rebase or merge origin/main before opening/updating the PR.'
    );
    const reportPath = depositQualityAgentReport(repoRoot, report);
    process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);
    return { id, ok: false, reportPath };
}

function runAgentGate(): CiStepResult {
    const id = 'gate';
    const scriptPath = path.join(repoRoot, 'scripts/dev/quality/quality-agent-gate.ts');
    const result = spawnSync(tsxBin, [scriptPath], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        env: process.env
    });
    const stdout = (result.stdout ?? '').trim();
    if (stdout) {
        process.stdout.write(`${stdout}\n`);
    }
    const ok = result.status === 0 && !result.error;
    return {
        id,
        ok,
        reportPath: ok ? null : path.join('.surfy', 'quality-agent', 'gate.summary.json')
    };
}

process.chdir(repoRoot);
fs.mkdirSync(qualityAgentDir(repoRoot), { recursive: true });

steps.push(checkMergeWithMain());
if (!steps.at(-1)?.ok) finish(1);

steps.push(runAgentGate());
if (!steps.at(-1)?.ok) finish(1);

finish(0);
