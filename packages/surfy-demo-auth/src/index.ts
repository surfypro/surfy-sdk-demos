export {
  assertDemoGate,
  DemoGateError,
  loadSurfyDemoAuthEnv,
  type SurfyDemoAuthEnv,
} from './config.js';
export {
  normalizeConnectionStringRaw,
  parseSurfyConnectionString,
  readEndpointFromConnectionString,
  readHostFromConnectionString,
  type SurfyApiConnectionString,
} from './connectionString.js';
export {
  isDemoProxyBearer,
  SURFY_DEMO_PROXY_BEARER,
  SURFY_DEMO_PROXY_PATH_PREFIX,
  SURFY_DEMO_SESSION_COOKIE,
} from './demoSession.js';
export {
  forwardSurfyProxyRequest,
  resolveSurfyProxyUpstreamPath,
  SURFY_DEMO_API_ORIGIN_HEADER,
  SURFY_DEMO_API_ORIGIN_QUERY,
  type SurfyProxyForwardInput,
  type SurfyProxyForwardResult,
} from './surfyProxy.js';
export {
  codeFromDemoAuthError,
  demoAuthErrorBody,
  httpStatusFromDemoAuthError,
  messageFromDemoAuthError,
  sanitizeDemoHttpStatus,
  SurfyConfigError,
  SurfyUpstreamAuthError,
  type DemoAuthErrorCode,
} from './errors.js';
export {
  createDemoProxyRateLimiter,
  TokenBucketRateLimiter,
  type DemoProxyRateLimiter,
  type DemoRateLimitDecision,
  type RateLimitResult,
  type TokenBucketOptions,
} from './rateLimiter.js';
export {
  createSurfyDemoSessionToken,
  verifySurfyDemoSessionToken,
  SURFY_DEMO_SESSION_TTL_MS,
  type SessionTokenOptions,
} from './sessionToken.js';
export {
  clearCachedSurfyAccessToken,
  fetchSurfyAccessToken,
  normalizeBaseUrl,
  type FetchSurfyAccessTokenParams,
  type SurfyTokenApiResponse,
} from './fetchSurfyAccessToken.js';
