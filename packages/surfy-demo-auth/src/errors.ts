/**
 * Typed demo-auth errors with HTTP statuses that Cloudflare will not replace.
 *
 * Never return 502/504 from demo origin: Cloudflare treats those as gateway
 * failures and replaces the JSON body with its own error page.
 */

export type DemoAuthErrorCode =
  | 'SURFY_CONFIG'
  | 'SURFY_UPSTREAM_AUTH'
  | 'DEMO_GATE'
  | 'DEMO_AUTH_UNKNOWN';

export class SurfyConfigError extends Error {
  readonly status = 500;
  readonly code: DemoAuthErrorCode = 'SURFY_CONFIG';

  constructor(message: string) {
    super(message);
    this.name = 'SurfyConfigError';
  }
}

/** Surfy token exchange failed or auth host unreachable — still 500 (not 502). */
export class SurfyUpstreamAuthError extends Error {
  readonly status = 500;
  readonly code: DemoAuthErrorCode = 'SURFY_UPSTREAM_AUTH';

  constructor(message: string) {
    super(message);
    this.name = 'SurfyUpstreamAuthError';
  }
}

export function httpStatusFromDemoAuthError(error: unknown, fallback = 500): number {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    // Guard: never emit Cloudflare-sensitive gateway codes from demo handlers.
    return sanitizeDemoHttpStatus(status);
  }
  return fallback;
}

/**
 * Cloudflare replaces origin 502/504 with its own page — keep a JSON body visible.
 * Map those to 500; leave other statuses (401, 400, 403, 404, 5xx app) intact.
 */
export function sanitizeDemoHttpStatus(status: number): number {
  if (status === 502 || status === 504) {
    return 500;
  }
  return status;
}

export function messageFromDemoAuthError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function codeFromDemoAuthError(error: unknown): DemoAuthErrorCode {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: DemoAuthErrorCode }).code;
  }
  return 'DEMO_AUTH_UNKNOWN';
}

export function demoAuthErrorBody(error: unknown, fallbackMessage: string): {
  error: string;
  code: DemoAuthErrorCode;
} {
  return {
    error: messageFromDemoAuthError(error, fallbackMessage),
    code: codeFromDemoAuthError(error),
  };
}
