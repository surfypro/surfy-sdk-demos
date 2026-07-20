/**
 * Surfy API credentials as a single connection string.
 *
 * Format (semicolon-separated, snake_case keys):
 *   host=https://app.example.surfy.pro;client_id=<tenant>;client_secret=<api-key>
 *
 * Also accepted (aliases): endpoint / clientId / clientSecret (E2E-style).
 */

import { SurfyConfigError } from './errors.js';

export interface SurfyApiConnectionString {
  readonly host: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

const HOST_KEYS = new Set(['host', 'endpoint']);
const CLIENT_ID_KEYS = new Set(['client_id', 'clientid']);
const CLIENT_SECRET_KEYS = new Set(['client_secret', 'clientsecret']);

interface ParseState {
  host?: string;
  clientId?: string;
  clientSecret?: string;
}

/** Strip wrapping quotes / whitespace Netlify UI often adds around env values. */
export function normalizeConnectionStringRaw(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function looksLikeAbsoluteUrl(piece: string): boolean {
  return /^https?:\/\//i.test(piece);
}

function parseKeyValueSegment(piece: string): { key: string; value: string } {
  const separatorIndex = piece.indexOf('=');
  if (separatorIndex <= 0) {
    if (looksLikeAbsoluteUrl(piece)) {
      throw new SurfyConfigError(
        `Invalid segment "${piece}" in Surfy connection string — use host=${piece} (key=value)`,
      );
    }
    throw new SurfyConfigError(
      `Invalid segment "${piece}" in Surfy connection string (expected key=value)`,
    );
  }
  const key = piece.slice(0, separatorIndex).trim().toLowerCase();
  const value = piece.slice(separatorIndex + 1).trim();
  if (!value) {
    throw new SurfyConfigError(`Missing value for "${key}" in Surfy connection string`);
  }
  return { key, value };
}

function applyKey(state: ParseState, key: string, value: string): void {
  if (HOST_KEYS.has(key)) {
    state.host = value.replace(/\/$/, '');
    return;
  }
  if (CLIENT_ID_KEYS.has(key)) {
    state.clientId = value;
    return;
  }
  if (CLIENT_SECRET_KEYS.has(key)) {
    state.clientSecret = value;
    return;
  }
  throw new SurfyConfigError(
    `Unknown key "${key}" in Surfy connection string (expected host, client_id, client_secret)`,
  );
}

function requireFields(state: ParseState): SurfyApiConnectionString {
  if (!state.host) {
    throw new SurfyConfigError('Surfy connection string must include host=');
  }
  if (!state.clientId) {
    throw new SurfyConfigError('Surfy connection string must include client_id=');
  }
  if (!state.clientSecret) {
    throw new SurfyConfigError('Surfy connection string must include client_secret=');
  }
  return {
    host: state.host,
    clientId: state.clientId,
    clientSecret: state.clientSecret,
  };
}

export function parseSurfyConnectionString(raw: string): SurfyApiConnectionString {
  const trimmed = normalizeConnectionStringRaw(raw);
  if (!trimmed) {
    throw new SurfyConfigError('Surfy connection string is empty');
  }

  const state: ParseState = {};
  for (const segment of trimmed.split(';')) {
    const piece = segment.trim();
    if (!piece) continue;
    const { key, value } = parseKeyValueSegment(piece);
    applyKey(state, key, value);
  }

  return requireFields(state);
}

/** Extract `host=` / `endpoint=` without requiring a full parse (Vite proxy helper). */
export function readHostFromConnectionString(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return parseSurfyConnectionString(raw).host;
  } catch {
    return undefined;
  }
}

/** @deprecated Prefer readHostFromConnectionString */
export function readEndpointFromConnectionString(raw: string | undefined): string | undefined {
  return readHostFromConnectionString(raw);
}
