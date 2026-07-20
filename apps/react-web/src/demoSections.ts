import type { SurfyLayoutKind } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

export type DemoSectionId = SurfyLayoutKind;

export type DemoEntityKind = 'floor' | 'building';

export interface DemoSectionConfig {
  readonly id: DemoSectionId;
  readonly label: string;
  readonly kind: SurfyLayoutKind;
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
    id: 'floor-3d',
    label: 'Étage 3D',
    kind: 'floor-3d',
    entityKind: 'floor',
    description: "Vue 3D CubyV2 d'un étage — même API couleurs et événements.",
  },
  {
    id: 'building-3d',
    label: 'Bâtiment 3D',
    kind: 'building-3d',
    entityKind: 'building',
    description: 'Vue 3D CubyV2 multi-étages — endpoint layout bâtiment.',
  },
] as const;

export function isSectionKindRegistered(kind: SurfyLayoutKind): boolean {
  return SurfySdk.isKindRegistered(kind);
}

export function resolveSectionEntityId(
  section: DemoSectionConfig,
  floorId: number | undefined,
  buildingId: number | undefined,
): number | undefined {
  return section.entityKind === 'building' ? buildingId : floorId;
}
