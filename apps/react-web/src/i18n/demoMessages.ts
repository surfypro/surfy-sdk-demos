export type DemoLocale = 'fr' | 'en';

const messages = {
  fr: {
    'app.title': 'Démo Surfy SDK',
    'app.routesHint':
      'Routes : /api|oauth/react-web|react-native/… Mode API : session HttpOnly + proxy /proxy/api/v1.',
    'auth.api': 'API (serveur)',
    'auth.oauth': 'OAuth / Entra',
    'nav.auth': "Mode d'authentification",
    'nav.host': 'Hôte de démo',
    'nav.sections': 'Composants SDK',
    'nav.apiFamilies': 'Familles d’API',
    'nav.apiComponents': 'API composants',
    'nav.apiData': 'API data',
    'workbench.intro':
      'Mode API : session HttpOnly + proxy /proxy (le JWT Surfy ne quitte pas le serveur).',
    'workbench.loading': 'Chargement des bâtiments…',
    'workbench.tenant': 'Tenant',
    'workbench.session': 'session API (proxy)',
    'workbench.noFloors': "Ce bâtiment n'a pas d'étage.",
    'oauth.comingSoon':
      'Mode OAuth / Entra OBO — à venir. Pour l’instant, utilisez le mode API (session serveur + proxy).',
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
    'locale.fr': 'FR',
    'locale.en': 'EN',
  },
  en: {
    'app.title': 'Surfy SDK Demo',
    'app.routesHint':
      'Routes: /api|oauth/react-web|react-native/… API mode: HttpOnly session + /proxy/api/v1.',
    'auth.api': 'API (server)',
    'auth.oauth': 'OAuth / Entra',
    'nav.auth': 'Authentication mode',
    'nav.host': 'Demo host',
    'nav.sections': 'SDK components',
    'nav.apiFamilies': 'API families',
    'nav.apiComponents': 'Component API',
    'nav.apiData': 'Data API',
    'workbench.intro':
      'API mode: HttpOnly session + /proxy (Surfy JWT never leaves the server).',
    'workbench.loading': 'Loading buildings…',
    'workbench.tenant': 'Tenant',
    'workbench.session': 'API session (proxy)',
    'workbench.noFloors': 'This building has no floors.',
    'oauth.comingSoon':
      'OAuth / Entra OBO mode — coming soon. For now, use API mode (server session + proxy).',
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
