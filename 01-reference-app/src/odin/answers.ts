import type { ComponentSpec, Intent, Placed, SceneAnswer } from './types';
import {
  CENTRES, COUNTRIES, JOURNEYS, OCCUPATIONS, PURPOSES, VISA_TYPES, findCentre, findCountry, findVisa, journeyCounts, periods,
  queueAging, revenuePreview, onlineJourneyMap, slice, timeStats, topCentres, topNationalities, topResidence, totals,
  type Channel, type Filters,
} from './vas';
import { formatCount } from '../lib/format';
import { useLayout } from '../state/layout';
import { composeHomeSummary } from '../data/homeSummary';
import { useHomeFeed } from '../data/homeFeed';

/**
 * Answer engine: Intent → SceneAnswer. Every sentence is built from the same
 * numbers the components display (spoken/visual parity). Observations only:
 * no causes, forecasts or judgements (Magic Box 06).
 */

const C = {
  blue: '#4f9cff', amber: '#f5ac45', green: '#3ed6a0', violet: '#a67cff', red: '#ff5d6c', cyan: '#4fd6ff',
};

let seq = 0;
const nextId = () => `scene-${++seq}`;
const days = (n: number) => `${n.toFixed(1)} days`;
const pct = (n: number) => `${n.toFixed(1)}%`;

/** Human description of filters, e.g. "for 30-day tourist visas from India". */
function describe(f: Filters, opts: { channel?: boolean } = {}) {
  const parts: string[] = [];
  const visa = findVisa(f.visaType);
  const country = findCountry(f.country);
  const centre = findCentre(f.centre);
  if (visa) parts.push(`for ${visa.name.toLowerCase()} visas`);
  if (centre) parts.push(`at ${centre.name}`);
  else if (country) parts.push(`from ${country.name}`);
  if (opts.channel !== false && f.channel && !centre) parts.push(f.channel === 'online' ? 'submitted online' : 'submitted at centres');
  return parts.join(' ');
}

function titleSuffix(f: Filters) {
  const d = describe(f);
  return d ? ` · ${d.charAt(0).toUpperCase()}${d.slice(1)}` : '';
}

function scene(a: Omit<SceneAnswer, 'id'>): SceneAnswer {
  return { id: nextId(), ...a };
}

const place = (spec: ComponentSpec, slot: string): Placed => ({ spec, slot });

