import type { DemoBuilding, DemoFloor } from './fetchDemoCatalog';

interface DemoScopePickerProps {
  readonly buildings: readonly DemoBuilding[];
  readonly selectedBuildingId: number | undefined;
  readonly selectedFloorId: number | undefined;
  readonly onBuildingChange: (buildingId: number) => void;
  readonly onFloorChange: (floorId: number) => void;
  readonly disabled?: boolean;
}

function floorsForBuilding(
  buildings: readonly DemoBuilding[],
  buildingId: number | undefined,
): readonly DemoFloor[] {
  if (buildingId === undefined) return [];
  return buildings.find((b) => b.id === buildingId)?.floors ?? [];
}

export function DemoScopePicker({
  buildings,
  selectedBuildingId,
  selectedFloorId,
  onBuildingChange,
  onFloorChange,
  disabled = false,
}: DemoScopePickerProps) {
  const floors = floorsForBuilding(buildings, selectedBuildingId);

  return (
    <div className="demo-scope" data-testid="demo-scope-picker">
      <label className="demo-scope__field">
        <span>Bâtiment</span>
        <select
          data-testid="demo-building-select"
          disabled={disabled || buildings.length === 0}
          value={selectedBuildingId ?? ''}
          onChange={(event) => {
            const id = Number(event.target.value);
            if (Number.isFinite(id)) onBuildingChange(id);
          }}
        >
          {buildings.length === 0 ? <option value="">Aucun bâtiment</option> : null}
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name} (#{building.id})
            </option>
          ))}
        </select>
      </label>

      <label className="demo-scope__field">
        <span>Étage</span>
        <select
          data-testid="demo-floor-select"
          disabled={disabled || floors.length === 0}
          value={selectedFloorId ?? ''}
          onChange={(event) => {
            const id = Number(event.target.value);
            if (Number.isFinite(id)) onFloorChange(id);
          }}
        >
          {floors.length === 0 ? <option value="">Aucun étage</option> : null}
          {floors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.name} · niv. {floor.level} (#{floor.id})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
