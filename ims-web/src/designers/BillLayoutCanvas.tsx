import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { BillLayoutJson, BillLayoutSection } from '../document/contracts/billLayout';

const GRID_MM = 5;
const PALETTE: { type: string; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'field', label: 'Field' },
  { type: 'table', label: 'Table' },
  { type: 'image', label: 'Image' },
  { type: 'barcode', label: 'Barcode' },
  { type: 'qr', label: 'QR code' },
];

function snapMm(value: number): number {
  return Math.round(value / GRID_MM) * GRID_MM;
}

function nextSectionId(sections: BillLayoutSection[]): string {
  const used = new Set(sections.map((s) => s.id));
  let i = sections.length + 1;
  while (used.has(`section_${i}`)) i += 1;
  return `section_${i}`;
}

export interface BillLayoutCanvasProps {
  layout: BillLayoutJson;
  onChange: (layout: BillLayoutJson) => void;
}

export function BillLayoutCanvas({ layout, onChange }: BillLayoutCanvasProps) {
  const page = layout.page;
  const scale = 3;
  const canvasWidth = page.widthMm * scale;
  const canvasHeight = page.heightMm * scale;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    mode: 'move' | 'resize';
    originW: number;
    originH: number;
  } | null>(null);

  const sections = layout.sections ?? [];
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const guides = useMemo(() => {
    const lines: number[] = [];
    for (let x = 0; x <= page.widthMm; x += GRID_MM) lines.push(x * scale);
    return lines;
  }, [page.widthMm, scale]);

  const updateSection = useCallback(
    (id: string, patch: Partial<BillLayoutSection>) => {
      onChange({
        ...layout,
        sections: sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
      });
    },
    [layout, onChange, sections],
  );

  const addSection = useCallback(
    (type: string) => {
      const id = nextSectionId(sections);
      const section: BillLayoutSection = {
        id,
        type,
        label: type,
        visible: true,
        order: sections.length + 1,
        x: snapMm(10),
        y: snapMm(10 + sections.length * 8),
        width: type === 'table' ? 180 : 80,
        height: type === 'table' ? 40 : 12,
        text: type === 'text' ? 'Sample text' : undefined,
      };
      onChange({ ...layout, sections: [...sections, section] });
      setSelectedId(id);
    },
    [layout, onChange, sections],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent, section: BillLayoutSection, mode: 'move' | 'resize') => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedId(section.id);
      dragRef.current = {
        id: section.id,
        startX: event.clientX,
        startY: event.clientY,
        originX: section.x,
        originY: section.y,
        originW: section.width,
        originH: section.height,
        mode,
      };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / scale;
      const dy = (event.clientY - drag.startY) / scale;

      if (drag.mode === 'move') {
        updateSection(drag.id, {
          x: snapMm(Math.max(0, Math.min(page.widthMm - drag.originW, drag.originX + dx))),
          y: snapMm(Math.max(0, Math.min(page.heightMm - drag.originH, drag.originY + dy))),
        });
      } else {
        updateSection(drag.id, {
          width: snapMm(Math.max(GRID_MM, drag.originW + dx)),
          height: snapMm(Math.max(GRID_MM, drag.originH + dy)),
        });
      }
    },
    [page.heightMm, page.widthMm, scale, updateSection],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className="bd-canvas">
      <div className="bd-canvas__palette">
        {PALETTE.map((item) => (
          <button key={item.type} type="button" className="wpf-secondary-button" onClick={() => addSection(item.type)}>
            + {item.label}
          </button>
        ))}
      </div>

      <div className="bd-canvas__workspace">
        <div
          className="bd-canvas__page"
          style={{ width: canvasWidth, height: canvasHeight }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelectedId(null)}
        >
          {guides.map((pos) => (
            <div key={`g-${pos}`} className="bd-canvas__guide-v" style={{ left: pos }} />
          ))}
          {sections
            .filter((s) => s.visible !== false)
            .map((section) => (
              <div
                key={section.id}
                className={`bd-canvas__section${selectedId === section.id ? ' bd-canvas__section--selected' : ''}`}
                style={{
                  left: section.x * scale,
                  top: section.y * scale,
                  width: section.width * scale,
                  height: section.height * scale,
                }}
                onPointerDown={(e) => onPointerDown(e, section, 'move')}
              >
                <span className="bd-canvas__section-label">{section.label || section.type}</span>
                <span
                  className="bd-canvas__resize"
                  onPointerDown={(e) => onPointerDown(e, section, 'resize')}
                />
              </div>
            ))}
        </div>
      </div>

      {selected && (
        <div className="bd-canvas__inspector mf-form__grid mf-form__grid--3">
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Label</span>
            <input
              className="wpf-subpage-form-input"
              value={selected.label}
              onChange={(e) => updateSection(selected.id, { label: e.target.value })}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Type</span>
            <input className="wpf-subpage-form-input" value={selected.type} readOnly />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Text</span>
            <input
              className="wpf-subpage-form-input"
              value={selected.text ?? ''}
              onChange={(e) => updateSection(selected.id, { text: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
