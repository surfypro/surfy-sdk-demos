import { useEffect, useRef, useState } from 'react';
import '@surfy/surfy-sdk';

import type { DemoSectionConfig } from './demoSections';
import { isSectionTagRegistered } from './demoSections';
import { getSurfyDemoBaseUrl, getSurfyTokenUrl } from './surfyEnv';

const DEMO_ROOM_COLOR = '#2196F3';

export type SurfyLayoutElement = HTMLElement & {
  setAccessTokenProvider: (provider: () => Promise<string>) => void;
  setRoomColors: (colors: Record<number, string>) => void;
  clearRoomColors: () => void;
};

function getConfiguredDemoRoomId(): number | undefined {
  const raw = import.meta.env.VITE_SURFY_DEMO_ROOM_ID;
  if (!raw) return undefined;
  const roomId = Number(raw);
  return Number.isFinite(roomId) ? roomId : undefined;
}

function getFirstRenderedRoomId(element: SurfyLayoutElement): number | undefined {
  const room = element.shadowRoot?.querySelector('[data-room-id]') as HTMLElement | null;
  if (!room) return undefined;
  const roomId = Number(room.dataset.roomId);
  return Number.isFinite(roomId) ? roomId : undefined;
}

async function waitForDemoRoomId(element: SurfyLayoutElement, timeoutMs = 10_000): Promise<number | undefined> {
  const configuredRoomId = getConfiguredDemoRoomId();
  if (configuredRoomId !== undefined) {
    return configuredRoomId;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const roomId = getFirstRenderedRoomId(element);
    if (roomId !== undefined) {
      return roomId;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return undefined;
}

function createLayoutElement(tag: string): SurfyLayoutElement | null {
  const ctor = customElements.get(tag);
  if (!ctor) {
    return null;
  }

  return new (ctor as CustomElementConstructor)() as SurfyLayoutElement;
}

function getLayoutEntityId(section: DemoSectionConfig): string {
  const raw = import.meta.env[section.envKey];
  if (section.idAttribute === 'building-id') {
    return String(raw ?? '1');
  }
  return String(raw ?? '42');
}

interface LayoutDemoPanelProps {
  readonly section: DemoSectionConfig;
  readonly active: boolean;
}

export function LayoutDemoPanel({ section, active }: LayoutDemoPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayoutElement | null>(null);
  const [lastEvent, setLastEvent] = useState('none');
  const [demoRoomId, setDemoRoomId] = useState<number | undefined>(getConfiguredDemoRoomId());
  const [fillParent, setFillParent] = useState(false);
  const registered = isSectionTagRegistered(section.tag);

  useEffect(() => {
    const element = layoutRef.current;
    if (!element) return;

    if (fillParent) {
      element.setAttribute('fill-parent', '');
    } else {
      element.removeAttribute('fill-parent');
    }
  }, [fillParent]);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const element = createLayoutElement(section.tag);
    if (!element) {
      return;
    }

    element.setAttribute(section.idAttribute, getLayoutEntityId(section));
    element.setAttribute('tenant', import.meta.env.VITE_SURFY_TENANT ?? 'sandbox');
    element.setAttribute('base-url', getSurfyDemoBaseUrl());

    element.setAccessTokenProvider(async () => {
      const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
      const response = await fetch(getSurfyTokenUrl(), {
        headers: gate ? { 'X-Surfy-Demo-Key': gate } : undefined,
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error ?? `Token request failed (${response.status})`);
      }
      const data = (await response.json()) as { token: string };
      return data.token;
    });

    const onReady = () => {
      setLastEvent('surfy:ready');
      void waitForDemoRoomId(element).then((roomId) => {
        if (roomId !== undefined) {
          setDemoRoomId((current) => current ?? roomId);
        }
      });
    };
    const onHover = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId: number; name: string } | null>).detail;
      setLastEvent(detail ? `surfy:room-hover ${detail.roomId} ${detail.name}` : 'surfy:room-hover leave');
    };
    const onSelected = (event: Event) => {
      const detail = (event as CustomEvent<{ roomId: number; name: string }>).detail;
      setDemoRoomId(detail.roomId);
      setLastEvent(`surfy:room-selected ${detail.roomId} ${detail.name}`);
    };
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<{ code: string; message: string }>).detail;
      setLastEvent(`surfy:error ${detail.code} ${detail.message}`);
    };

    element.addEventListener('surfy:ready', onReady);
    element.addEventListener('surfy:room-hover', onHover);
    element.addEventListener('surfy:room-selected', onSelected);
    element.addEventListener('surfy:error', onError);

    container.appendChild(element);
    layoutRef.current = element;

    return () => {
      element.removeEventListener('surfy:ready', onReady);
      element.removeEventListener('surfy:room-hover', onHover);
      element.removeEventListener('surfy:room-selected', onSelected);
      element.removeEventListener('surfy:error', onError);
      element.remove();
      layoutRef.current = null;
      setLastEvent('none');
    };
  }, [active, section]);

  if (!active) {
    return null;
  }

  return (
    <section className="demo-section" data-testid={`demo-section-${section.id}`}>
      <header className="demo-section__header">
        <h2>{section.label}</h2>
        <p className="demo-section__tag">
          <code>&lt;{section.tag}&gt;</code>
        </p>
        <p className="demo-section__description">{section.description}</p>
      </header>

      {!registered ? (
        <div className="demo-section__unavailable" data-testid="demo-section-unavailable">
          <p>
            Ce composant n'est pas encore enregistré dans le bundle SDK (phase 2 — moteur CubyV2).
            La section sera activée automatiquement à la publication de <code>{section.tag}</code>.
          </p>
        </div>
      ) : (
        <>
          <p>
            Last event: <span data-testid="demo-last-event">{lastEvent}</span>
          </p>
          <div className="actions">
            <button
              type="button"
              disabled={demoRoomId === undefined}
              onClick={() => {
                if (demoRoomId !== undefined) {
                  layoutRef.current?.setRoomColors({ [demoRoomId]: DEMO_ROOM_COLOR });
                }
              }}
            >
              {demoRoomId === undefined ? 'Color room' : `Color room ${demoRoomId}`}
            </button>
            <button type="button" onClick={() => layoutRef.current?.clearRoomColors()}>
              Clear colors
            </button>
          </div>
          <label className="floor-plan-options">
            <input
              type="checkbox"
              checked={fillParent}
              onChange={(event) => setFillParent(event.target.checked)}
            />
            Remplir le conteneur parent
          </label>
          <div ref={containerRef} className="layout-host" data-testid="layout-host" />
        </>
      )}
    </section>
  );
}