// ───────────────────────────── Journey ─────────────────────────────
function journey(channel: Channel, f: Filters, intent: Intent): SceneAnswer {
  if (channel === 'centre') return centreJourney(f, intent);
  const j = journeyCounts(channel, f);
  const def = JOURNEYS[channel];
  // Applications currently waiting at each stage = reached this stage − reached next.
  const waiting = j.stages.map((s, i) => s.count - (j.stages[i + 1]?.count ?? j.approved.count + j.rejected.count));
  const maxIdx = waiting.indexOf(Math.max(...waiting));
  const busiest = j.stages[maxIdx];
  const who = describe({ ...f, channel: undefined });
  const subject = 'online applications';

  const m = onlineJourneyMap(f);
  const fc = formatCount;
  const pctOf = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)} percent`;
  const floor = {
    home: { metric: m.today.count, delta: m.today.delta, say: `Every journey starts at home. ${fc(m.today.count)} applications entered processing today.` },
    sub: { metric: m.submitted.count, delta: m.submitted.delta, say: `${fc(m.submitted.count)} online applications have been submitted${who ? ` ${who}` : ''}.` },
    pay: { metric: m.paid.count, delta: m.paid.delta, say: `${fc(m.paid.count)} have paid, ${pctOf(m.paid.count, m.submitted.count)} of submissions.` },
    vas: { metric: m.vasReview.count, delta: m.vasReview.delta, say: `VAS has reviewed ${fc(m.vasReview.count)} applications.` },
    toicp: { metric: m.toIcp.count, delta: m.toIcp.delta, say: `${fc(m.toIcp.count)} files have been submitted to ICP.` },
    icp1: { metric: m.icpReview.count, delta: m.icpReview.delta, say: `ICP is reviewing ${fc(m.icpReview.count)} applications. Some need biometrics first.` },
    okTop: { metric: m.approvedDirect.count, delta: m.approvedDirect.delta, say: `${fc(m.approvedDirect.count)} were approved directly, with no biometric required.` },
    bio1: { metric: m.bioRequest.count, delta: m.bioRequest.delta, say: `ICP asked ${fc(m.bioRequest.count)} applicants to give biometrics.` },
    bio2: { metric: m.bioScheduled.count, delta: m.bioScheduled.delta, say: `${fc(m.bioScheduled.count)} have scheduled a biometrics appointment.` },
    bio3: { metric: m.bioDone.count, delta: m.bioDone.delta, say: `${fc(m.bioDone.count)} have completed their biometrics.` },
    icp2: { metric: m.icpAfterBio.count, delta: m.icpAfterBio.delta, say: `ICP has ${fc(m.icpAfterBio.count)} applications in final review after biometrics.` },
    okBot: { metric: m.approvedAfterBio.count, delta: m.approvedAfterBio.delta, say: `${fc(m.approvedAfterBio.count)} were approved after biometrics. ${fc(m.approvedTotal)} approved in total.` },
    no: { metric: m.rejected.count, delta: m.rejected.delta, say: `${fc(m.rejected.count)} applications were rejected.` },
  };
  const spoken =
    `There are ${formatCount(j.total)} ${subject}${who ? ` ${who}` : ''}. ` +
    `${busiest.label} currently holds the most, with ${formatCount(waiting[maxIdx])} waiting and an average of ${days(busiest.days)} at that stage. ` +
    `${formatCount(j.approved.count)} have been approved and ${formatCount(j.rejected.count)} rejected; end to end takes ${days(j.endToEnd)} on average.`;

  return scene({
    intent,
    template: 'floor',
    env: 'floor',
    title: def.title,
    subtitle: `From your home to a brighter tomorrow${titleSuffix({ ...f, channel: undefined })}`,
    focusKey: 'journey',
    presence: 'dissolved',
    components: [
      place(
        { kind: 'metric', key: 'total-online', label: 'Total online applications', value: j.total, format: 'count', icon: 'applications', accent: C.blue, caption: who ? `${who}` : 'since launch', delta: { value: j.totalDelta, unit: 'percent', basis: 'vs yesterday' }, spark: { kind: 'bars', values: j.hourly } },
        'tl',
      ),
      place({ kind: 'metric', key: 'e2e-online', label: 'Average end-to-end time', value: j.endToEnd, format: 'days', icon: 'clock', accent: C.cyan, caption: 'submission to final decision', delta: { value: j.endToEndDelta, unit: 'days', basis: 'vs yesterday', goodWhen: 'down' }, spark: { kind: 'line', values: [5.1, 4.9, 4.8, 4.9, 4.5, 4.4, 4.2, 4.3, 4.0, j.endToEnd] } }, 'tr'),
      place(
        {
          kind: 'journey',
          key: 'journey',
          channel,
          stages: j.stages.map((s) => ({ key: s.key, label: s.label, sub: s.sub, icon: s.icon, accent: s.accent, count: s.count, days: s.days, delta: s.delta })),
          approved: j.approved,
          rejected: j.rejected,
          emphasisKey: busiest.key,
          floor,
        },
        'main',
      ),
    ],
    // Wide: opening line = the Home stop, then the floor tour narrates each stage.
    // Phones/portrait (vertical journey, no tour): the full summary sentence.
    spoken: useLayout.getState().home.mode === 'wide' ? floor.home.say : spoken,
    summary: useLayout.getState().home.mode === 'wide' ? {
      primary: `${formatCount(m.submitted.count)} online applications on the journey · ${formatCount(m.approvedTotal)} approved · ${formatCount(m.rejected.count)} rejected.`,
      secondary: `${formatCount(m.bioRequest.count)} took the biometric route · ${days(m.endToEnd)} end to end on average.`,
    } : {
      primary: `${busiest.label} holds the most ${subject} right now: ${formatCount(waiting[maxIdx])} waiting.`,
      secondary: `Average ${days(busiest.days)} at this stage · ${days(j.endToEnd)} end to end · ${formatCount(j.approved.count)} approved, ${formatCount(j.rejected.count)} rejected.`,
    },
  });
}

/** F07b (v2): centre visits — appointments through biometrics; unconfirmed stages shown as Not available. */
function centreJourney(f: Filters, intent: Intent): SceneAnswer {
  const j = journeyCounts('centre', f);
  const def = JOURNEYS.centre;
  const who = describe({ ...f, channel: undefined });
  const bio = j.stages.find((s) => s.key === 'biometrics')!;
  const live = j.stages.filter((s) => !s.unavailable);
  const spoken =
    `There are ${formatCount(j.total)} centre appointments booked${who ? ` ${who}` : ''}. ` +
    `${formatCount(bio.count)} biometrics have been captured and ${formatCount(j.approved.count)} visits are complete. ` +
    `Arrival at the centre isn't captured yet, so that stage is not available.`;
  return scene({
    intent,
    template: 'journey',
    title: def.title,
    subtitle: `Centre visits after online submission: appointment, payment, biometrics and interview${titleSuffix({ ...f, channel: undefined })}`,
    focusKey: 'journey',
    presence: 'dissolved',
    components: [
      place({ kind: 'metric', key: 'total-appointments', card: 'hero', label: 'Appointments booked', value: j.total, format: 'count', icon: 'centre', accent: C.amber, caption: who ? `${who}` : 'since launch', delta: { value: j.totalDelta, unit: 'percent', basis: 'vs yesterday' }, spark: { kind: 'bars', values: j.hourly } }, 'tl'),
      place({ kind: 'metric', key: 'biometrics-captured', card: 'hero', label: 'Biometrics captured', value: bio.count, format: 'count', icon: 'approved', accent: C.green, caption: 'at centres', delta: { value: bio.delta ?? 0, unit: 'percent', basis: 'vs yesterday' }, spark: { kind: 'bars', values: j.hourly.map((v) => Math.round(v * 0.9)) } }, 'tr'),
      place(
        {
          kind: 'journey',
          key: 'journey',
          channel: 'centre',
          stages: j.stages.map((s) => ({ key: s.key, label: s.label, sub: s.sub, icon: s.icon, accent: s.accent, count: s.count, days: s.days, delta: s.delta, unavailable: s.unavailable })),
          approved: j.approved,
          rejected: j.rejected,
          outcomeLabels: { good: 'Visit completed', bad: 'Missed or rescheduled', goodShort: 'Completed', badShort: 'Missed' },
          emphasisLabel: 'Highest volume',
          emphasisKey: live.reduce((b, s) => (s.count > b.count ? s : b), live[0]).key,
        },
        'main',
      ),
    ],
    spoken,
    summary: {
      primary: `${formatCount(j.total)} centre appointments · ${formatCount(bio.count)} biometrics captured.`,
      secondary: `${formatCount(j.approved.count)} visits complete · arrival events not yet captured.`,
    },
  });
}

