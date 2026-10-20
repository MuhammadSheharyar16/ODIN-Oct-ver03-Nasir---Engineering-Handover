import gsap from 'gsap';
import { parse } from './nlu';
import { QUESTIONS, matchQuestion } from './questions';
import { VIEWS } from './views';
import { answer, homeSpoken } from './answers';
import { composeScene } from './compose';
import { presence, useExperience } from './experience';
import { burst, type FxRect } from './fx';
import type { SceneAnswer } from './types';
import { startSpeechPreview, stopSpeech } from '../audio/odinAudio';
import { playMorph } from '../audio/morphSfx';
import { useCaption } from '../state/caption';
import { useLayout } from '../state/layout';
import { setAuraTarget } from '../lib/aura';
import { useStage } from '../state/store';
import { prefersReducedMotion } from '../lib/motion';
import { REST_VIEW, envView, floorView } from '../lib/envFit';
import { FLOOR_CX } from '../ui/scene/components/floorJourney';

/**
 * Morph director: question → intent → scene → 3D morph → ODIN speaks.
 * Any state can reach any state. Shared components (same key) travel from
 * their old place to their new one; others recede into depth while the new
 * ones assemble, with a particle stream carried through ODIN.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
let token = 0;

const layerSel = (s: SceneAnswer | null) => (s ? `[data-scene="${s.id}"]` : '[data-layer="home"]');
const morphEls = (s: SceneAnswer | null) => Array.from(document.querySelectorAll<HTMLElement>(`${layerSel(s)} [data-morph]`));

function rectOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

function auraFor(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  if (!s) {
    const g = home.globe;
    setAuraTarget({ x: g.x, y: g.y, hw: g.r, hh: g.r, radius: g.r });
    return;
  }
  // Compositions (journeys, rows of jars) get the floor form around everything.
  const floor = document.querySelector<HTMLElement>(`${layerSel(s)} [data-aura="floor"]`);
  if (floor) {
    let r = rectOf(floor);
    if (floor.dataset.auraFrom === 'plinths') {
      const bs = Array.from(document.querySelectorAll<HTMLElement>(`${layerSel(s)} [data-plinth]`))
        .map((e) => e.getBoundingClientRect())
        .filter((b) => b.width > 1);
      if (bs.length) {
        const l = Math.min(...bs.map((b) => b.left));
        const rr = Math.max(...bs.map((b) => b.right));
        const w = Math.max(...bs.map((b) => b.width));
        const cy = bs.reduce((a, b) => a + b.top, 0) / bs.length;
        r = { x: (l + rr) / 2, y: cy + w * 0.16, w: rr - l + w * 0.55, h: w * 0.62 };
      }
    }
    const k = parseFloat(floor.dataset.rise ?? '') || 0.16;
    setAuraTarget({ x: r.x, y: r.y, hw: r.w / 2, hh: r.h / 2, radius: 0, mode: 1, rise: (r.w / 2) * k });
    return;
  }
  const focus = document.querySelector<HTMLElement>(`${layerSel(s)} [data-focus]`);
  const el = focus?.querySelector<HTMLElement>('[data-aura]') ?? focus;
  if (!el) return;
  const r = rectOf(el);
  const surface = el.querySelector<HTMLElement>('[data-surface]') ?? el;
  const raw = getComputedStyle(surface).borderTopLeftRadius;
  const rad = raw.endsWith('%') ? (parseFloat(raw) / 100) * Math.min(r.w, r.h) * 2 : parseFloat(raw) || 24;
  setAuraTarget({ x: r.x, y: r.y, hw: r.w / 2, hh: r.h / 2, radius: Math.min(rad, r.w / 2, r.h / 2) });
}

/**
 * Morph choreographies. Each pairs a DOM entrance/exit with a particle path
 * style (fx.style) so consecutive transitions never look the same.
 */
