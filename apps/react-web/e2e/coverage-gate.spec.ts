import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { SDK_FEATURE_MANIFEST, manifestEntriesForSdkCoverageSpec } from './sdkFeatureManifest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gate CI : 100 % des entrées du manifeste SDK ont une couverture E2E déclarée.
 * Les entrées sans `coveredBy` doivent avoir un test dans `sdk-coverage.spec.ts`.
 */
test.describe('SDK feature coverage gate', () => {
  test('manifest entries with coveredBy point to existing spec files', () => {
    for (const entry of SDK_FEATURE_MANIFEST) {
      if (!entry.coveredBy) {
        continue;
      }
      const specPath = path.join(__dirname, entry.coveredBy);
      expect(
        existsSync(specPath),
        `Missing spec file for ${entry.id}: ${entry.coveredBy}`,
      ).toBe(true);
    }
  });

  test('every manifest feature is assigned to sdk-coverage or another spec', () => {
    const unassigned = SDK_FEATURE_MANIFEST.filter((entry) => !entry.coveredBy);
    const sdkCoverageSpec = path.join(__dirname, 'sdk-coverage.spec.ts');
    expect(existsSync(sdkCoverageSpec)).toBe(true);

    // Chaque entrée sans coveredBy doit être listée dans sdk-coverage (fichier dédié).
    expect(unassigned.length, 'sdk-coverage.spec.ts workload').toBeGreaterThan(0);
    for (const entry of unassigned) {
      expect(entry.id).toBeTruthy();
    }
  });

  test('sdk-coverage.spec implements all unassigned manifest ids', async () => {
    const specSource = await import('node:fs/promises').then((fs) =>
      fs.readFile(path.join(__dirname, 'sdk-coverage.spec.ts'), 'utf8'),
    );
    const missing = manifestEntriesForSdkCoverageSpec().filter(
      (entry) => !specSource.includes(`case '${entry.id}':`),
    );
    expect(
      missing.map((entry) => entry.id),
      `Add test cases in sdk-coverage.spec.ts for: ${missing.map((e) => e.id).join(', ')}`,
    ).toEqual([]);
  });
});
