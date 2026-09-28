import type { SurfyLayoutKind } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

export type DemoLayoutSectionId = SurfyLayoutKind;
export type DemoSectionId = DemoLayoutSectionId | 'data-api';

export type DemoEntityKind = 'floor' | 'building' | 'none';

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
  return section.kind !== null && section.entityKind !== 'none';
}

export function isSectionKindRegistered(kind: SurfyLayoutKind): boolean {
  return SurfySdk.isKindRegistered(kind);
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