type Vars = gsap.TweenVars;
type Morph = {
  name: string;
  particles: number;
  out: (r: { x: number; y: number }, c: { x: number; y: number }) => Vars;
  in: (r: { x: number; y: number }, c: { x: number; y: number }) => Vars;
  order?: (r: { x: number; y: number }) => number;
  ease?: string;
};
const MORPHS: Morph[] = [
  {
    name: 'depth',
    particles: 0,
    out: () => ({ z: -280, scale: 0.86, rotationX: 7, filter: 'blur(12px)' }),
    in: () => ({ z: -340, rotationX: -14, y: 26, scale: 0.9, filter: 'blur(14px)' }),
  },
  {
    name: 'vortex',
    particles: 1,
    out: (r, c) => ({ rotation: r.x < c.x ? -14 : 14, scale: 0.4, x: (c.x - r.x) * 0.6, y: (c.y - r.y) * 0.6, filter: 'blur(10px)' }),
    in: (r, c) => ({ rotation: r.x < c.x ? 18 : -18, scale: 0.35, x: (c.x - r.x) * 0.7, y: (c.y - r.y) * 0.7, filter: 'blur(10px)' }),
    order: (r) => -Math.abs(r.x - innerWidth / 2),
    ease: 'back.out(1.25)',
  },
  {
    name: 'sweep',
    particles: 2,
    out: () => ({ x: -160, skewX: 10, filter: 'blur(8px)' }),
    in: () => ({ x: 220, skewX: -12, filter: 'blur(10px)' }),
    order: (r) => r.x,
  },
  {
    name: 'rise',
    particles: 3,
    out: () => ({ y: -90, z: -140, rotationX: 22, filter: 'blur(10px)' }),
    in: () => ({ y: 140, z: -120, rotationX: -32, scale: 0.94, filter: 'blur(8px)' }),
    order: (r) => -r.y,
  },
  {
    name: 'scatter',
    particles: 4,
    out: (r, c) => ({ x: (r.x - c.x) * 0.35, y: (r.y - c.y) * 0.35, z: 160, scale: 1.18, filter: 'blur(16px)' }),
    in: (r, c) => ({ x: (r.x - c.x) * -0.25, y: (r.y - c.y) * -0.25, z: -420, scale: 0.6, filter: 'blur(12px)' }),
  },
  {
    name: 'helix',
    particles: 5,
    out: (r, c) => ({ rotationY: r.x < c.x ? 70 : -70, z: -220, filter: 'blur(8px)' }),
    in: (r, c) => ({ rotationY: r.x < c.x ? -75 : 75, z: -220, filter: 'blur(8px)' }),
    order: (r) => r.x,
    ease: 'expo.out',
  },
];
let lastMorph = -1;
function pickMorph(): Morph {
  const forced = (window as unknown as { __odinMorph?: number }).__odinMorph;
  if (typeof forced === 'number') return MORPHS[forced % MORPHS.length];
  let i = Math.floor(Math.random() * MORPHS.length);
  if (i === lastMorph) i = (i + 1 + Math.floor(Math.random() * (MORPHS.length - 1))) % MORPHS.length;
  lastMorph = i;
  return MORPHS[i];
}

/** Floor scenes push the camera onto the interior floor (wide screens); the environment blurs like every answer. */
function applyEnv(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  const floor = s?.env === 'floor' && home.mode === 'wide';
  // Pan so the journey (centred on FLOOR_CX in the reference frame) sits mid-screen.
  const sx = Math.min(home.height / 1080, home.width / 1920);
  envView.target = floor ? floorView(home.width, home.height, (FLOOR_CX - 960) * sx) : { ...REST_VIEW };
  useStage.getState().setFocus(s ? 1 : 0);
}

function presenceFor(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  if (!s) return { x: home.globe.x, y: home.globe.y, r: home.globe.r, form: 1 };
  return composeScene(s, home).presence;
}

/** Ask ODIN a question (typed now; transcribed speech later). */
export function ask(text: string) {
  const q = text.trim();
  if (!q) return;
  const st = useExperience.getState();
  const intent = matchQuestion(q)?.intent ?? parse(q, st.lastIntent);
  useExperience.setState({ heard: q });
  if (intent.type === 'back') {
    const history = [...st.history];
    const prev = history.length ? history.pop()! : null;
    void go(prev, history);
    return;
  }
  const next = answer(intent);
  useExperience.setState({ lastIntent: intent.type === 'home' ? undefined : intent });
  void go(next, next ? [...st.history, st.active] : []);
}

