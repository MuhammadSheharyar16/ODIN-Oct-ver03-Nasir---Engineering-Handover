import type { FloorData } from '../ui/scene/components/floorJourney';
/**
 * Scene specs: the contract between the answer engine (what to show and
 * say), the composer (where it goes) and the component library (how it
 * looks). Engineering maps real AI-team payloads onto these same types.
 */
import type { Channel, Filters, StageIcon } from './vas';

export type ValueFormat = 'count' | 'days' | 'percent' | 'currency';
export type IconName =
  | 'people'
  | 'applications' | 'clock' | 'approved' | 'rejected' | 'closure' | 'processing' | 'globe' | 'centre'
  | 'revenue' | 'compare' | 'ranking' | 'online' | 'info' | StageIcon;

export type Delta = { value: number; unit: 'count' | 'pp' | 'percent' | 'days'; basis: string; goodWhen?: 'up' | 'down' };

export type MetricSpec = {
  kind: 'metric';
  key: string;
  label: string;
  value: number | null;
  format: ValueFormat;
  icon: IconName;
  accent: string;
  delta?: Delta;
  caption?: string;
  hero?: boolean;
  /** Optional mini chart drawn in the card. */
  spark?: { kind: 'bars' | 'line'; values: number[] };
  unavailableReason?: string;
  /** Tinted glass KPI tile (icon badge, white ink, chevron). */
  tile?: boolean;
  /** Follow-up question asked when the tile's chevron is pressed. */
  ask?: string;
  /** C · hero glass: glossy capsule glass carrying the chart, for a page's headline cards. */
  card?: 'hero';
};

/** Status legend grid (2×2 glass pills) under a distribution ring. */
export type LegendSpec = {
  kind: 'legend';
  key: string;
  items: { key: string; label: string; count: number; share: number; accent: string; ask?: string }[];
};

export type JourneySpec = {
  kind: 'journey';
  key: string;
  channel: Channel;
  stages: { key: string; label: string; sub?: string; icon: StageIcon; accent: string; count: number; days: number; delta?: number; unavailable?: boolean }[];
  approved: { count: number; days: number; delta?: number };
  rejected: { count: number; days: number; delta?: number; unavailable?: boolean };
  /** Outcome labels (default Approved / Rejected; centre visits: Visit completed / Missed). */
  outcomeLabels?: { good: string; bad: string; goodShort?: string; badShort?: string };
  /** Stage with the most applications currently waiting (factual emphasis). */
  emphasisKey?: string;
  /** Tag on the emphasised stage (default "Most waiting now"). */
  emphasisLabel?: string;
  /** Floor journey data (online map incl. biometric branch). Wide screens render it on the floor. */
  floor?: FloorData;
  /** 'pedestals' (3.1 primary) or 'orbs' (3.2 journey map). */
  variant?: 'pedestals' | 'orbs';
};

export type DonutSpec = {
  kind: 'donut';
  key: string;
  total: number;
  totalLabel: string;
  segments: { key: string; label: string; count: number; accent: string }[];
  basis: string;
  /** No callouts: the legend is a separate component. */
  clean?: boolean;
};

export type RankingSpec = {
  kind: 'ranking';
  key: string;
  title: string;
  basis: string;
  format: ValueFormat;
  items: { key: string; code?: string; label: string; sub?: string; value: number }[];
  /** Index highlighted (e.g. the leader or the item asked about). */
  highlight?: number;
  accent: string;
};

export type CompareSpec = {
  kind: 'compare';
  key: string;
  sides: { key: string; code?: string; label: string; accent: string; rows: { label: string; value: number; format: ValueFormat }[] }[];
};

export type BarsSpec = {
  kind: 'bars';
  key: string;
  title: string;
  basis: string;
  format: ValueFormat;
  items: { key: string; label: string; value: number }[];
  accent: string;
};

export type FactsSpec = {
  kind: 'facts';
  key: string;
  title: string;
  items: { icon: IconName; text: string; sub?: string; accent: string }[];
  ring?: { label: string; value: number; basis: string };
};

export type NoticeSpec = {
  kind: 'notice';
  key: string;
  title: string;
  text: string;
  suggestions: string[];
};

export type TimeMatrixSpec = {
  kind: 'timeMatrix';
  key: string;
  scopeLabel: string;
  avg: number;
  avgDelta: number;
  median: number;
  medianDelta: number;
  p90: number;
  applications: number;
  hourly: number[];
  fastest: { label: string; days: number };
  longest: { label: string; days: number };
  stages: { key: string; label: string; icon: StageIcon; accent: string; days: number }[];
  /** Highlighted stage (for stage-specific questions). */
  focusStage?: string;
  tabs: { label: string; ask: string; active?: boolean }[];
  /** Ring around the centre readout (0–1); decorative frame when undefined. */
  sla?: number | null;
  /** Online matrix: biometric-branch stage times are a design preview (F25 red). */
  previewNote?: string;
};

