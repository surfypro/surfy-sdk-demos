import type {
  SurfyLayout3dOptions,
  SurfyRoomUpdateOptions,
} from '@surfy/surfy-sdk';

import type { DemoFloor } from '../../../fetchDemoCatalog';
import { Layout3dDemoControls } from '../shared/Layout3dDemoControls';

interface Building3dDemoControlsProps {
  readonly buildingFloors: readonly DemoFloor[];
  readonly demoRoomId: number | undefined;
  readonly onApplyOptions: (patch: SurfyLayout3dOptions) => void;
  readonly onUpdateRoom: (roomId: number, options: SurfyRoomUpdateOptions) => void;
  readonly onFitToView: () => void;
  readonly onLogUpdateRoom: (roomId: number, optionsLiteral: string) => void;
}

/** Building-3d sidebar — shared Layout3dDemoControls with `scope="building"`. */
export function Building3dDemoControls(props: Building3dDemoControlsProps) {
  const { buildingFloors, ...rest } = props;
  return <Layout3dDemoControls scope="building" floors={buildingFloors} {...rest} />;
}
