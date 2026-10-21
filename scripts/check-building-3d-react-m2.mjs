#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const panel = fs.readFileSync(
  path.join(root, 'apps/react-web/src/demos/layout/building-3d/Building3dDemoPanel.tsx'),
  'utf8',
);
const host = fs.readFileSync(
  path.join(root, 'apps/react-web/src/demos/layout/shared/DemoReactLayoutHost.tsx'),
  'utf8',
);

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    process.exit(1);
  }
}

assert(host.includes('forwardRef'), 'host forwardRef');
assert(host.includes('onRoomHover'), 'host onRoomHover');
assert(host.includes('onRoomSelected'), 'host onRoomSelected');
assert(host.includes('layout3dOptions'), 'host layout3dOptions');
assert(panel.includes('reactLayoutRef'), 'panel reactLayoutRef');
assert(panel.includes('setOptions'), 'panel setOptions');
assert(panel.includes('onRoomHover={reactListeners.onRoomHover}'), 'panel hover wiring');
assert(panel.includes('onRoomSelected={reactListeners.onRoomSelected}'), 'panel select wiring');
assert(!/pathfind|routeur|wayfind/i.test(panel), 'panel no routing UI');
assert(!/pathfind|routeur|wayfind/i.test(host), 'host no routing UI');
console.log('OK building-3d React M2 host hygiene');