// ───────────────────────────── Outcomes ─────────────────────────────
function outcomes(f: Filters, intent: Intent): SceneAnswer {
  const s = slice(f);
  const who = describe(f);
  const share = (n: number) => (s.applications ? (n / s.applications) * 100 : 0);
  const spoken =
    `Of ${formatCount(s.applications)} applications${who ? ` ${who}` : ''}, ${formatCount(s.approved)} have been approved and ${formatCount(s.rejected)} rejected. ` +
    `${formatCount(s.inProcessing)} are still in processing, which puts the closure rate at ${pct(s.closureRate)}.`;
  return scene({
    intent,
    template: 'outcomes',
    title: 'Application Outcomes',
    subtitle: `Current status of every application${who ? ` ${who}` : ' since launch'}`,
    focusKey: 'donut',
    presence: 'core',
    components: [
      place({ kind: 'metric', key: 'total-applications', label: 'Total applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, caption: who || 'since launch' }, 'tl'),
      place(
        {
          kind: 'donut',
          key: 'donut',
          total: s.applications,
          totalLabel: 'Total applications',
          basis: 'Current status · each application counted once',
          segments: [
            { key: 'approved', label: 'Approved', count: s.approved, accent: C.green },
            { key: 'processing', label: 'In processing', count: s.inProcessing, accent: C.blue },
            { key: 'rejected', label: 'Rejected', count: s.rejected, accent: C.red },
            { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: C.violet },
          ],
        },
        'main',
      ),
      place(
        {
          kind: 'facts',
          key: 'facts',
          title: 'Key facts',
          items: [
            { icon: 'approved', text: `${formatCount(s.approved)} approved`, sub: `${pct(share(s.approved))} of all applications`, accent: C.green },
            { icon: 'rejected', text: `${formatCount(s.rejected)} rejected`, sub: `${pct(s.rejected / Math.max(1, s.approved + s.rejected) * 100)} of decisions`, accent: C.red },
            { icon: 'processing', text: `${formatCount(s.inProcessing)} in processing`, sub: 'awaiting a final decision', accent: C.blue },
          ],
          ring: { label: 'Closure rate', value: s.closureRate, basis: 'closed ÷ all applications' },
        },
        'tr',
      ),
    ],
    spoken,
    summary: {
      primary: `${formatCount(s.approved)} approved, ${formatCount(s.rejected)} rejected, ${formatCount(s.inProcessing)} in processing.`,
      secondary: `Closure rate ${pct(s.closureRate)} of ${formatCount(s.applications)} applications${who ? ` ${who}` : ''}.`,
    },
  });
}

// ───────────────────────────── Processing time ─────────────────────────────
function time(f: Filters, intent: Intent): SceneAnswer {
  const s = slice(f);
  const overall = slice({ channel: f.channel });
  const who = describe(f) || 'across all applications';
  const diff = +(s.avgDays - overall.avgDays).toFixed(1);
  const hasSlice = !!(f.country || f.visaType || f.centre);
  const ch: Channel = f.centre ? 'centre' : f.channel ?? 'online';
  const longest = [...s.stageDays].sort((a, b) => b.days - a.days)[0];

  const spoken =
    `Applications ${who} take ${days(s.avgDays)} on average from submission to decision` +
    (hasSlice ? `, ${Math.abs(diff).toFixed(1)} days ${diff >= 0 ? 'longer' : 'shorter'} than the overall average of ${days(overall.avgDays)}. ` : '. ') +
    `The longest stage is ${longest.label}, at ${days(longest.days)}.`;

  const components: Placed[] = [
    place(
      {
        kind: 'metric', key: 'avg-time', label: 'Average processing time', value: s.avgDays, format: 'days', icon: 'clock', accent: C.cyan, hero: true,
        caption: who,
        delta: hasSlice ? { value: diff, unit: 'days', basis: `vs overall ${days(overall.avgDays)}`, goodWhen: 'down' } : undefined,
      },
      'hero',
    ),
    place(
      { kind: 'bars', key: 'stage-times', title: `Time at each stage · ${ch === 'online' ? 'online' : 'centre'} journey`, basis: 'average days per stage', format: 'days', accent: C.violet, items: s.stageDays.map((d) => ({ key: d.key, label: d.label, value: d.days })) },
      'right',
    ),
    place({ kind: 'metric', key: 'apps-slice', label: 'Applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, caption: hasSlice ? who : 'since launch' }, 'left1'),
    place({ kind: 'metric', key: 'in-proc-slice', label: 'In processing now', value: s.inProcessing, format: 'count', icon: 'processing', accent: C.amber, caption: 'awaiting decision' }, 'left2'),
  ];
  return scene({
    intent,
    template: 'focus',
    title: 'Processing Time',
    subtitle: `Average time from submission to final decision${titleSuffix(f)}`,
    focusKey: 'avg-time',
    presence: 'dissolved',
    components,
    spoken,
    summary: {
      primary: `${days(s.avgDays)} average processing time ${who}.`,
      secondary: `Longest stage: ${longest.label} (${days(longest.days)})${hasSlice ? ` · overall average ${days(overall.avgDays)}` : ''}.`,
    },
  });
}

// ───────────────────────────── Counts ─────────────────────────────
function count(f: Filters, intent: Intent): SceneAnswer {
  const s = slice(f);
  const who = describe(f) || 'since launch';
  const spoken =
    `There are ${formatCount(s.applications)} applications ${who}. ${formatCount(s.inProcessing)} are in processing, ` +
    `${formatCount(s.approved)} approved and ${formatCount(s.rejected)} rejected.`;
  return scene({
    intent,
    template: 'focus',
    title: 'Applications',
    subtitle: `Application volume${titleSuffix(f)}`,
    focusKey: 'apps-hero',
    presence: 'dissolved',
    components: [
      place({ kind: 'metric', key: 'apps-hero', label: 'Applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, hero: true, caption: who }, 'hero'),
      place(
        { kind: 'bars', key: 'status-bars', title: 'Current status', basis: 'applications', format: 'count', accent: C.green, items: [
          { key: 'processing', label: 'In processing', value: s.inProcessing },
          { key: 'approved', label: 'Approved', value: s.approved },
          { key: 'rejected', label: 'Rejected', value: s.rejected },
          { key: 'closed', label: 'Closed · other', value: s.closedOther },
        ] },
        'right',
      ),
      place({ kind: 'metric', key: 'in-proc', label: 'In processing', value: s.inProcessing, format: 'count', icon: 'processing', accent: C.cyan, caption: 'awaiting a final decision' }, 'left1'),
      place({ kind: 'metric', key: 'approval-rate', label: 'Approval rate', value: s.approvalRate, format: 'percent', icon: 'approved', accent: C.green, caption: 'of decided applications' }, 'left2'),
    ],
    spoken,
    summary: {
      primary: `${formatCount(s.applications)} applications ${who}.`,
      secondary: `${formatCount(s.inProcessing)} in processing · ${formatCount(s.approved)} approved · ${formatCount(s.rejected)} rejected.`,
    },
  });
}

// ───────────────────────────── Rankings ─────────────────────────────
function ranking(intent: Extract<Intent, { type: 'ranking' }>): SceneAnswer {
  const { dimension, measure, order, filters } = intent;
  type Row = { key: string; code?: string; label: string; sub?: string; value: number };
  let rows: Row[] = [];
  if (dimension === 'country') {
    rows = COUNTRIES.filter((c) => c.code !== 'OT').map((c) => {
      const s = slice({ ...filters, country: c.code });
      return { key: c.code, code: c.code, label: c.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${formatCount(s.applications)} applications` };
    });
  } else if (dimension === 'centre') {
    rows = CENTRES.map((c) => {
      const s = slice({ centre: c.key });
      const country = findCountry(c.country)!;
      return { key: c.key, code: country.code, label: c.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${country.name} · ${formatCount(s.applications)} applications` };
    });
  } else {
    rows = VISA_TYPES.map((v) => {
      const s = slice({ ...filters, visaType: v.key });
      return { key: v.key, label: v.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${formatCount(s.applications)} applications` };
    });
  }
  rows.sort((a, b) => (order === 'desc' ? b.value - a.value : a.value - b.value));
  const top = rows.slice(0, dimension === 'visaType' ? 6 : 8);
  const dimName = dimension === 'country' ? 'nationalities' : dimension === 'centre' ? 'centres' : 'visa types';
  const measureName = measure === 'applications' ? 'applications' : measure === 'approvalRate' ? 'approval rate' : 'average processing time';
  const orderWord =
    measure === 'avgDays' ? (order === 'desc' ? 'slowest first' : 'fastest first') : order === 'desc' ? 'highest first' : 'lowest first';
  const fmt = measure === 'applications' ? 'count' : measure === 'approvalRate' ? 'percent' : 'days';
  const val = (n: number) => (fmt === 'count' ? formatCount(n) : fmt === 'percent' ? pct(n) : days(n));
  const who = describe(filters);
  const lead = top[0];
  const second = top[1];
  const spoken =
    `Ranked by ${measureName}${who ? ` ${who}` : ''}, ${lead.label} ${measure === 'avgDays' ? (order === 'desc' ? 'is the slowest' : 'is the fastest') : order === 'desc' ? 'leads' : 'is lowest'} at ${val(lead.value)}, ` +
    `followed by ${second.label} at ${val(second.value)}.` +
    (measure === 'avgDays' ? ' This ranks observed processing times; it does not explain why they differ.' : '');

  return scene({
    intent,
    template: 'focus',
    title: `${dimension === 'country' ? 'Nationalities' : dimension === 'centre' ? 'Centres' : 'Visa types'} by ${measureName}`,
    subtitle: `${dimName.charAt(0).toUpperCase()}${dimName.slice(1)} ranked by ${measureName}, ${orderWord}${who ? ` · ${who}` : ''}`,
    focusKey: 'ranking',
    presence: 'dissolved',
    components: [
      place({ kind: 'ranking', key: 'ranking', title: `Top ${top.length} ${dimName}`, basis: `${measureName} · ${orderWord}`, format: fmt, items: top, highlight: 0, accent: measure === 'avgDays' ? C.violet : C.blue }, 'hero'),
      place({ kind: 'metric', key: 'rank-lead', label: measure === 'avgDays' ? (order === 'desc' ? 'Slowest' : 'Fastest') : order === 'desc' ? 'Leading' : 'Lowest', value: lead.value, format: fmt, icon: 'ranking', accent: C.green, caption: lead.label }, 'left1'),
      place({ kind: 'metric', key: 'rank-second', label: 'Next', value: second.value, format: fmt, icon: dimension === 'centre' ? 'centre' : 'globe', accent: C.cyan, caption: second.label }, 'left2'),
    ],
    spoken,
    summary: {
      primary: `${lead.label}: ${val(lead.value)} — ${measureName}, ${orderWord}.`,
      secondary: `Then ${second.label} (${val(second.value)})${top[2] ? ` and ${top[2].label} (${val(top[2].value)})` : ''}.`,
    },
  });
}

// ───────────────────────────── Compare ─────────────────────────────
function compare(intent: Extract<Intent, { type: 'compare' }>): SceneAnswer {
  const sideOf = (e: { kind: string; key: string }, accent: string) => {
    const f: Filters =
      e.kind === 'country' ? { country: e.key } : e.kind === 'centre' ? { centre: e.key } : e.kind === 'visaType' ? { visaType: e.key } : { channel: e.key as Channel, country: intent.filters.country };
    const s = slice(f);
    const label =
      e.kind === 'country' ? findCountry(e.key)!.name : e.kind === 'centre' ? findCentre(e.key)!.name : e.kind === 'visaType' ? findVisa(e.key)!.name : e.key === 'online' ? 'Online' : 'Physical centres';
    return {
      s,
      side: {
        key: e.key,
        code: e.kind === 'country' ? e.key : e.kind === 'centre' ? findCentre(e.key)!.country : undefined,
        label,
        accent,
        rows: [
          { label: 'Applications', value: s.applications, format: 'count' as const },
          { label: 'Approved', value: s.approved, format: 'count' as const },
          { label: 'In processing', value: s.inProcessing, format: 'count' as const },
          { label: 'Approval rate', value: s.approvalRate, format: 'percent' as const },
          { label: 'Avg processing time', value: s.avgDays, format: 'days' as const },
        ],
      },
    };
  };
  const [a, b] = [sideOf(intent.entities[0], C.blue), sideOf(intent.entities[1], C.violet)];
  const spoken =
    `${a.side.label} has ${formatCount(a.s.applications)} applications and ${b.side.label} has ${formatCount(b.s.applications)}. ` +
    `Average processing time is ${days(a.s.avgDays)} for ${a.side.label} and ${days(b.s.avgDays)} for ${b.side.label}; ` +
    `approval rates are ${pct(a.s.approvalRate)} and ${pct(b.s.approvalRate)}.`;
  return scene({
    intent,
    template: 'focus',
    title: `${a.side.label} vs ${b.side.label}`,
    subtitle: 'Same period and definitions · side-by-side',
    focusKey: 'compare',
    presence: 'dissolved',
    components: [place({ kind: 'compare', key: 'compare', sides: [a.side, b.side] }, 'wide')],
    spoken,
    summary: {
      primary: `${a.side.label}: ${formatCount(a.s.applications)} applications · ${b.side.label}: ${formatCount(b.s.applications)}.`,
      secondary: `Avg time ${days(a.s.avgDays)} vs ${days(b.s.avgDays)} · approval ${pct(a.s.approvalRate)} vs ${pct(b.s.approvalRate)}.`,
    },
  });
}

// ───────────────────────────── Unavailable / unsupported ─────────────────────────────
export const SUGGESTIONS = [
  'Show the online visa journey',
  'Show the centre visit journey',
  'What are the application outcomes?',
  'How long do tourist visas from India take?',
  'Top countries by applications',
  'Which centres are slowest?',
  'Compare India and Pakistan',
];

function revenue(intent: Extract<Intent, { type: 'revenue' }>): SceneAnswer {
  // v2 scope: F13a/F13b Green, P1 — validation required. Values are mock until the
  // revenue definition (tax, refunds, currency) is approved by AEGI Finance.
  const r = revenuePreview();
  const top = r.dims[0];
  return scene({
    intent,
    template: 'stage',
    title: 'VAS Revenue',
    subtitle: 'Total and breakdown by country, centre, service and nationality · validation required',
    focusKey: 'revenue',
    presence: 'core',
    components: [
      place({ kind: 'revenue', key: 'revenue', preview: true, validation: true, amount: r.amount, delta: r.delta, dims: r.dims }, 'stage'),
    ],
    spoken:
      `VAS revenue stands at ${fmtAED(r.amount)}, ${r.delta >= 0 ? 'up' : 'down'} ${Math.abs(r.delta).toFixed(1)} percent on the previous period. ` +
      `${top.label} account for the largest share, ${(top.share * 100).toFixed(0)} percent. ` +
      `These figures still need validation against the approved revenue definition.`,
    summary: {
      primary: `VAS revenue ${fmtAED(r.amount)} · ${r.delta >= 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(1)}% vs previous period.`,
      secondary: 'Validation required — revenue definition awaiting AEGI Finance approval (F13a / F13b).',
    },
  });
}

const fmtAED = (n: number) => (n >= 1e6 ? `AED ${(n / 1e6).toFixed(1)} million` : `AED ${Math.round(n / 1e3)} thousand`);

function unsupported(intent: Intent): SceneAnswer {
  return scene({
    intent,
    template: 'notice',
    title: 'I can help with these',
    subtitle: 'Questions about VAS applications, journeys, outcomes and timings',
    focusKey: 'notice',
    presence: 'dissolved',
    components: [place({ kind: 'notice', key: 'notice', title: "I didn't catch a question I can answer", text: 'Try asking about applications, the online or centre journey, outcomes, processing times, or compare countries and centres.', suggestions: SUGGESTIONS.slice(0, 5) }, 'hero')],
    spoken: "I'm not able to answer that yet. You can ask about applications, journeys, outcomes or processing times.",
    summary: { primary: "I can't answer that yet.", secondary: 'Ask about applications, journeys, outcomes or processing times.' },
  });
}

// ───────────────────────────── Processing now (BQ01) ─────────────────────────────
function processing(intent: Intent): SceneAnswer {
  const t = totals();
  const enteredDiff = t.entered - 294;
  // Decided today: approvals from the Home feed; rejections mock (same-day ratio).
  const rejectedToday = Math.round(t.approvedToday * 0.155);
  const decided = t.approvedToday + rejectedToday;
  const net = t.entered - decided;
  // Where the open applications are now (stage queue, reconciled to the in-processing total).
  const q = queueAging('online');
  const qSum = q.reduce((a, x) => a + x.waiting, 0) || 1;
  let left = t.inProcessing;
  const stages = q.map((x, i) => {
    const n = i === q.length - 1 ? left : Math.round((x.waiting / qSum) * t.inProcessing);
    left -= n;
    return { key: x.key, label: x.label, count: n, share: n / Math.max(1, t.inProcessing), accent: /icp/i.test(x.key) ? C.violet : C.blue };
  });
  const top = stages.reduce((b, x) => (x.count > b.count ? x : b), stages[0]);
  stages.forEach((x) => { (x as { top?: boolean }).top = x === top; });
  const share = (t.inProcessing / Math.max(1, t.total)) * 100;
  return scene({
    intent,
    template: 'board',
    title: 'Applications in Processing',
    subtitle: 'Live inventory and today’s movement',
    focusKey: 'board',
    // The glass sphere stands in for ODIN's globe here; ODIN stays present as its voice spectrum.
    presence: 'dissolved',
    components: [
      place({
        kind: 'board', key: 'board',
        hero: { value: t.inProcessing, label: 'In processing now', delta: net, deltaBasis: 'since the start of today', caption: 'Awaiting a final decision' },
        orb: 'glass',
        capsules: [
          { id: 'entered-today', label: 'Entered processing today', value: t.entered, format: 'count', accent: '#4f9cff', icon: 'entered', delta: { value: enteredDiff, unit: 'count', basis: 'vs yesterday, same time' } },
          { id: 'decided-today', label: 'Decided today', value: decided, format: 'count', accent: '#3ed6a0', icon: 'approved', detail: `${formatCount(t.approvedToday)} approved · ${formatCount(rejectedToday)} rejected` },
          { id: 'most-waiting', label: `Most waiting · ${top.label}`, value: top.count, format: 'count', accent: '#a67cff', icon: 'revenue', detail: `${Math.round(top.share * 100)}% of open applications` },
          { id: 'open-share', label: 'Still open', value: +share.toFixed(1), format: 'percent', accent: '#4fd6ff', icon: 'closure', detail: `of ${formatCount(t.total)} since launch` },
        ],
        stagesTitle: `Where the ${formatCount(t.inProcessing)} are now`,
        stages,
      }, 'main'),
      // Phones / portrait: the compact focus arrangement.
      place({ kind: 'metric', key: 'in-proc-hero', label: 'In processing now', value: t.inProcessing, format: 'count', icon: 'processing', accent: C.blue, hero: true, caption: 'awaiting a final decision' }, 'hero'),
      place({ kind: 'metric', key: 'entered-today', label: 'Entered processing today', value: t.entered, format: 'count', icon: 'applications', accent: C.cyan, delta: { value: enteredDiff, unit: 'count', basis: 'vs yesterday, same time' } }, 'left1'),
      place({ kind: 'metric', key: 'decided-today', label: 'Decided today', value: decided, format: 'count', icon: 'approved', accent: C.green, caption: `${formatCount(t.approvedToday)} approved · ${formatCount(rejectedToday)} rejected` }, 'left2'),
    ],
    spoken: `${formatCount(t.inProcessing)} applications are in processing. ${formatCount(t.entered)} entered today and ${formatCount(decided)} were decided, so the queue is ${net >= 0 ? 'up' : 'down'} ${formatCount(Math.abs(net))} since this morning. ${top.label} holds the most, ${formatCount(top.count)}.`,
    summary: { primary: `${formatCount(t.inProcessing)} applications in processing now.`, secondary: `${formatCount(t.entered)} entered today · ${formatCount(decided)} decided · ${top.label} holds the most.` },
  });
}

// ───────────────────────────── Time matrix (BQ04, BQ07–BQ10) ─────────────────────────────

function timeMatrix(intent: Extract<Intent, { type: 'timeMatrix' }>): SceneAnswer {
  const ch = intent.channel;
  const st = timeStats(ch, intent.filters);
  const label = ch === 'centre' ? 'Centre visit' : ch === 'online' ? 'Online' : 'All';
  const who = describe(intent.filters);
  // Online: the five reporting stages of the approved matrix design. Biometric-branch
  // splits of ICP time are a design preview (F25 red) until ICP events are mapped.
  if (ch !== 'centre') {
    const d = Object.fromEntries(st.stages.map((x) => [x.key, x.days]));
    const r1 = (n: number) => +n.toFixed(1);
    const icp = d['icp'] ?? 2.2;
    st.stages = [
      { key: 'subpay', label: 'Submission & Payment', icon: 'submit', accent: C.blue, days: r1((d['submission'] ?? 0.4) + (d['payment'] ?? 0.2)) },
      { key: 'vas-review', label: 'VAS Internal Review', icon: 'review', accent: C.blue, days: r1((d['vas-review'] ?? 0.6) * 0.85) },
      { key: 'icp-pre', label: 'ICP Pre-Biometric', icon: 'checkin', accent: C.violet, days: r1((d['to-icp'] ?? 0.4) + icp * 0.18) },
      { key: 'bio', label: 'Applicant Biometric Window', icon: 'biometric', accent: C.blue, days: r1(icp * 0.23) },
      { key: 'icp-final', label: 'ICP Final Review', icon: 'documents', accent: C.violet, days: r1(icp * 0.64) },
    ];
    st.longest = st.stages.reduce((b, x) => (x.days > b.days ? x : b), st.stages[0]);
  }
  const stageKey: Record<string, string> = { 'to-icp': 'icp-pre', icp: 'icp-final', biometrics: 'bio' };
  const focus = intent.stage ? st.stages.find((x) => x.key === (ch !== 'centre' ? stageKey[intent.stage!] ?? intent.stage : intent.stage)) : undefined;
  const tabs = ch === 'centre'
    ? [
      { label: 'All online visas', ask: 'online visa processing time matrix' },
      { label: 'Centre visits', ask: 'centre processing time matrix', active: true },
      { label: 'By country', ask: 'which countries are slowest' },
      { label: 'By centre', ask: 'which centres are slowest' },
    ]
    : [
      { label: 'All Online Visas', ask: 'online visa processing time matrix', active: !intent.filters.country },
      { label: 'By Country', ask: 'which countries are slowest' },
      { label: 'By Center', ask: 'which centres are slowest' },
    ];
  const stageSentence = focus
    ? `${focus.label} averages ${days(focus.days)}, out of ${days(st.avg)} end to end.`
    : `The longest stage is ${st.longest.label} at ${days(st.longest.days)}; the fastest is ${st.fastest.label} at ${days(st.fastest.days)}.`;
  return scene({
    intent,
    template: 'matrix',
    title: ch === 'centre' ? 'Centre Visit Processing Time Matrix' : 'Online Visas Processing Time Matrix',
    subtitle: ch === 'centre' ? `Executive view of centre visit processing times${who ? ` · ${who}` : ''}` : `Executive view of total online visa processing times${who ? ` · ${who}` : ''}`,
    focusKey: 'tm',
    presence: 'core',
    components: [
      place(
        {
          kind: 'timeMatrix', key: 'tm', scopeLabel: who || (ch === 'centre' ? 'centre visits' : 'online applications'),
          avg: st.avg, avgDelta: st.avgDelta, median: st.median, medianDelta: st.medianDelta, p90: st.p90, applications: st.applications,
          hourly: st.hourly, fastest: st.fastest, longest: st.longest, stages: st.stages, focusStage: focus?.key, tabs,
          // SLA threshold not yet agreed (scope): shown as Not available.
          sla: null,
          previewNote: ch !== 'centre' ? 'Biometric stage split · design preview' : undefined,
        },
        'stage',
      ),
    ],
    spoken: `${label === 'All' ? 'Visa' : label} applications${who ? ` ${who}` : ''} take ${days(st.avg)} on average end to end, with a median of ${days(st.median)} and 90 percent finishing within ${days(st.p90)}. ${stageSentence}`,
    summary: {
      primary: focus ? `${focus.label}: ${days(focus.days)} on average.` : `${days(st.avg)} average end-to-end processing time.`,
      secondary: `Median ${days(st.median)} · P90 ${days(st.p90)} · longest stage ${st.longest.label} (${days(st.longest.days)}).`,
    },
  });
}

// ───────────────────────────── Queue / aging (BQ13) ─────────────────────────────
function queue(intent: Extract<Intent, { type: 'queue' }>): SceneAnswer {
  const items = queueAging(intent.channel);
  const top = [...items].sort((a, b) => b.waiting - a.waiting)[0];
  const old = items.reduce((a, q) => a + q.buckets.gt3, 0);
  return scene({
    intent,
    template: 'stage',
    title: 'Stage Queue / Aging',
    subtitle: `${intent.channel === 'centre' ? 'Centre' : 'Online'} applications currently waiting at each stage, with age bands`,
    focusKey: 'queue',
    presence: 'dissolved',
    components: [place({ kind: 'queue', key: 'queue', items }, 'stage')],
    spoken: `${top.label} has the most applications waiting, ${formatCount(top.waiting)}, with an average wait of ${days(top.avgWait)}. Across all stages, ${formatCount(old)} have been waiting more than three days. This shows where applications are waiting; it does not establish why.`,
    summary: { primary: `${top.label}: ${formatCount(top.waiting)} waiting now.`, secondary: `${formatCount(old)} applications waiting more than 3 days across all stages.` },
  });
}

// ───────────────────────────── Period comparison (BQ14–BQ17) ─────────────────────────────
function periodsScene(intent: Intent): SceneAnswer {
  const items = periods();
  const [today, yesterday, last7] = items;
  return scene({
    intent,
    template: 'stage',
    title: 'Visa Performance Comparison',
    subtitle: 'Daily and period-over-period comparison across key visa measures',
    focusKey: 'periods',
    presence: 'dissolved',
    components: [place({ kind: 'periods', key: 'periods', items }, 'stage')],
    spoken: `Today ${formatCount(today.value)} visas have been processed, ${Math.abs(today.delta ?? 0).toFixed(1)} percent ${(today.delta ?? 0) >= 0 ? 'more' : 'fewer'} than yesterday at the same time. Over the last seven days ${formatCount(last7.value)} were processed, up ${(last7.delta ?? 0).toFixed(1)} percent on the previous seven days. Yesterday closed at ${formatCount(yesterday.value)}.`,
    summary: { primary: `Today: ${formatCount(today.value)} processed (${(today.delta ?? 0) >= 0 ? '+' : ''}${(today.delta ?? 0).toFixed(1)}% vs yesterday).`, secondary: `Last 7 days ${formatCount(last7.value)} · approval ${today.approval.toFixed(1)}% today.` },
  });
}

// ───────────────────────────── Submission channels (BQ21) ─────────────────────────────
/**
 * BQ21 / F09 (v2): DXC confirmed every application is submitted online; centres are
 * only used later (biometrics). There is no online-versus-centre submission split.
 */
function channels(intent: Intent): SceneAnswer {
  const t = totals();
  return scene({
    intent,
    template: 'notice',
    title: 'Submission channel',
    subtitle: 'All applications are submitted online',
    focusKey: 'notice',
    presence: 'dissolved',
    components: [
      place(
        {
          kind: 'notice',
          key: 'notice',
          title: 'Every application is submitted online',
          text: `All ${formatCount(t.total)} applications were submitted online. Centres are used later for visits such as biometrics, so there is no online-versus-centre submission split to show.`,
          suggestions: ['Show the centre visit journey', 'Show the online visa journey'],
        },
        'hero',
      ),
    ],
    spoken: `All ${formatCount(t.total)} applications were submitted online. Centres are used later for visits such as biometrics, so there's no online-versus-centre split. I can show you the centre visit journey instead.`,
    summary: { primary: 'All applications are submitted online.', secondary: 'Centres handle later visits such as biometrics.' },
  });
}

// ───────────────────────────── Triple ranking (BQ18, BQ22) ─────────────────────────────
function tops(intent: Intent): SceneAnswer {
  const res = topResidence(5);
  const nat = topNationalities(5);
  const cen = topCentres(5);
  const NAT: Record<string, string> = { IN: 'Indian', PK: 'Pakistani', PH: 'Filipino', EG: 'Egyptian', BD: 'Bangladeshi', NP: 'Nepali', LB: 'Lebanese', GB: 'British', NG: 'Nigerian', US: 'American' };
  return scene({
    intent,
    template: 'stage',
    title: 'Top Countries, Nationalities & Centres',
    subtitle: 'Applications by country of residence, applicant nationality and attributed centre',
    focusKey: 'podiums',
    presence: 'core',
    components: [
      place(
        {
          kind: 'podiums',
          key: 'podiums',
          columns: [
            { key: 'res', title: 'Top countries', sub: 'by applications · residence', icon: 'globe', accent: '#f5ac45', items: res.map((r) => ({ label: r.name, code: r.code, value: r.value })) },
            { key: 'nat', title: 'Top nationalities', sub: 'by applications', icon: 'people', accent: '#8b6cff', items: nat.map((n) => ({ label: NAT[n.code] ?? n.name, value: n.value })) },
            { key: 'cen', title: 'Top centres', sub: 'by applications', icon: 'centre', accent: '#33d69a', items: cen.map((c) => ({ label: c.name, value: c.value })) },
          ],
        },
        'stage',
      ),
    ],
    spoken: `By country of residence, ${res[0].name} leads with ${formatCount(res[0].value)} applications. By nationality, ${NAT[nat[0].code] ?? nat[0].name} applicants lead with ${formatCount(nat[0].value)}. ${cen[0].name} has the most applications of any centre, ${formatCount(cen[0].value)}.`,
    summary: { primary: `${res[0].name} leads by residence; ${NAT[nat[0].code] ?? nat[0].name} by nationality.`, secondary: `${cen[0].name} has the most centre applications (${formatCount(cen[0].value)}).` },
  });
}

// ───────────────────────────── Earth geo ranking (BQ18) ─────────────────────────────
function geo(intent: Intent): SceneAnswer {
  const items = topResidence(10).map((r) => ({ code: r.code, name: r.name, value: r.value, delta: r.delta, lat: r.lat, lon: r.lon }));
  return scene({
    intent,
    template: 'stage',
    title: 'Top Countries',
    subtitle: 'Applications by country of residence since launch',
    focusKey: 'geo',
    presence: 'dissolved',
    components: [place({ kind: 'geo', key: 'geo', heading: 'Top Countries', subheading: 'By applications', basis: 'Country of residence', period: 'Since launch', items }, 'stage')],
    spoken: `${items[0].name} has the most applications, ${formatCount(items[0].value)}, followed by ${items[1].name} with ${formatCount(items[1].value)} and ${items[2].name} with ${formatCount(items[2].value)}. Countries are by applicant residence, not nationality.`,
    summary: { primary: `${items[0].name} leads with ${formatCount(items[0].value)} applications.`, secondary: `Then ${items[1].name} (${formatCount(items[1].value)}) and ${items[2].name} (${formatCount(items[2].value)}) · by residence.` },
  });
}

// ───────────────────────────── Outcome distribution ring (BQ26) ─────────────────────────────
function outcomeDist(intent: Intent): SceneAnswer {
  const s = slice();
  const t = totals();
  const segs = [
    { key: 'approved', label: 'Approved', count: s.approved, accent: C.green },
    { key: 'processing', label: 'In processing', count: s.inProcessing, accent: C.blue },
    { key: 'rejected', label: 'Rejected', count: s.rejected, accent: C.red },
    { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: C.violet },
  ];
  const sum = segs.reduce((a, x) => a + x.count, 0) || 1;
  const asks: Record<string, string> = {
    approved: 'How many visas have been approved?',
    processing: 'How many visa applications are being processed?',
    rejected: 'How many applications have been rejected, and what are the outcomes?',
    closed: 'What percentage of visa applications have been closed?',
  };
  return scene({
    intent,
    template: 'ringCards',
    title: 'Outcome Distribution',
    subtitle: 'Current status of every application — approvals, rejections, closures and processing',
    focusKey: 'ring',
    presence: 'dissolved',
    components: [
      place({ kind: 'donut', key: 'ring', total: s.applications, totalLabel: 'Total applications', basis: 'Current status · each application counted once', segments: segs, clean: true }, 'main'),
      place({ kind: 'legend', key: 'legend', items: segs.map((x) => ({ ...x, share: x.count / sum, ask: x.key === 'processing' ? asks.processing : undefined })) }, 'legend'),
      place({ kind: 'metric', key: 'total-applications', tile: true, card: 'hero', label: 'Total applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, caption: 'since launch', spark: { kind: 'line', values: [3, 4, 4, 5, 6, 6, 7, 8, 8, 9] }, ask: 'Which countries or nationalities generate the most applications?' }, 'tl'),
      place({ kind: 'metric', key: 'in-proc', tile: true, card: 'hero', label: 'In processing', value: s.inProcessing, format: 'count', icon: 'clock', accent: '#3d84f7', caption: 'awaiting decision', spark: { kind: 'bars', values: [4, 5, 7, 6, 8, 9, 7, 10] }, ask: asks.processing }, 'bl'),
      place({ kind: 'metric', key: 'approved-today', tile: true, card: 'hero', label: 'Approved today', value: t.approvedToday, format: 'count', icon: 'approved', accent: C.green, delta: { value: t.approvedToday - 252, unit: 'count', basis: 'vs yesterday' }, spark: { kind: 'bars', values: [3, 4, 5, 5, 6, 7, 8, 9] }, ask: "How does today's performance compare with yesterday?" }, 'tr'),
      place({ kind: 'metric', key: 'closure', tile: true, card: 'hero', label: 'Visa closure rate', value: s.closureRate, format: 'percent', icon: 'closure', accent: C.violet, caption: 'closed ÷ all applications', delta: { value: 1.2, unit: 'pp', basis: 'vs yesterday' }, spark: { kind: 'bars', values: [4, 5, 5, 6, 7, 7, 8, 9] }, ask: 'What are the application outcomes?' }, 'br'),
    ],
    spoken: `Of ${formatCount(s.applications)} applications, ${formatCount(s.approved)} are approved, ${formatCount(s.rejected)} rejected, ${formatCount(s.closedOther)} closed for other reasons and ${formatCount(s.inProcessing)} still in processing. The closure rate is ${pct(s.closureRate)}.`,
    summary: { primary: `Closure rate ${pct(s.closureRate)}.`, secondary: `${formatCount(s.approved)} approved · ${formatCount(s.rejected)} rejected · ${formatCount(s.inProcessing)} in processing.` },
  });
}

// ───────────────────────────── Purpose / occupation mix (BQ19–BQ20) ─────────────────────────────
function mix(intent: Extract<Intent, { type: 'mix' }>): SceneAnswer {
  const { total } = totals();
  const list = intent.dim === 'purpose' ? PURPOSES : OCCUPATIONS;
  const segs = list.map((p) => ({ key: p.key, label: p.label, count: Math.round(total * p.share), accent: p.accent }));
  const top = segs[0];
  const title = intent.dim === 'purpose' ? 'Travel Purpose Mix' : 'Applicant Occupation Mix';
  return scene({
    intent,
    template: 'stage',
    title,
    subtitle: `${intent.dim === 'purpose' ? 'Recorded visa purpose' : 'Recorded applicant occupation'} · post-October feature, shown for design review (mock)`,
    focusKey: 'ring',
    presence: 'dissolved',
    components: [place({ kind: 'ring', key: 'ring', total, totalLabel: 'Applications', basis: 'Recorded values only · unknowns kept separate', segments: segs }, 'stage')],
    spoken: `${top.label} accounts for the largest share, ${formatCount(top.count)} applications. This uses recorded ${intent.dim === 'purpose' ? 'visa purpose' : 'occupation'} values and is planned after October.`,
    summary: { primary: `${top.label}: ${formatCount(top.count)} applications (largest share).`, secondary: `Recorded ${intent.dim} values · post-October (F${intent.dim === 'purpose' ? '27' : '28'}).` },
  });
}

// ───────────────────────────── Journey map orbs ─────────────────────────────
function journeyMap(intent: Intent): SceneAnswer {
  const base = journey('online', {}, intent);
  const comp = base.components.find((c) => c.spec.kind === 'journey');
  if (comp && comp.spec.kind === 'journey') {
    comp.spec.variant = 'orbs';
    delete comp.spec.floor;
  }
  // Headline cards: hero glass (the online floor journey keeps its own cards).
  for (const c of base.components) if (c.spec.kind === 'metric') c.spec.card = 'hero';
  // The map is its own scene: not the floor journey (no camera push, no tour).
  const j = journeyCounts('online', {});
  return {
    ...base, template: 'journey', env: undefined, title: 'Application Journey Map', subtitle: 'End-to-end application journey with volumes and average time at each stage',
    spoken: `There are ${formatCount(j.total)} online applications on the journey. ${formatCount(j.approved.count)} have been approved and ${formatCount(j.rejected.count)} rejected; end to end takes ${days(j.endToEnd)} on average.`,
  };
}

function outOfScope(intent: Extract<Intent, { type: 'outOfScope' }>): SceneAnswer {
  return scene({
    intent,
    template: 'notice',
    title: intent.title,
    subtitle: `${intent.bq} · outside the October scope`,
    focusKey: 'notice',
    presence: 'dissolved',
    components: [place({ kind: 'notice', key: 'notice', title: 'Not available in this release', text: intent.reason, suggestions: ['What are the application outcomes?', 'Show the online visa journey'] }, 'hero')],
    spoken: `I can't answer that yet. ${intent.reason}`,
    summary: { primary: `${intent.title} is not available yet.`, secondary: intent.reason },
  });
}

export function homeSpoken() {
  return composeHomeSummary(useHomeFeed.getState()).spoken;
}

/** Build the scene for an intent. `null` means Home. */
/** v2: every application is online, so an "online" filter adds nothing. */
const onlineOnly = (f: Filters): Filters => (f.channel === 'online' ? { ...f, channel: undefined } : f);

export function answer(intent: Intent): SceneAnswer | null {
  switch (intent.type) {
    case 'home':
    case 'back':
      return null;
    case 'journey':
      return journey(intent.channel, intent.filters, intent);
    case 'outcomes':
      if (intent.filters.channel === 'centre') return channels(intent);
      return outcomes(onlineOnly(intent.filters), intent);
    case 'time':
      if (intent.filters.channel === 'centre') return channels(intent);
      return time(onlineOnly(intent.filters), intent);
    case 'count':
      if (intent.filters.channel === 'centre') return channels(intent);
      return count(onlineOnly(intent.filters), intent);
    case 'ranking':
      return ranking(intent);
    case 'compare':
      if (intent.entities.some((e) => e.kind === 'channel')) return channels(intent);
      return compare(intent);
    case 'revenue':
      return revenue(intent);
    case 'processing':
      return processing(intent);
    case 'timeMatrix':
      return timeMatrix(intent);
    case 'queue':
      return queue(intent);
    case 'periods':
      return periodsScene(intent);
    case 'channels':
      return channels(intent);
    case 'tops':
      return tops(intent);
    case 'geo':
      return geo(intent);
    case 'outcomeDist':
      return outcomeDist(intent);
    case 'mix':
      return mix(intent);
    case 'journeyMap':
      return journeyMap(intent);
    case 'outOfScope':
      return outOfScope(intent);
    default:
      return unsupported(intent);
  }
}
