/** Copy-paste snippets for the SurfySdk high-level API. */

export function snippetMountHeader(kind: string): string {
  return [
    "import { SurfySdk } from '@surfy/surfy-sdk';",
    '',
    'const layout = SurfySdk.mount({',
    `  container: '#map',`,
    `  kind: '${kind}',`,
    '  tenant,',
    '  baseUrl,',
    '  // floorId or buildingId,',
    '  getAccessToken,',
    '});',
    '',
  ].join('\n');
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

export function snippetUpdateRoom(roomId: number, optionsLiteral: string): string {
  return `layout.updateRoom(${roomId}, ${optionsLiteral});`;
}

export function buildApiSnippetBlock(kind: string, lines: readonly string[]): string {
  const body = lines.length > 0 ? lines.join('\n') : '// Cliquez Color / Blink / Clear pour voir l’appel';
  return `${snippetMountHeader(kind)}${body}`;
}
