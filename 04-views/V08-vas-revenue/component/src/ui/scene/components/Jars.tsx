import type { ReactNode } from 'react';
import { Building2, CalendarDays, Clock, CloudUpload, Globe2, Receipt, ShieldCheck, UserRound, ChevronRight, Info } from 'lucide-react';
import type { ChannelsSpec, PeriodsSpec, QueueSpec, RevenueSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { SceneIcon } from '../SceneIcon';
import { Bars, Count, DeltaTag, Plinth, css, kfmt, useProxy } from './shared';

/**
 * Glass bell-jar family (designs: Submission Channel, Visa Performance
 * Comparison, Stage Queue/Aging, VAS Revenue). Jars are unblurred glass so
 * the 3D object on the pedestal below shows through; text sits in a darker
 * crown for legibility.
 */
function Jar({ accent, crown, children, tall = 1, highlight, i, heat }: { accent: string; crown: ReactNode; children?: ReactNode; tall?: number; highlight?: boolean; i: number; heat?: number }) {
  return (
    <div className={`jar${highlight ? ' is-highlight' : ''}${heat !== undefined ? ' has-heat' : ''}`} style={css({ '--accent': accent, '--tall': tall, '--i': i, ...(heat !== undefined ? { '--heat': heat.toFixed(3) } : {}) })}>
      <div className="jar__glass">
        <div className="jar__crown">{crown}</div>
        {children}
      </div>
    </div>
  );
}

const fmtAED = (n: number) => (n >= 1e6 ? `AED ${(n / 1e6).toFixed(1)}M` : `AED ${(n / 1e3).toFixed(0)}K`);

// ───────────────────────────── Submission channels ─────────────────────────────
export function Channels({ spec, box }: { spec: ChannelsSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const side = (k: 'online' | 'centre') => {
    const d = spec[k];
    const accent = k === 'online' ? '#4f9cff' : '#f5ac45';
    return (
      <div className={`ch-col is-${k}`}>
        <Jar accent={accent} i={k === 'online' ? 0 : 2} crown={
          <>
            <span className="jar__icon">{k === 'online' ? <CloudUpload /> : <Building2 />}</span>
            <span className="jar__title">{k === 'online' ? 'Online' : 'Centre'}</span>
            <span className="jar__value"><Count v={d.count} /></span>
            <span className="jar__sub">{d.share.toFixed(1)}% of total</span>
            <span className="jar__rule" />
            <DeltaTag value={d.delta} basis="vs yesterday" className="jar__delta" />
          </>
        }>
          <Bars values={d.bars} accent={accent} className="jar__bars" />
        </Jar>
        <Plinth accent={accent} style={css({ width: '92%' })} noBloom />
      </div>
    );
  };
  return (
    <div className={`chs${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {side('online')}
      <div className="ch-core">
        <div className="ch-core__orb" data-presence="0.5" data-aura="">
          <div className="ch-core__text">
            <span>Total applications</span>
            <b><Count v={spec.total} /></b>
          </div>
        </div>
        <Plinth accent="#7fb6ff" noBloom style={css({ width: '56%' })} />
      </div>
      {side('centre')}
      {spec.status === 'amber' && (
        <div className="pending-tag">
          <Info /> Channel field pending data-team validation (F09)
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Period comparison ─────────────────────────────
export function Periods({ spec, box }: { spec: PeriodsSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const items = narrow ? spec.items.filter((p) => p.key !== 'prev7') : spec.items;
  return (
    <div className={`jars${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {!narrow && <span className="floor-aura" data-aura="floor" data-aura-from="plinths" data-rise="0.22" />}
      {items.map((p, i) => (
        <div key={p.key} className="jar-col" style={css({ '--i': i, '--accent': p.accent })}>
          <Jar accent={p.accent} i={i} highlight={p.key === 'last7'} tall={p.key === 'last7' ? 1.08 : 1} crown={
            <>
              <span className="jar__icon"><CalendarDays /></span>
              <span className="jar__title">{p.label}</span>
              <span className="jar__value"><Count v={p.value} /></span>
              <span className="jar__sub">visas processed</span>
              <DeltaTag value={p.delta} basis={p.cmp} className="jar__delta" />
            </>
          } />
          <Plinth accent={p.accent} object="passports" scale={0.78} style={css({ width: '88%' })} />
          <div className="jar-stats">
            <div>
              <ShieldCheck />
              <span>Approval rate</span>
              <b>{p.approval.toFixed(1)}%</b>
              <DeltaTag value={p.approvalDelta} unit=" pp" />
            </div>
            <div>
              <Clock />
              <span>Avg. processing time</span>
              <b>{p.days.toFixed(1)} days</b>
              <DeltaTag value={p.daysDelta} goodWhen="down" />
            </div>
          </div>
          {!narrow && i < items.length - 1 && <ChevronRight className="jar-chev" />}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Queue / aging ─────────────────────────────
export function Queue({ spec, box }: { spec: QueueSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const max = Math.max(...spec.items.map((q) => q.waiting), 1);
  return (
    <div className={`jars is-queue${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {!narrow && <span className="floor-aura" data-aura="floor" data-aura-from="plinths" data-rise="0.22" />}
      {spec.items.map((q, i) => (
        <div key={q.key} className="jar-col" style={css({ '--i': i, '--accent': q.accent })}>
          <Jar accent={q.accent} i={i} highlight={q.waiting === max} tall={0.82 + 0.26 * (q.waiting / max)} heat={q.waiting ? q.buckets.gt3 / q.waiting : 0} crown={
            <>
              <span className="jar__icon"><SceneIcon name={q.icon} /></span>
              <span className="jar__title">{q.label}</span>
              <span className="jar__value"><Count v={q.waiting} /></span>
              <span className="jar__sub">waiting now</span>
            </>
          } />
          <Plinth accent={q.accent} object="docStack" stack={q.waiting / max} scale={0.78} style={css({ width: '88%' })} />
          <div className="jar-stats is-aging">
            <div className="jar-stats__head">
              <span>Avg. waiting time</span>
              <b>{q.avgWait.toFixed(1)} days</b>
            </div>
            <div className="age"><i className="is-g" /> &lt; 1 day <b>{kfmt(q.buckets.lt1)}</b></div>
            <div className="age"><i className="is-a" /> 1–3 days <b>{kfmt(q.buckets.d13)}</b></div>
            <div className="age"><i className="is-r" /> &gt; 3 days <b>{kfmt(q.buckets.gt3)}</b></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Revenue ─────────────────────────────
const SINGULAR: Record<string, string> = { countries: 'Country', centres: 'Centre', services: 'Service', nationalities: 'Nationality' };
const DIM_ICON: Record<string, ReactNode> = { countries: <Globe2 />, centres: <Building2 />, services: <Receipt />, nationalities: <UserRound /> };

export function Revenue({ spec, box }: { spec: RevenueSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const na = !spec.preview;
  return (
    <div className={`rev${narrow ? ' is-narrow' : ''}${na ? ' is-na' : ''}`} data-surface ref={ref}>
      <div className="rev__head">
        <div className="eyebrow">— VAS</div>
        <div className="rev__h1">VAS Revenue</div>
        <div className="rev__h2">Total and breakdown by key dimensions</div>
        <p>Recognised VAS revenue by operating country, visa centre, service type and applicant nationality.</p>
      </div>
      <div className="rev__core" data-presence="0.5" data-aura="">
        <div className="rev__core-text">
          <span>Total VAS revenue</span>
          <b>{na ? 'Not available' : <Count v={spec.amount ?? 0} fmt={fmtAED} />}</b>
          {na ? <em>Awaiting finance definition</em> : <DeltaTag value={spec.delta} basis="vs previous period" />}
        </div>
      </div>
      {!narrow && (
        <svg className="rev__streams" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {[25.4, 41.8, 58.2, 74.6].map((x, i) => {
            const d = `M ${x} 44 C ${x} 30, ${50 + (x - 50) * 0.35} 30, 50 ${21 + Math.abs(x - 50) * 0.05}`;
            return (
              <g key={x} style={css({ '--accent': spec.dims[i]?.accent ?? '#7fb6ff', '--i': i })}>
                <path d={d} className="rev__stream-glow" />
                <path d={d} className="rev__stream-flow" />
              </g>
            );
          })}
        </svg>
      )}
      <div className="rev__pillars">
        {spec.dims.map((d, i) => (
          <div key={d.key} className="rev__col" style={css({ '--accent': d.accent })}>
            <Jar accent={d.accent} i={i} crown={
              <>
                <span className="jar__icon">{DIM_ICON[d.key]}</span>
                <span className="jar__title">{d.label}</span>
                <span className="jar__value is-money">{na ? '—' : <Count v={d.value ?? 0} fmt={fmtAED} delay={700} />}</span>
                <span className="jar__sub">{na ? 'not available' : `${(d.share * 100).toFixed(0)}%`}</span>
              </>
            }>
              <Bars values={d.bars} accent={d.accent} className="jar__bars" />
            </Jar>
            <Plinth accent={d.accent} noBloom style={css({ width: '90%' })} />
            <div className="rev__top">
              <div className="rev__top-h">Top 3 {d.label.split(' ').pop()?.toLowerCase()}</div>
              {d.top.map((t, k) => (
                <div key={t.name} className="rev__top-row">
                  <span>{na ? `${SINGULAR[d.key] ?? 'Item'} ${k + 1}` : t.name}</span>
                  <i style={css({ '--w': `${na ? 0 : (t.value / d.top[0].value) * 100}%`, '--accent': d.accent })} />
                  <b>{na ? '—' : fmtAED(t.value)}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`pending-tag${spec.preview && !spec.validation ? ' is-preview' : ''}`}>
        <Info />
        {spec.validation
          ? 'Validation required · revenue definition awaiting AEGI Finance approval · demo values'
          : spec.preview
            ? 'Design preview · mock values — not a revenue figure'
            : 'Revenue awaits the finance definition'}
      </div>
    </div>
  );
}
