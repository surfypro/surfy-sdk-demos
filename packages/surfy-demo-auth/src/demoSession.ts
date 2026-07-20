/** Opaque value the browser may send; proxy replaces it with the real Surfy JWT. */
export const SURFY_DEMO_PROXY_BEARER = 'surfy-demo-proxy';

export const SURFY_DEMO_SESSION_COOKIE = 'surfy_demo_session';

export function isDemoProxyBearer(authorizationHeader: string | null | undefined): boolean {
  if (!authorizationHeader) return true;
  const value = authorizationHeader.trim();
  if (!value.toLowerCase().startsWith('bearer ')) return false;
  const token = value.slice('bearer '.length).trim();
  return token === '' || token === SURFY_DEMO_PROXY_BEARER;
}
