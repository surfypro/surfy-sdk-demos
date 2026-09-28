/** Copy-paste snippets for the SurfySdk high-level API. */

export function snippetMountFloor2d(): string {
  return [
    "import { SurfySdk } from '@surfy/surfy-sdk';",
    '',
    'const layout = SurfySdk.mountFloor2d({',
    `  container: '#map',`,
    '  tenant,',
    '  baseUrl,',
    '  floorId,',
    '  getAccessToken,',
    '});',
    '',
  ].join('\n');
}

export function snippetMountBuilding3d(withFloorIds = false): string {
  return [
    "import { SurfySdk } from '@surfy/surfy-sdk';",
    '',
    'const layout = SurfySdk.mountBuilding3d({',
    `  container: '#map',`,
    '  tenant,',
    '  baseUrl,',
    '  buildingId,',
    ...(withFloorIds ? ['  floorIds: [floorId], // fetch + focus one floor',] : []),
    '  getAccessToken,',
    '});',
    '',
  ].join('\n');
}

export function snippetMountFloor3d(): string {
  return [
    "import { SurfySdk } from '@surfy/surfy-sdk';",
    '',
    'const layout = SurfySdk.mountFloor3d({',
    `  container: '#map',`,
    '  tenant,',
    '  baseUrl,',
    '  floorId,',
    '  getAccessToken,',
    '});',
    '',
  ].join('\n');
}

export function snippetMountHeader(kind: 'floor-2d' | 'building-3d' | 'floor-3d'): string {
  if (kind === 'building-3d') return snippetMountBuilding3d();
  if (kind === 'floor-3d') return snippetMountFloor3d();
  return snippetMountFloor2d();
}

export function snippetSetRoomColors(roomId: number, color: string): string {
  return `layout.setRoomColors({ ${roomId}: '${color}' });`;
}

export function snippetClearRoomColors(): string {
  return 'layout.clearRoomColors();';
}

export function snippetSetTheme(themeLiteral: string): string {
  return `layout.setTheme(${themeLiteral});`;
}

export function snippetClearTheme(): string {
  return 'layout.setTheme(null);';
}

export function snippetSetOptions(optionsLiteral: string): string {
  return `layout.setOptions(${optionsLiteral});`;
}

export function snippetFitToView(): string {
  return 'layout.fitToView();';
}

export function snippetZoomOnRoom(roomId: number, diameterMeters = 5): string {
  return `layout.zoomOn({ roomId: ${roomId}, diameterMeters: ${diameterMeters} });`;
}

export function snippetUpdateRoom(roomId: number, optionsLiteral: string): string {
  return `layout.updateRoom(${roomId}, ${optionsLiteral});`;
}

export function buildApiSnippetBlock(
  kind: 'floor-2d' | 'building-3d' | 'floor-3d',
  lines: readonly string[],
): string {
  const body = lines.length > 0 ? lines.join('\n') : '// Cliquez Color / Blink / Clear pour voir l’appel';
  return `${snippetMountHeader(kind)}${body}`;
}
