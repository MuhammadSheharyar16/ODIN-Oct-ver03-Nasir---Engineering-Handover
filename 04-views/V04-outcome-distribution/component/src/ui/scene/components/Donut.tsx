import { useEffect, useRef, type CSSProperties } from 'react';
import type { DonutSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { registerProxy } from '../../../odin/fx';

/** Ring tilt shared with the WebGL donut (radians about X). */
export const DONUT_TILT = 0.5;
const SQUASH = Math.cos(DONUT_TILT);
/** Start angle (12 o'clock) and direction (clockwise on screen). */
export function segmentAngles(spec: DonutSpec) {
  const total = spec.segments.reduce((a, s) => a + s.count, 0) || 1;
  let a = -Math.PI / 2;
  return spec.segments.map((s) => {
    const span = (s.count / total) * Math.PI * 2;
    const r = { start: a, end: a + span, mid: a + span / 2, share: s.count / total };
    a += span;
    return r;
  });
}

/**
 * Status distribution: a 3D glass donut (rendered in WebGL, following this
 * element) with flat, always-readable labels. Segments are mutually
 * exclusive current statuses, so they sum to the total.
 */
export function Donut({ spec, box }: { spec: DonutSpec; box: Box }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!stage.current) return;
    return registerProxy(`donut:${spec.key}`, { el: stage.current, kind: 'donut', data: spec });
  }, [spec]);

  const clean = !!spec.clean;
  const legendMode = !clean && (box.w / box.h < 1.15 || box.w < 560);
  const angles = segmentAngles(spec);
  const S = clean ? Math.min(box.w * 0.9, box.h * 0.9) : legendMode ? Math.min(box.w * 0.62, box.h * 0.62) : Math.min(box.w * 0.62, box.h * 0.8);

  // Label anchors: radial, then de-collided per side (min vertical gap).
  const placed = angles.map((a, i) => {
    const right = Math.cos(a.mid) >= 0;
    const r = S * 0.66;
    return { i, right, x: Math.cos(a.mid) * r + (right ? S * 0.1 : -S * 0.1), y: Math.sin(a.mid) * r * SQUASH };
  });
  const gap = S * 0.25;
  for (const side of [true, false]) {
    const col = placed.filter((p) => p.right === side).sort((p, q) => p.y - q.y);
    for (let k = 1; k < col.length; k++) if (col[k].y - col[k - 1].y < gap) col[k].y = col[k - 1].y + gap;
    // Re-centre the column if it was pushed down.
    const over = col.length ? col[col.length - 1].y - S * 0.62 : 0;
    if (over > 0) col.forEach((p) => (p.y -= over));
  }

  return (
    <div className={`donut${legendMode ? ' is-legend' : ''}${clean ? ' is-clean' : ''}`}>
      <div className="donut__stage" ref={stage} data-aura data-surface style={{ width: S, height: S, borderRadius: '50%' }}>
        <div className="donut__center" style={{ '--s': `${S}px` } as CSSProperties}>
          <div className="donut__total">{formatCount(spec.total)}</div>
          <div className="donut__total-label">{spec.totalLabel}</div>
          {clean && <span className="donut__underline" aria-hidden />}
        </div>
        {!legendMode && !clean && (
          <svg className="donut__leaders" viewBox={`${-S} ${-S} ${S * 2} ${S * 2}`} style={{ width: S * 2, height: S * 2 }} aria-hidden>
            {placed.map(({ i, right, y }) => {
              const a = angles[i];
              const r1 = S * 0.5;
              const x1 = Math.cos(a.mid) * r1;
              const y1 = Math.sin(a.mid) * r1 * SQUASH;
              const x2 = Math.cos(a.mid) * S * 0.62;
              const x3 = x2 + (right ? S * 0.08 : -S * 0.08);
              return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y} L ${x3} ${y}`} stroke={spec.segments[i].accent} />;
            })}
          </svg>
        )}
        {!legendMode && !clean &&
          placed.map(({ i, right, x, y }) => {
            const a = angles[i];
            const seg = spec.segments[i];
            return (
              <div
                key={seg.key}
                className={`donut__label${right ? ' is-right' : ' is-left'}`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, '--accent': seg.accent, '--s': `${S}px` } as CSSProperties}
              >
                <div className="donut__pct">{(a.share * 100).toFixed(1)}%</div>
                <div className="donut__count">{formatCount(seg.count)}</div>
                <div className="donut__name">{seg.label}</div>
              </div>
            );
          })}
      </div>
      {legendMode && (
        <ul className="donut__legend">
          {spec.segments.map((seg, i) => (
            <li key={seg.key} style={{ '--accent': seg.accent } as CSSProperties}>
              <span className="donut__dot" />
              <span>{seg.label}</span>
              <b>{formatCount(seg.count)}</b>
              <em>{(angles[i].share * 100).toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      )}
      {!clean && <div className="donut__basis">{spec.basis}</div>}
    </div>
  );
}
