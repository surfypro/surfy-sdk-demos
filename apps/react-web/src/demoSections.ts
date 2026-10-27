/** Demo section registry — no `@surfy/surfy-sdk` import (keeps WC/Three out of the React-only graph). */

export type SurfyLayoutKind = 'floor-2d' | 'building-3d' | 'floor-3d';

export type DemoLayoutSectionId = SurfyLayoutKind;
export type DemoPlatformSectionId = 'platform-3d';
export type DemoSectionId = DemoLayoutSectionId | DemoPlatformSectionId | 'data-api';

export type DemoEntityKind = 'floor' | 'building' | 'none' | 'platform';

export interface DemoSectionConfig {
  readonly id: DemoSectionId;
  readonly label: string;
  readonly kind: SurfyLayoutKind | null;
  readonly entityKind: DemoEntityKind;
  readonly description: string;
}

export const DEMO_SECTIONS: readonly DemoSectionConfig[] = [
  {
    id: 'floor-2d',
    label: 'Étage 2D',
    kind: 'floor-2d',
    entityKind: 'floor',
    description: "Plan d'étage SVG — zoom, sélection d'espaces, couleurs.",
  },
  {
    id: 'building-3d',
    label: 'Bâtiment 3D',
    kind: 'building-3d',
    entityKind: 'building',
    description:
      'Vue 3D CubyV2 multi-étages (ou subset floorIds) — navigation entre étages possible.',
  },
  {
    id: 'floor-3d',
    label: 'Étage 3D',
    kind: 'floor-3d',
    entityKind: 'floor',
    description:
      'Vue 3D CubyV2 verrouillée sur un seul étage — building déduit, pas de switch interne.',
  },
  {
    id: 'platform-3d',
    label: 'Vue plateforme',
    kind: null,
    entityKind: 'platform',
    description:
      'SurfyPlatformView3dReact — même stack que building/3d-maplibre (MapLibre + Cuby, tenant). React only.',
  },
  {
    id: 'data-api',
    label: 'API data',
    kind: null,
    entityKind: 'none',
    description: 'SurfyClient.fetchEntities — app-owned typed QueryNode examples.',
  },
] as const;

export function isLayoutSection(
  section: DemoSectionConfig,
): section is DemoSectionConfig & { kind: SurfyLayoutKind; entityKind: 'floor' | 'building' } {
  return section.kind !== null && (section.entityKind === 'floor' || section.entityKind === 'building');
}

export function isPlatformSection(
  section: DemoSectionConfig,
): section is DemoSectionConfig & { id: DemoPlatformSectionId; entityKind: 'platform' } {
  return section.entityKind === 'platform' && section.id === 'platform-3d';
}

/** Layout WC kinds shipped by the demo — true without loading `@surfy/surfy-sdk` (index). */
export function isSectionKindRegistered(kind: SurfyLayoutKind): boolean {
  return kind === 'floor-2d' || kind === 'building-3d' || kind === 'floor-3d';
}

export function resolveSectionEntityId(
  section: DemoSectionConfig,
  floorId: number | undefined,
  buildingId: number | undefined,
): number | undefined {
  if (section.entityKind === 'building') return buildingId;
  if (section.entityKind === 'floor') return floorId;
  return undefined;
}
