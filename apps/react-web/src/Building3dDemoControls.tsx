import { useEffect, useState } from 'react';
import type {
  SurfyLayout3dControls,
  SurfyLayout3dOptions,
  SurfyLayout3dWallMode,
  SurfyLayout3dZoomMode,
  SurfyRoomUpdateOptions,
} from '@surfy/surfy-sdk';

import {
  CONTROLS_OPTIONS,
  createInitialBuilding3dPanelState,
  WALL_MODE_OPTIONS,
} from './building3dDemo.constants';
import type { DemoFloor } from './fetchDemoCatalog';

const DEMO_ROOM_COLOR = '#2196F3';

interface Building3dDemoControlsProps {
  readonly buildingFloors: readonly DemoFloor[];
  readonly demoRoomId: number | undefined;
  readonly onApplyOptions: (patch: SurfyLayout3dOptions) => void;
  readonly onUpdateRoom: (roomId: number, options: SurfyRoomUpdateOptions) => void;
  readonly onFitToView: () => void;
  readonly onLogUpdateRoom: (roomId: number, optionsLiteral: string) => void;
}

export function Building3dDemoControls({
  buildingFloors,
  demoRoomId,
  onApplyOptions,
  onUpdateRoom,
  onFitToView,
  onLogUpdateRoom,
}: Building3dDemoControlsProps) {
  const floorIdsKey = buildingFloors.map((floor) => floor.id).join(',');
  const [state, setState] = useState(() =>
    createInitialBuilding3dPanelState(buildingFloors.map((floor) => floor.id)),
  );

  useEffect(() => {
    const nextFloorIds =
      floorIdsKey.length === 0 ? [] : floorIdsKey.split(',').map((id) => Number(id));
    setState(createInitialBuilding3dPanelState(nextFloorIds));
  }, [floorIdsKey]);

  const {
    floorSpace,
    showRoomLabels,
    showFloorLabels,
    roomShowLabel,
    selectedFloorIds,
    wallMode,
    showStructureWalls,
    structureFloorIds,
    singleControls,
    singleZoomMode,
    multiControls,
    multiZoomMode,
  } = state;

  return (
    <div className="demo-3d-controls" data-testid="demo-3d-controls">
      <h3>Options 3D</h3>
      <label className="demo-3d-controls__row">
        <span>Espacement étages ({floorSpace})</span>
        <input
          type="range"
          min={0}
          max={800}
          step={40}
          value={floorSpace}
          data-testid="demo-floor-space"
          onChange={(event) => {
            const next = Number(event.target.value);
            setState((prev) => ({ ...prev, floorSpace: next }));
            onApplyOptions({ floorSpace: next });
          }}
        />
      </label>
      <label className="demo-3d-controls__row">
        <input
          type="checkbox"
          checked={showRoomLabels}
          data-testid="demo-show-room-labels"
          onChange={(event) => {
            const next = event.target.checked;
            setState((prev) => ({ ...prev, showRoomLabels: next }));
            onApplyOptions({ showRoomLabels: next });
          }}
        />
        Libellés des espaces (global)
      </label>
      <label className="demo-3d-controls__row">
        <input
          type="checkbox"
          checked={showFloorLabels}
          data-testid="demo-show-floor-labels"
          onChange={(event) => {
            const next = event.target.checked;
            setState((prev) => ({ ...prev, showFloorLabels: next }));
            onApplyOptions({ showFloorLabels: next });
          }}
        />
        Libellés des étages
      </label>

      <h3>Étages visibles</h3>
      <div className="demo-3d-controls__floor-list" data-testid="demo-floor-visibility">
        {buildingFloors.map((floor) => {
          const checked = selectedFloorIds.includes(floor.id);
          return (
            <label key={floor.id} className="demo-3d-controls__row">
              <input
                type="checkbox"
                checked={checked}
                data-testid={`demo-floor-visible-${floor.id}`}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selectedFloorIds, floor.id]
                    : selectedFloorIds.filter((id) => id !== floor.id);
                  if (next.length === 0) return;
                  setState((prev) => ({ ...prev, selectedFloorIds: next }));
                  onApplyOptions({ selectedFloorIds: next });
                }}
              />
              {floor.name} <code>({floor.id})</code>
            </label>
          );
        })}
      </div>

      <label className="demo-3d-controls__row">
        <span>Wall mode</span>
        <select
          value={wallMode}
          data-testid="demo-wall-mode"
          onChange={(event) => {
            const next = event.target.value as SurfyLayout3dWallMode;
            setState((prev) => ({ ...prev, wallMode: next }));
            onApplyOptions({ wallMode: next });
          }}
        >
          {WALL_MODE_OPTIONS.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      <h3>Structure</h3>
      <label className="demo-3d-controls__row">
        <input
          type="checkbox"
          checked={showStructureWalls}
          data-testid="demo-show-structure-walls"
          onChange={(event) => {
            const next = event.target.checked;
            setState((prev) => ({ ...prev, showStructureWalls: next }));
            onApplyOptions({ showStructureWalls: next });
          }}
        />
        Afficher les structures
      </label>
      {showStructureWalls ? (
        <div className="demo-3d-controls__floor-list" data-testid="demo-structure-floors">
          {buildingFloors.map((floor) => {
            const checked = structureFloorIds.includes(floor.id);
            return (
              <label key={floor.id} className="demo-3d-controls__row">
                <input
                  type="checkbox"
                  checked={checked}
                  data-testid={`demo-structure-floor-${floor.id}`}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...structureFloorIds, floor.id]
                      : structureFloorIds.filter((id) => id !== floor.id);
                    setState((prev) => ({ ...prev, structureFloorIds: next }));
                    onApplyOptions({ structureFloorIds: next });
                  }}
                />
                Structure · {floor.name}
              </label>
            );
          })}
        </div>
      ) : null}

      <h3>Navigation</h3>
      <p className="demo-3d-controls__hint">
        Preset actif : <strong>{selectedFloorIds.length === 1 ? '1 étage' : 'multi-étages'}</strong>
      </p>
      <fieldset className="demo-3d-controls__fieldset">
        <legend>1 étage sélectionné</legend>
        <label className="demo-3d-controls__row">
          <span>Controls</span>
          <select
            value={singleControls}
            data-testid="demo-single-controls"
            onChange={(event) => {
              const next = event.target.value as SurfyLayout3dControls;
              setState((prev) => ({ ...prev, singleControls: next }));
              onApplyOptions({ singleFloorNavigation: { controls: next } });
            }}
          >
            {CONTROLS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="demo-3d-controls__row">
          <span>Zoom mode</span>
          <select
            value={singleZoomMode}
            data-testid="demo-single-zoom-mode"
            onChange={(event) => {
              const next = event.target.value as SurfyLayout3dZoomMode;
              setState((prev) => ({ ...prev, singleZoomMode: next }));
              onApplyOptions({ singleFloorNavigation: { zoomMode: next } });
              onFitToView();
            }}
          >
            <option value="zenith">zenith (vue du dessus)</option>
            <option value="isometric">isometric (vue 3/4)</option>
          </select>
        </label>
      </fieldset>
      <fieldset className="demo-3d-controls__fieldset">
        <legend>Plusieurs étages</legend>
        <label className="demo-3d-controls__row">
          <span>Controls</span>
          <select
            value={multiControls}
            data-testid="demo-multi-controls"
            onChange={(event) => {
              const next = event.target.value as SurfyLayout3dControls;
              setState((prev) => ({ ...prev, multiControls: next }));
              onApplyOptions({ multiFloorNavigation: { controls: next } });
            }}
          >
            {CONTROLS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="demo-3d-controls__row">
          <span>Zoom mode</span>
          <select
            value={multiZoomMode}
            data-testid="demo-multi-zoom-mode"
            onChange={(event) => {
              const next = event.target.value as SurfyLayout3dZoomMode;
              setState((prev) => ({ ...prev, multiZoomMode: next }));
              onApplyOptions({ multiFloorNavigation: { zoomMode: next } });
              onFitToView();
            }}
          >
            <option value="zenith">zenith (vue du dessus)</option>
            <option value="isometric">isometric (vue 3/4)</option>
          </select>
        </label>
      </fieldset>

      <h3>Espace sélectionné {demoRoomId !== undefined ? `(${demoRoomId})` : ''}</h3>
      <div className="actions">
        <button
          type="button"
          data-testid="demo-update-room"
          disabled={demoRoomId === undefined}
          onClick={() => {
            if (demoRoomId === undefined) return;
            const options: SurfyRoomUpdateOptions = {
              color: DEMO_ROOM_COLOR,
              showLabel: roomShowLabel,
            };
            onUpdateRoom(demoRoomId, options);
            onLogUpdateRoom(
              demoRoomId,
              `{ color: '${DEMO_ROOM_COLOR}', showLabel: ${roomShowLabel} }`,
            );
          }}
        >
          updateRoom (color + label)
        </button>
      </div>
      <label className="demo-3d-controls__row">
        <input
          type="checkbox"
          checked={roomShowLabel}
          disabled={demoRoomId === undefined}
          data-testid="demo-room-show-label"
          onChange={(event) => {
            const next = event.target.checked;
            setState((prev) => ({ ...prev, roomShowLabel: next }));
            if (demoRoomId === undefined) return;
            onUpdateRoom(demoRoomId, { showLabel: next });
            onLogUpdateRoom(demoRoomId, `{ showLabel: ${next} }`);
          }}
        />
        Texte de l&apos;espace
      </label>
    </div>
  );
}
