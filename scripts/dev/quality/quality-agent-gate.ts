#!/usr/bin/env npx tsx
/**
 * Agent-facing CI Quality twin — same steps as `pnpm quality` / GitHub Actions Quality job:
 * - lint check-only (no autofix)
 * - react-web build
 * - demo-server typecheck
 *
 * Heavy steps go through quality-agent depositors where possible.
 * Stdout: one line per step + final summary (no green spam).
 * Failures: `.surfy/quality-agent/<kind>.json` + `gate.summary.json`
 *
 * Prefer quality:agent:code after milestones; quality:agent:ci before push/PR.
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

interface GateStepResult {
    readonly id: string;
    readonly ok: boolean;
    readonly reportPath?: string | null;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxBin = resolveRepoBin(repoRoot, 'tsx');
const steps: GateStepResult[] = [];

function runShellStep(
    id: string,
    command: readonly string[],
    env: NodeJS.ProcessEnv = process.env
): GateStepResult {
    const [bin, ...args] = command;
    if (!bin) {
        throw new Error(`empty command for step ${id}`);
    }
    const result = spawnSync(bin, args, {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        env: {
            ...env,
            CI: env.CI ?? 'true'
        }
    });
    const ok = result.status === 0 && !result.error;
    if (ok) {
        const report = { ok: true as const, kind: id, count: 0, errors: [] };
        depositQualityAgentReport(repoRoot, report);
        process.stdout.write(`${formatAgentStdoutLine(report, null)}\n`);
        return { id, ok: true, reportPath: null };
    }
    const report = reportFromCommandFail(id, result.stdout ?? '', result.stderr ?? '');
    const reportPath = depositQualityAgentReport(repoRoot, report);
    process.stdout.write(`${formatAgentStdoutLine(report, reportPath)}\n`);
    return { id, ok: false, reportPath };
}

function runAgentScript(
    id: string,
    scriptRel: string,
    extraArgs: readonly string[] = []
): GateStepResult {
    const scriptPath = path.join(repoRoot, scriptRel);
    const result = spawnSync(tsxBin, [scriptPath, ...extraArgs], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        env: process.env
    });
    const line =
        (result.stdout ?? '').trim().split(/\r?\n/).filter(Boolean).at(-1) ??
        `${result.status === 0 ? 'OK' : 'FAIL'} ${id}`;
    process.stdout.write(`${line}\n`);
    return {
        id,
        ok: result.status === 0 && !result.error,
        reportPath: result.status === 0 ? null : path.join('.surfy', 'quality-agent', `${id}.json`)
    };
}

function finish(code: number): never {
    const summary = {
        ok: code === 0,
        kind: 'gate',
        count: steps.filter((s) => !s.ok).length,
        steps: steps.map((s) => ({
            id: s.id,
            ok: s.ok,
            report: s.ok ? null : (s.reportPath ?? `.surfy/quality-agent/${s.id}.json`)
        }))
    };
    const summaryPath = path.join(qualityAgentDir(repoRoot), 'gate.summary.json');
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    const rel = path.relative(repoRoot, summaryPath);
    if (code === 0) {
        process.stdout.write(`OK gate → ${rel}\n`);
    } else {
        process.stdout.write(`FAIL gate n=${summary.count} → ${rel}\n`);
    }
    process.exit(code);
}

process.chdir(repoRoot);
fs.mkdirSync(qualityAgentDir(repoRoot), { recursive: true });

steps.push(
    runAgentScript('lint', 'scripts/dev/quality/quality-agent-lint.ts', ['--no-fix'])
);
if (!steps.at(-1)?.ok) finish(1);

steps.push(runShellStep('react-web-build', ['pnpm', '--filter', 'react-web', 'build']));
if (!steps.at(-1)?.ok) finish(1);

steps.push(
    runShellStep('demo-server-typecheck', ['pnpm', '--filter', 'demo-server', 'typecheck'])
);
if (!steps.at(-1)?.ok) finish(1);

finish(0);
