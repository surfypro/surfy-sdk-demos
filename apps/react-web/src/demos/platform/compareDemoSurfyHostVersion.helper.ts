/** Parse Surfy `version.json` shape `major.minor.build`. */
export function parseDemoSurfyAppVersion(
  raw: string | undefined,
): { major: number; minor: number; build: number } | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(trimmed);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    build: Number(match[3]),
  };
}

/** Negative if host < min, 0 if equal, positive if host > min. Null if either unparsable. */
export function compareDemoSurfyHostVersion(
  hostVersion: string | undefined,
  minHostVersion: string,
): number | null {
  const host = parseDemoSurfyAppVersion(hostVersion);
  const min = parseDemoSurfyAppVersion(minHostVersion);
  if (!host || !min) return null;
  if (host.major !== min.major) return host.major - min.major;
  if (host.minor !== min.minor) return host.minor - min.minor;
  return host.build - min.build;
}