async function go(next: SceneAnswer | null, history: (SceneAnswer | null)[]) {
  const my = ++token;
  const reduced = prefersReducedMotion();
  stopSpeech();
  gsap.killTweensOf('[data-morph]');
  // Finish any interrupted morph instantly.
  if (useExperience.getState().leaving !== undefined) useExperience.setState({ leaving: undefined });

  useExperience.setState({ phase: 'thinking' });
  await sleep(reduced ? 80 : 560);
  if (my !== token) return;

  const prev = useExperience.getState().active;
  if (prev?.id === next?.id && next !== null) return;
  const outEls = morphEls(prev);
  const outInfo = outEls.map((el) => ({ el, key: el.dataset.morph!, rect: rectOf(el), accent: el.dataset.accent ?? '#7fb6ff' }));

  useExperience.setState({ active: next, leaving: prev, phase: 'morphing', history });
  applyEnv(next);
  await frame();
  if (my !== token) return;

  const inEls = morphEls(next);
  const outByKey = new Map(outInfo.map((o) => [o.key, o]));
  const tl = gsap.timeline();

  // Particle stream from old shapes, through ODIN, into new ones.
  const via = presence.target.form > 0.5 ? { x: presence.target.x, y: presence.target.y } : presenceFor(null);
  const fromRects: FxRect[] = outInfo.map((o) => ({ ...o.rect, accent: o.accent }));
  const toRects: FxRect[] = inEls.map((el) => ({ ...rectOf(el), accent: el.dataset.accent ?? '#7fb6ff' }));
  const m = pickMorph();
  const c = { x: innerWidth / 2, y: innerHeight / 2 };
  useExperience.setState({ morph: m.name });
  if (!reduced) {
    burst(fromRects, toRects, via, m.particles);
    playMorph(m.name);
  }

  // Globe: dissolve into particles, travel, or re-form.
  presence.followHome = false;
  Object.assign(presence.target, presenceFor(next));
  // Core presence: sit exactly in the component's core as actually laid out.
  // [data-presence="k"] gives the radius as a fraction of the core's short side.
  if (next?.presence === 'core') {
    const core = document.querySelector<HTMLElement>(`${layerSel(next)} [data-presence]`);
    const ring = core ?? document.querySelector<HTMLElement>(`${layerSel(next)} [data-aura]`);
    const r = ring ? rectOf(ring) : null;
    if (ring && r && r.w > 4) {
      const k = core ? parseFloat(core.dataset.presence || '0.27') : 0.27;
      Object.assign(presence.target, { x: r.x, y: r.y, r: Math.min(r.w, r.h) * k, form: 1 });
    }
  }

  const P = 1300;
  const rank = <T,>(items: T[], at: (x: T) => { x: number; y: number }) => {
    if (!m.order) return items.map((_, i) => i);
    const idx = items.map((x, i) => ({ i, k: m.order!(at(x)) })).sort((a, b) => a.k - b.k);
    const pos = new Array(items.length);
    idx.forEach((v, n) => (pos[v.i] = n));
    return pos as number[];
  };
  const outRank = rank(outInfo, (o) => o.rect);
  outInfo.forEach((o, i) => {
    if (inEls.some((el) => el.dataset.morph === o.key)) {
      tl.to(o.el, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0.05);
    } else {
      tl.to(
        o.el,
        { opacity: 0, ...m.out(o.rect, c), transformPerspective: P, duration: reduced ? 0.01 : 0.55, ease: 'power2.in' },
        outRank[i] * 0.04,
      );
    }
  });

  const inRects = inEls.map(rectOf);
  const inRank = rank(inRects, (r) => r);
  inEls.forEach((el, i) => {
    const shared = outByKey.get(el.dataset.morph!);
    const r = inRects[i];
    if (shared && !reduced) {
      // Shared object: travel and reshape from where it was.
      tl.fromTo(
        el,
        { x: shared.rect.x - r.x, y: shared.rect.y - r.y, scaleX: shared.rect.w / r.w, scaleY: shared.rect.h / r.h, opacity: 0.4, transformPerspective: P },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 1.0, ease: 'expo.inOut', clearProps: 'transform' },
        0.1,
      );
    } else {
      tl.fromTo(
        el,
        { opacity: 0, ...m.in(r, c), transformPerspective: P },
        {
          opacity: 1, x: 0, y: 0, z: 0, rotation: 0, rotationX: 0, rotationY: 0, skewX: 0, scale: 1, filter: 'blur(0px)',
          duration: reduced ? 0.01 : 0.95, ease: m.ease ?? 'expo.out', clearProps: 'transform,filter',
        },
        reduced ? 0 : 0.42 + inRank[i] * 0.07,
      );
    }
  });

  await tl.then();
  if (my !== token) return;
  useExperience.setState({ leaving: undefined, phase: 'speaking' });
  presence.followHome = next === null;
  auraFor(next);
  startSpeechPreview(next ? next.spoken : homeSpoken());
}

// Speaking ends → idle.
useCaption.subscribe((c, p) => {
  if (p.speaking && !c.speaking && useExperience.getState().phase === 'speaking') useExperience.setState({ phase: 'idle' });
});

// Keep the aura on the focus object when the layout changes.
useLayout.subscribe(() => {
  const st = useExperience.getState();
  applyEnv(st.active);
  if (st.phase !== 'morphing') requestAnimationFrame(() => auraFor(st.active));
});

export function speakCurrent() {
  const a = useExperience.getState().active;
  startSpeechPreview(a ? a.spoken : homeSpoken());
  useExperience.setState({ phase: 'speaking' });
}

if (import.meta.env.DEV) {
  // Dev/handover hooks: ask, and the scene spec a question produces (data contract samples).
  const w = window as unknown as Record<string, unknown>;
  w.__odinAsk = ask;
  w.__odinAnswer = (q: string) => answer(matchQuestion(q)?.intent ?? parse(q));
  w.__odinIntent = (q: string) => matchQuestion(q)?.intent ?? parse(q);
  w.__odinViews = VIEWS;
  w.__odinQuestions = QUESTIONS;
}
