import { useMemo, type CSSProperties } from 'react';
import { useExperience } from '../../odin/experience';
import { composeScene } from '../../odin/compose';
import type { ComponentSpec, SceneAnswer } from '../../odin/types';
import type { Box } from '../../lib/homeLayout';
import { useOdinLayout } from '../bridge';
import { BarsPanel, ComparePanel, FactsPanel, LegendPanel, MetricCard, NoticePanel, RankingPanel } from './components/Panels';
import { Journey } from './components/Journey';
import { Donut } from './components/Donut';
import { TimeMatrix } from './components/TimeMatrix';
import { Board } from './components/Board';
import { Channels, Periods, Queue, Revenue } from './components/Jars';
import { Geo, JourneyOrbs, Podiums, Ring } from './components/Showcase';
import './scene.css';
import './v1.css';
import './glass.css';
import './cards.css';

function Component({ spec, box }: { spec: ComponentSpec; box: Box }) {
  switch (spec.kind) {
    case 'legend':
      return <LegendPanel spec={spec} />;
    case 'board':
      return <Board spec={spec} />;
    case 'metric':
      return <MetricCard spec={spec} />;
    case 'journey':
      return spec.variant === 'orbs' ? <JourneyOrbs spec={spec} box={box} /> : <Journey spec={spec} box={box} />;
    case 'timeMatrix':
      return <TimeMatrix spec={spec} box={box} />;
    case 'channels':
      return <Channels spec={spec} box={box} />;
    case 'periods':
      return <Periods spec={spec} box={box} />;
    case 'queue':
      return <Queue spec={spec} box={box} />;
    case 'revenue':
      return <Revenue spec={spec} box={box} />;
    case 'podiums':
      return <Podiums spec={spec} box={box} />;
    case 'geo':
      return <Geo spec={spec} box={box} />;
    case 'ring':
      return <Ring spec={spec} box={box} />;
    case 'donut':
      return <Donut spec={spec} box={box} />;
    case 'ranking':
      return <RankingPanel spec={spec} />;
    case 'compare':
      return <ComparePanel spec={spec} />;
    case 'bars':
      return <BarsPanel spec={spec} />;
    case 'facts':
      return <FactsPanel spec={spec} />;
    case 'notice':
      return <NoticePanel spec={spec} />;
  }
}

const accentOf = (spec: ComponentSpec) =>
  'accent' in spec ? spec.accent : spec.kind === 'donut' ? spec.segments[0]?.accent : spec.kind === 'compare' ? spec.sides[0].accent : '#7fb6ff';

function Scene({ answer, entering }: { answer: SceneAnswer; entering: boolean }) {
  const home = useOdinLayout();
  const layout = useMemo(() => composeScene(answer, home), [answer, home]);
  const placed = answer.components.filter((p) => layout.slots[p.spec.key]);
  return (
    <div className={`scene mode-${home.mode}${entering ? ' is-entering' : ''}`} data-scene={answer.id}>
      {layout.title && (
        <header
          className="scene__title"
          style={{ left: layout.title.x, top: layout.title.y, width: layout.title.w, height: layout.title.h } as CSSProperties}
        >
          <div className="scene__title-morph" data-morph={`title:${answer.id}`} data-accent="#9fd0ff">
            <h1>{answer.title}</h1>
            <p>{answer.subtitle}</p>
          </div>
        </header>
      )}
      {placed.map(({ spec }) => {
        const b = layout.slots[spec.key];
        return (
          <div key={spec.key} className={`scene-item kind-${spec.kind}`} style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            <div
              className="scene-item__morph"
              data-morph={spec.key}
              data-accent={accentOf(spec)}
              {...(spec.key === answer.focusKey ? { 'data-focus': '' } : {})}
            >
              <Component spec={spec} box={b} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Active scene (and the outgoing one while a morph runs). */
export function SceneLayer() {
  const active = useExperience((s) => s.active);
  const leaving = useExperience((s) => s.leaving);
  return (
    <div className="scene-layer">
      {leaving && leaving.id !== active?.id && <Scene key={leaving.id} answer={leaving} entering={false} />}
      {active && <Scene key={active.id} answer={active} entering={leaving !== undefined} />}
    </div>
  );
}
