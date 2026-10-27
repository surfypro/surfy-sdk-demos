#!/usr/bin/env npx tsx
/**
 * Agent-facing code base check — oxlint (autofix) + tsc (errors-only deposits).
 * Usage: pnpm quality:agent:code
 * When: after each milestone delivery (before next work / PR prep).
 * Not a substitute for quality:agent:ci (merge + full gate before push/PR).
 *
 * Steps: quality:agent:lint → quality:agent:tsc
 * Summary: `.surfy/quality-agent/code.summary.json`
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { qualityAgentDir, resolveRepoBin } from './quality-agent.helper';

interface CodeStepResult {
    readonly id: string;
    readonly ok: boolean;
    readonly reportPath?: string | null;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxBin = resolveRepoBin(repoRoot, 'tsx');
const steps: CodeStepResult[] = [];

function finish(code: number): never {
    const summary = {
        ok: code === 0,
        kind: 'code',
        count: steps.filter((s) => !s.ok).length,
        steps: steps.map((s) => ({
            id: s.id,
            ok: s.ok,
            report: s.ok ? null : (s.reportPath ?? `.surfy/quality-agent/${s.id}.json`)
        }))
    };
    const summaryPath = path.join(qualityAgentDir(repoRoot), 'code.summary.json');
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    const rel = path.relative(repoRoot, summaryPath);
    if (code === 0) {
        process.stdout.write(`OK code → ${rel}\n`);
    } else {
        process.stdout.write(`FAIL code n=${summary.count} → ${rel}\n`);
    }
    process.exit(code);
}

function runAgentScript(
    id: string,
    scriptRel: string,
    extraArgs: readonly string[] = []
): CodeStepResult {
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

process.chdir(repoRoot);
fs.mkdirSync(qualityAgentDir(repoRoot), { recursive: true });

steps.push(runAgentScript('lint', 'scripts/dev/quality/quality-agent-lint.ts'));
if (!steps.at(-1)?.ok) finish(1);

steps.push(runAgentScript('tsc', 'scripts/dev/quality/quality-agent-tsc.ts'));
if (!steps.at(-1)?.ok) finish(1);

finish(0);
