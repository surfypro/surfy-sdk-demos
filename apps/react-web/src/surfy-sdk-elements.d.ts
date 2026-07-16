import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  interface SurfyLayoutAttributes extends HTMLAttributes<HTMLElement> {
    'floor-id'?: string;
    'building-id'?: string;
    tenant?: string;
    'base-url'?: string;
    locale?: string;
    'fill-parent'?: boolean | '';
  }

  interface IntrinsicElements {
    'surfy-floor-layout-2d': DetailedHTMLProps<SurfyLayoutAttributes, HTMLElement>;
    'surfy-floor-layout-3d': DetailedHTMLProps<SurfyLayoutAttributes, HTMLElement>;
    'surfy-building-layout-3d': DetailedHTMLProps<SurfyLayoutAttributes, HTMLElement>;
    /** @deprecated Use surfy-floor-layout-2d */
    'surfy-floor-plan': DetailedHTMLProps<SurfyLayoutAttributes, HTMLElement>;
  }
}

export {};
