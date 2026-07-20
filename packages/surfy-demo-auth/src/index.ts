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
  SURFY_DEMO_SESSION_COOKIE,
} from './demoSession.js';
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
  clearCachedSurfyAccessToken,
  fetchSurfyAccessToken,
  normalizeBaseUrl,
  type FetchSurfyAccessTokenParams,
  type SurfyTokenApiResponse,
} from './fetchSurfyAccessToken.js';