export type ChannelsSpec = {
  kind: 'channels';
  key: string;
  total: number;
  online: { count: number; share: number; delta: number; bars: number[] };
  centre: { count: number; share: number; delta: number; bars: number[] };
  status: 'valid' | 'amber';
};

export type PodiumColumn = { key: string; title: string; sub: string; icon: IconName; accent: string; items: { label: string; code?: string; value: number; sub?: string }[] };
export type PodiumsSpec = { kind: 'podiums'; key: string; columns: PodiumColumn[] };

export type GeoSpec = {
  kind: 'geo';
  key: string;
  heading: string;
  subheading: string;
  basis: string;
  period: string;
  items: { code: string; name: string; value: number; delta: number; lat: number; lon: number }[];
};

export type RevenueSpec = {
  kind: 'revenue';
  key: string;
  preview: boolean;
  /** v2: values shown, flagged "validation required" until AEGI Finance approves the definition. */
  validation?: boolean;
  amount: number | null;
  delta: number | null;
  dims: { key: string; label: string; share: number; accent: string; value: number | null; bars: number[]; top: { name: string; value: number }[] }[];
};

export type PeriodsSpec = {
  kind: 'periods';
  key: string;
  items: { key: string; label: string; value: number; cmp: string; delta: number | null; accent: string; approval: number; days: number; approvalDelta: number | null; daysDelta: number | null }[];
};

export type QueueSpec = {
  kind: 'queue';
  key: string;
  items: { key: string; label: string; icon: StageIcon; accent: string; waiting: number; avgWait: number; buckets: { lt1: number; d13: number; gt3: number } }[];
};

export type RingSpec = {
  kind: 'ring';
  key: string;
  total: number;
  totalLabel: string;
  segments: { key: string; label: string; count: number; accent: string }[];
  basis: string;
};

/** Home-style board: ODIN globe readout, four capsules, stage row (Applications in processing). */
export type BoardSpec = {
  kind: 'board';
  key: string;
  hero: { value: number; label: string; delta: number; deltaBasis: string; caption: string };
  /** 'glass': a calm glass sphere replaces ODIN's globe for this answer. */
  orb?: 'glass';
  capsules: { id: string; label: string; value: number; format: 'count' | 'percent'; accent: string; icon: 'entered' | 'approved' | 'closure' | 'revenue'; delta?: { value: number; unit: 'count' | 'pp' | 'percent'; basis: string }; detail?: string }[];
  stagesTitle: string;
  stages: { key: string; label: string; count: number; share: number; accent: string; top?: boolean }[];
};

export type ComponentSpec =
  | BoardSpec | LegendSpec | MetricSpec | JourneySpec | DonutSpec | RankingSpec | CompareSpec | BarsSpec | FactsSpec | NoticeSpec
  | TimeMatrixSpec | ChannelsSpec | PodiumsSpec | GeoSpec | RevenueSpec | PeriodsSpec | QueueSpec | RingSpec;

/** Where ODIN's globe goes in this scene. */
export type PresenceMode = 'home' | 'core' | 'dissolved';

export type Template = 'journey' | 'floor' | 'board' | 'matrix' | 'outcomes' | 'focus' | 'notice' | 'stage' | 'ringCards';

export type Placed = { spec: ComponentSpec; slot: string };

export type Intent =
  | { type: 'home' }
  | { type: 'back' }
  | { type: 'journey'; channel: Channel; filters: Filters }
  | { type: 'outcomes'; filters: Filters }
  | { type: 'time'; filters: Filters }
  | { type: 'count'; filters: Filters }
  | { type: 'ranking'; dimension: 'country' | 'centre' | 'visaType'; measure: 'applications' | 'approvalRate' | 'avgDays'; order: 'desc' | 'asc'; filters: Filters }
  | { type: 'compare'; entities: { kind: 'country' | 'centre' | 'visaType' | 'channel'; key: string }[]; filters: Filters }
  | { type: 'revenue'; filters: Filters; preview?: boolean; breakdown?: boolean }
  | { type: 'processing' }
  | { type: 'timeMatrix'; channel: Channel | 'all'; filters: Filters; stage?: string }
  | { type: 'queue'; channel: Channel }
  | { type: 'periods' }
  | { type: 'channels' }
  | { type: 'tops' }
  | { type: 'geo' }
  | { type: 'outcomeDist' }
  | { type: 'mix'; dim: 'purpose' | 'occupation' }
  | { type: 'journeyMap' }
  | { type: 'outOfScope'; bq: string; title: string; reason: string }
  | { type: 'unsupported'; text: string };

export type SceneAnswer = {
  id: string;
  intent: Intent;
  template: Template;
  title: string;
  subtitle: string;
  components: Placed[];
  focusKey: string;
  presence: PresenceMode;
  /** 'floor': the camera pushes onto the interior floor and the environment stays sharp. */
  env?: 'floor';
  /** Exactly what ODIN says — also what the summary strip highlights. */
  spoken: string;
  summary: { primary: string; secondary: string };
};
