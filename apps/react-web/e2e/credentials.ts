/** True when demo-server can mint tokens (connection string or legacy discrete secrets). */
export function hasSurfySdkCredentials(): boolean {
  if (process.env.SURFY_CONNECTION_STRING?.trim() || process.env.SURFY_API_CONNECTION_STRING?.trim()) {
    return true;
  }
  return Boolean(
    (process.env.SURFY_BASE_URL || process.env.VITE_SURFY_BASE_URL) &&
      (process.env.SURFY_CLIENT_ID || process.env.VITE_SURFY_TENANT) &&
      (process.env.SURFY_CLIENT_SECRET || process.env.VITE_SURFY_TOKEN),
  );
}

export const SDK_CREDENTIALS_HINT =
  'Set SURFY_CONNECTION_STRING=host=…;client_id=…;client_secret=… in apps/demo-server/.env';
