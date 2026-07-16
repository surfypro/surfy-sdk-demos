import {
  SURFY_BUILDING_LAYOUT_3D_TAG,
  SURFY_FLOOR_LAYOUT_2D_TAG,
  SURFY_FLOOR_LAYOUT_3D_TAG,
} from '@surfy/surfy-sdk';

export type DemoSectionId = 'floor-2d' | 'floor-3d' | 'building-3d';

export interface DemoSectionConfig {
  readonly id: DemoSectionId;
  readonly label: string;
  readonly tag: string;
  readonly idAttribute: 'floor-id' | 'building-id';
  readonly envKey: keyof ImportMetaEnv;
  readonly description: string;
}

export const DEMO_SECTIONS: readonly DemoSectionConfig[] = [
  {
    id: 'floor-2d',
    label: 'Étage 2D',
    tag: SURFY_FLOOR_LAYOUT_2D_TAG,
    idAttribute: 'floor-id',
    envKey: 'VITE_SURFY_FLOOR_ID',
    description: 'Plan d\'étage SVG — zoom, sélection d\'espaces, couleurs.',
  },
  {
    id: 'floor-3d',
    label: 'Étage 3D',
    tag: SURFY_FLOOR_LAYOUT_3D_TAG,
    idAttribute: 'floor-id',
    envKey: 'VITE_SURFY_FLOOR_ID',
    description: 'Vue 3D CubyV2 d\'un étage — même API couleurs et événements.',
  },
  {
    id: 'building-3d',
    label: 'Bâtiment 3D',
    tag: SURFY_BUILDING_LAYOUT_3D_TAG,
    idAttribute: 'building-id',
    envKey: 'VITE_SURFY_BUILDING_ID',
    description: 'Vue 3D CubyV2 multi-étages — endpoint layout bâtiment.',
  },
] as const;

export function isSectionTagRegistered(tag: string): boolean {
  return Boolean(customElements.get(tag));
}
