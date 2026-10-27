/**
 * Synced `@surfy/surfy-sdk` semver (from packages/surfy-sdk after `pnpm sync:sdk`).
 * Prefer this for UI that should track the library, not the demo app release.
 */
import sdkPackage from '@surfy/surfy-sdk/package.json';

export const SDK_BUNDLE_VERSION: string = sdkPackage.version;
