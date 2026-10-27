export type DemoLocale = 'fr' | 'en';

const messages = {
  fr: {
    'app.title': 'Démo Surfy SDK',
    'nav.sections': 'Composants SDK',
    'workbench.loading': 'Chargement des bâtiments…',
    'workbench.tenant': 'Tenant',
    'workbench.noFloors': "Ce bâtiment n'a pas d'étage.",
    'layout.unavailable':
      "Ce kind n'est pas encore enregistré dans le bundle SDK. La section sera activée à la publication.",
    'layout.noEntity': 'Sélectionnez un bâtiment et un étage dans la liste ci-dessus.',
    'layout.lastEvent': 'Dernier événement',
    'layout.colorRoom': 'Colorier l’espace',
    'layout.colorRoomId': 'Colorier l’espace {id}',
    'layout.randomBlink': 'Clignotement aléatoire',
    'layout.stopBlink': 'Arrêter le clignotement',
    'layout.clearColors': 'Effacer les couleurs',
    'layout.fitToView': 'Ajuster la vue',
    'layout.zoomOnRoom': 'Zoomer sur l’espace (5 m)',
    'layout.zoomOnRoomId': 'Zoomer sur l’espace {id} (5 m)',
    'layout.pinRandomRoom': 'Pin sur un espace random',
    'layout.pinRandomPlan': 'Pin n’importe où sur le plan',
    'layout.clearPins': 'Effacer les pins',
    'layout.fillParent': 'Remplir le conteneur parent',
    'layout.snippetTitle': 'Appel SurfySdk — copiable',
    'layout.copy': 'Copier',
    'layout.copied': 'Copié',
    'layout.copyFail': 'Échec copie',
    'data.title': 'API data (QueryNode)',
    'data.description':
      'SurfyClient.fetchEntities(queryNode) — QueryNode métier défini dans l’app (pas dans le SDK). Les IDs viennent du résultat précédent.',
    'data.fetchBuildings': '1. fetchEntities · bâtiments',
    'data.fetchFloors': '2. fetchEntities · étages',
    'data.fetchRooms': '3. fetchEntities · espaces',
    'data.needBuilding': 'Lancez d’abord l’exemple bâtiments pour obtenir un buildingId.',
    'data.needFloor': 'Lancez l’exemple étages pour obtenir un floorId.',
    'data.scopeFromResult': 'Scope issu du résultat : buildingId={buildingId}, floorId={floorId}',
    'data.snippetTitle': 'Code SDK — copiable',
    'data.result': 'Résultat JSON',
    'platform.ready': 'prêt',
    'platform.loading': 'chargement…',
    'platform.liveApiNote':
      'Données live : GetVision / GetBuildingDetail via /proxy (RPC) — stack building/3d-maplibre.',
    'platform.fixturesNote':
      'Mode fixtures (host Surfy trop ancien ou check version KO) — MapLibre/Cuby restent démontrables.',
    'platform.hostVersionOk': 'Host Surfy {host} ≥ {min} — API live.',
    'platform.hostVersionIncompatible':
      'Host Surfy {host} < {min} requis par SDK {sdk} — bascule fixtures. Redéployer Surfy (version.json) puis réessayer.',
    'platform.hostVersionCheckFailed':
      'Check version Surfy impossible ({detail}) — bascule fixtures.',
    'platform.buildingsFromApi': 'Bâtiments (vision API)',
    'platform.noBuildings': 'Aucun bâtiment dans la vision.',
    'platform.floorsFromDetail': 'Étages (detail hydraté)',
    'platform.noFloors': 'Aucun étage — sélectionnez un bâtiment d’abord.',
    'platform.hostChromeNote':
      'Chrome hôte : listes bâtiments / étages / inject geo pilotent le SDK via hooks publics (pas de drawers produit embarqués).',
    'platform.noGpsHint': 'Pas de GPS — sélection sans vol caméra',
    'platform.altitudeHint': 'étage estimé → espace',
    'platform.injectAltitude': 'Injecter Position par altitude',
    'platform.lastGeo': 'Dernier résultat geo',
    'platform.events': 'Events',
    'platform.cubyHydrateError':
      'Impossible de charger le bâtiment 3D (Cuby). Aucun cube de remplacement — réessayez ou choisissez un autre bâtiment.',
    'platform.cubyHydrateErrorDetail': 'Détail : {detail}',
    'locale.fr': 'FR',
    'locale.en': 'EN',
  },
  en: {
    'app.title': 'Surfy SDK Demo',
    'nav.sections': 'SDK components',
    'workbench.loading': 'Loading buildings…',
    'workbench.tenant': 'Tenant',
    'workbench.noFloors': 'This building has no floors.',
    'layout.unavailable':
      'This kind is not registered in the SDK bundle yet. The section will activate when published.',
    'layout.noEntity': 'Select a building and floor in the list above.',
    'layout.lastEvent': 'Last event',
    'layout.colorRoom': 'Color room',
    'layout.colorRoomId': 'Color room {id}',
    'layout.randomBlink': 'Random blink',
    'layout.stopBlink': 'Stop random blink',
    'layout.clearColors': 'Clear colors',
    'layout.fitToView': 'Fit to view',
    'layout.zoomOnRoom': 'Zoom on room (5 m)',
    'layout.zoomOnRoomId': 'Zoom on room {id} (5 m)',
    'layout.pinRandomRoom': 'Pin on random room',
    'layout.pinRandomPlan': 'Pin anywhere on plan',
    'layout.clearPins': 'Clear pins',
    'layout.fillParent': 'Fill parent container',
    'layout.snippetTitle': 'SurfySdk call — copyable',
    'layout.copy': 'Copy',
    'layout.copied': 'Copied',
    'layout.copyFail': 'Copy failed',
    'data.title': 'Data API (QueryNode)',
    'data.description':
      'SurfyClient.fetchEntities(queryNode) — business QueryNode defined in the app (not in the SDK). IDs come from the previous result.',
    'data.fetchBuildings': '1. fetchEntities · buildings',
    'data.fetchFloors': '2. fetchEntities · floors',
    'data.fetchRooms': '3. fetchEntities · rooms',
    'data.needBuilding': 'Run the buildings example first to get a buildingId.',
    'data.needFloor': 'Run the floors example to get a floorId.',
    'data.scopeFromResult': 'Scope from result: buildingId={buildingId}, floorId={floorId}',
    'data.snippetTitle': 'SDK code — copyable',
    'data.result': 'JSON result',
    'platform.ready': 'ready',
    'platform.loading': 'loading…',
    'platform.liveApiNote':
      'Live data: GetVision / GetBuildingDetail via /proxy (RPC) — same stack as building/3d-maplibre.',
    'platform.fixturesNote':
      'Fixture mode (Surfy host too old or version check failed) — MapLibre/Cuby still demonstrable.',
    'platform.hostVersionOk': 'Surfy host {host} ≥ {min} — live API.',
    'platform.hostVersionIncompatible':
      'Surfy host {host} < {min} required by SDK {sdk} — using fixtures. Redeploy Surfy (version.json) then retry.',
    'platform.hostVersionCheckFailed':
      'Surfy version check failed ({detail}) — using fixtures.',
    'platform.buildingsFromApi': 'Buildings (vision API)',
    'platform.noBuildings': 'No buildings in vision.',
    'platform.floorsFromDetail': 'Floors (hydrated detail)',
    'platform.noFloors': 'No floors — select a building first.',
    'platform.hostChromeNote':
      'Host chrome: building / floor lists and inject-geo drive the SDK via public hooks (no packaged product drawers).',
    'platform.noGpsHint': 'No GPS — select without camera fly',
    'platform.altitudeHint': 'estimated floor → space',
    'platform.injectAltitude': 'Inject Position from altitude',
    'platform.lastGeo': 'Last geo result',
    'platform.events': 'Events',
    'platform.cubyHydrateError':
      'Could not load the 3D building (Cuby). No placeholder cube — retry or pick another building.',
    'platform.cubyHydrateErrorDetail': 'Detail: {detail}',
    'locale.fr': 'FR',
    'locale.en': 'EN',
  },
} as const;

export type DemoMessageKey = keyof (typeof messages)['fr'];

export function translate(
  locale: DemoLocale,
  key: DemoMessageKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = messages[locale][key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
