export {
  assertDemoGate,
  DemoGateError,
  loadSurfyDemoAuthEnv,
  type SurfyDemoAuthEnv,
} from './config.js';
export {
  parseSurfyConnectionString,
  readEndpointFromConnectionString,
  readHostFromConnectionString,
  type SurfyApiConnectionString,
} from './connectionString.js';
export {
  clearCachedSurfyAccessToken,
  fetchSurfyAccessToken,
  normalizeBaseUrl,
  type FetchSurfyAccessTokenParams,
  type SurfyTokenApiResponse,
} from './fetchSurfyAccessToken.js';
