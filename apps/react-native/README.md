# React Native demo (deferred)

The in-browser **React Native WebView simulator** was removed from `apps/react-web`.

Auth for the public demo is **API server session + proxy only** (no Entra/OAuth UI).

Routes are now `/:section` (e.g. `/floor-2d`, `/platform-3d`). Legacy
`/api|oauth/react-web|react-native/:section` URLs redirect to `/:section`.

A real Expo / RN app can still load the web demo later, e.g. `https://…/floor-2d`.
