/**
 * Source de vérité : chaque entrée = une capacité publique SDK démontrée ou testée en E2E.
 * - `coveredBy` : spec dédiée existante (le gate vérifie que le fichier existe).
 * - sans `coveredBy` : implémentée dans `sdk-coverage.spec.ts`.
 */
export type SdkFeatureCategory =
  | 'facade'
  | 'layout'
  | 'building-3d'
  | 'events'
  | 'data'
  | 'auth';

export interface SdkFeatureEntry {
  readonly id: string;
  readonly category: SdkFeatureCategory;
  readonly description: string;
  readonly coveredBy?: string;
}

export const SDK_FEATURE_MANIFEST: readonly SdkFeatureEntry[] = [
  // —— SurfySdk facade ——
  {
    id: 'SurfySdk.version',
    category: 'facade',
    description: 'Expose la semver du bundle SDK',
  },
  {
    id: 'SurfySdk.tagForKind',
    category: 'facade',
    description: 'Résout le tag Web Component pour floor-2d / building-3d / floor-3d',
  },
  {
    id: 'SurfySdk.isKindRegistered',
    category: 'facade',
    description: 'Vérifie l’enregistrement des custom elements',
  },
  {
    id: 'SurfySdk.mountFloor2d',
    category: 'facade',
    description: 'Monte un plan 2D dans le conteneur hôte',
    coveredBy: 'sdk.spec.ts',
  },
  {
    id: 'SurfySdk.mountBuilding3d',
    category: 'facade',
    description: 'Monte un bâtiment 3D Cuby dans le conteneur hôte',
    coveredBy: 'building-3d.spec.ts',
  },
  {
    id: 'SurfySdk.mountFloor3d',
    category: 'facade',
    description: 'Monte un étage 3D Cuby verrouillé (floor-3d)',
    coveredBy: 'sections.spec.ts',
  },

  // —— SurfyLayout handle ——
  {
    id: 'SurfyLayout.setRoomColors',
    category: 'layout',
    description: 'Applique des couleurs par roomId',
    coveredBy: 'room-color.spec.ts',
  },
  {
    id: 'SurfyLayout.clearRoomColors',
    category: 'layout',
    description: 'Efface les surcharges de couleur',
    coveredBy: 'room-color.spec.ts',
  },
  {
    id: 'SurfyLayout.setTheme',
    category: 'layout',
    description: 'Applique un thème hôte (primary / tooltip / surfaces)',
  },
  {
    id: 'SurfyLayout.setFillParent',
    category: 'layout',
    description: 'Active ou désactive fill-parent sur le custom element',
  },
  {
    id: 'SurfyLayout.fitToView',
    category: 'layout',
    description: 'Recadre la vue (SVG 2D / caméra 3D)',
    coveredBy: 'layout-view.spec.ts',
  },
  {
    id: 'SurfyLayout.zoomOn',
    category: 'layout',
    description: 'Zoom métrique sur un espace (diameterMeters)',
    coveredBy: 'layout-view.spec.ts',
  },
  {
    id: 'SurfyLayout.getRenderedRoomIds',
    category: 'layout',
    description: 'Liste les roomId rendus dans le DOM embed',
  },
  {
    id: 'SurfyLayout.setEntityId',
    category: 'layout',
    description: 'Met à jour floor-id / building-id sur le layout monté',
  },
  {
    id: 'SurfyLayout.destroy',
    category: 'layout',
    description: 'Démonte le layout et retire le custom element',
  },

  // —— Building 3D ——
  {
    id: 'SurfyLayout.setOptions',
    category: 'building-3d',
    description: 'Options 3D (espacement, labels, murs, navigation, étages)',
  },
  {
    id: 'SurfyLayout.updateRoom',
    category: 'building-3d',
    description: 'Mise à jour partielle d’un espace (couleur, showLabel)',
  },
  {
    id: 'SurfyBuildingLayout3dElement.setFetchFloorIds',
    category: 'building-3d',
    description: 'Restreint le fetch layout aux floorIds fournis',
  },

  // —— Events ——
  {
    id: 'surfy:ready',
    category: 'events',
    description: 'Émis quand le layout est prêt',
    coveredBy: 'sdk.spec.ts',
  },
  {
    id: 'surfy:room-hover',
    category: 'events',
    description: 'Émis au survol d’un espace (detail ou null)',
  },
  {
    id: 'surfy:room-selected',
    category: 'events',
    description: 'Émis au clic sur un espace',
  },

  // —— Data client ——
  {
    id: 'SurfyClient.fetchEntities.buildings',
    category: 'data',
    description: 'fetchEntities avec QueryNode bâtiments',
  },
  {
    id: 'SurfyClient.fetchEntities.floors',
    category: 'data',
    description: 'fetchEntities avec QueryNode étages',
  },
  {
    id: 'SurfyClient.fetchEntities.rooms',
    category: 'data',
    description: 'fetchEntities avec QueryNode espaces',
  },

  // —— Auth ——
  {
    id: 'demo-server.session',
    category: 'auth',
    description: 'Session HttpOnly + proxy Bearer sans JWT dans le navigateur',
    coveredBy: 'auth.spec.ts',
  },
] as const;

export const SDK_FEATURE_IDS = SDK_FEATURE_MANIFEST.map((entry) => entry.id);

export function manifestEntriesForSdkCoverageSpec(): SdkFeatureEntry[] {
  return SDK_FEATURE_MANIFEST.filter((entry) => !entry.coveredBy);
}
