/**
 * ODIN UI catalogue — every screen and system state, with a stable ID.
 * Single source for deep links (?view=V05), the engineering handover
 * (catalogue, captures, READMEs, manifest) and QA. Keep IDs stable across releases.
 */
export type ViewStatus = 'Green' | 'Amber' | 'Red' | 'Validation' | 'Out' | 'System';

export type ViewEntry = {
  id: string;
  title: string;
  kind: 'screen' | 'system';
  /** Question that opens the screen (exactly as ODIN receives it). Home has none. */
  question?: string;
  /** Business questions answered (Excel v2 IDs). */
  bq: string[];
  feature: string;
  status: ViewStatus;
  /** One line: what the CEO gets from this screen. */
  purpose: string;
  /** Effects used, see the handover's 03-effects (E01…). */
  effects: string[];
  notes?: string;
};

/** Every answer screen: morph, particles, ODIN presence, room blur, glow, count-ups, sound, composer. */
const MORPH = ['E01', 'E02', 'E03', 'E06', 'E07', 'E08', 'E09', 'E11'];

export const VIEWS: ViewEntry[] = [
  // ── System states ──
  { id: 'S01', title: 'Intro load-in', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'ODIN appears: room, globe and capsules assemble with the intro pulse.', effects: ['E03', 'E06', 'E07', 'E09', 'E10'] },
  { id: 'S02', title: 'Question composer', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'Typed question or pick from the catalogue (required / all scope).', effects: [] },
  { id: 'S03', title: 'Thinking', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'The heard question is echoed while ODIN resolves the answer.', effects: [] },
  { id: 'S04', title: 'Morph transition', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'Any screen to any screen: six choreographies, particles through ODIN, morph sound.', effects: ['E01', 'E02', 'E03', 'E09'] },
  { id: 'S05', title: 'Speaking + summary', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'ODIN speaks; the spectrum wraps the focus object and the summary strip captions it.', effects: ['E03', 'E09'] },

  // ── Screens ──
  { id: 'V01', title: 'Executive Home', kind: 'screen', bq: [], feature: 'Home', status: 'Green', purpose: 'Total applications in the globe with four live KPI capsules.', effects: ['E03', 'E05', 'E06', 'E07', 'E08', 'E10'], notes: 'Card A (capsule). Data via HomeComposition props (HomeData).' },
  { id: 'V02', title: 'Applications in Processing', kind: 'screen', question: 'How many visa applications are being processed?', bq: ['BQ01'], feature: 'F05', status: 'Green', purpose: 'Live inventory in processing, today’s movement and where the queue sits.', effects: [...MORPH, 'E04', 'E05'], notes: 'Card A (capsule) board around the glass orb.' },
  { id: 'V03', title: 'Application Outcomes', kind: 'screen', question: 'How many visas have been approved?', bq: ['BQ02', 'BQ03'], feature: 'F06', status: 'Green', purpose: 'Approved, rejected, closed and in processing on a 3D donut.', effects: [...MORPH, 'E04'] },
  { id: 'V04', title: 'Outcome Distribution', kind: 'screen', question: 'What percentage of visa applications have been closed?', bq: ['BQ26'], feature: 'F06', status: 'Green', purpose: 'Closure rate with the full status split and four headline cards.', effects: [...MORPH, 'E04'], notes: 'Card C (hero glass) headline cards.' },
  { id: 'V05', title: 'Processing Time Matrix · online', kind: 'screen', question: 'How long does it take to process a visa?', bq: ['BQ04', 'BQ07'], feature: 'F11 · F12a', status: 'Green', purpose: 'End-to-end time in ODIN, six duration cards and the stage-wise strip.', effects: [...MORPH, 'E05'], notes: 'Fixed 1920×1080 frame scaled to fit (wide). SLA shown as Not available (threshold not agreed).' },
  { id: 'V06', title: 'Processing Time Matrix · centre visits', kind: 'screen', question: 'Show the centre processing time matrix', bq: [], feature: 'F26', status: 'Red', purpose: 'The same matrix for centre visit stages.', effects: [...MORPH, 'E05'] },
  { id: 'V07', title: 'Time Matrix · focus stage', kind: 'screen', question: 'How quickly does VAS process and submit applications to ICP?', bq: ['BQ08', 'BQ09', 'BQ10'], feature: 'F23 · F24 · F25', status: 'Red', purpose: 'The matrix with one stage highlighted (VAS→ICP, with ICP, biometrics).', effects: [...MORPH, 'E05'], notes: 'Biometric split is a design preview (F25 red).' },
  { id: 'V08', title: 'VAS Revenue', kind: 'screen', question: 'How much revenue is being generated?', bq: ['BQ05', 'BQ27'], feature: 'F13a · F13b', status: 'Validation', purpose: 'Revenue total and breakdown by country, centre, service and nationality.', effects: [...MORPH, 'E04'], notes: 'Always labelled “Validation required” until AEGI Finance approves the definition.' },
  { id: 'V09', title: 'Online Visa Journey', kind: 'screen', question: 'Show the online visa journey', bq: [], feature: 'F07a', status: 'Green', purpose: 'Traveller walks the online journey on the floor; each stage lights up with its metric.', effects: [...MORPH, 'E04'], notes: 'Floor camera push + auto blur. Keeps its own cards (not in the A/B/C card system yet).' },
  { id: 'V10', title: 'Centre Visit Journey', kind: 'screen', question: 'Show the centre visit journey', bq: [], feature: 'F07b', status: 'Amber', purpose: 'Appointment → payment → biometrics → interview on 3D pedestals.', effects: [...MORPH, 'E04'], notes: 'Arrival at centre shown as Not available (event not captured yet).' },
  { id: 'V11', title: 'Application Journey Map', kind: 'screen', question: 'Show the application journey map', bq: [], feature: 'F07a', status: 'Green', purpose: 'End-to-end stages as orbs with volumes and average days.', effects: [...MORPH, 'E04'], notes: 'Card C headline cards.' },
  { id: 'V12', title: 'Centre Ranking by Time', kind: 'screen', question: 'How efficiently are individual centres processing applications?', bq: ['BQ11'], feature: 'F26', status: 'Red', purpose: 'Centres ranked by average processing days.', effects: MORPH },
  { id: 'V13', title: 'Stage Queue · online', kind: 'screen', question: 'Where are applications being delayed, and which stages need attention?', bq: ['BQ13'], feature: 'F12b', status: 'Red', purpose: 'Applications waiting at each stage with age bands.', effects: [...MORPH, 'E04'], notes: 'Shows where applications wait; makes no causal claim.' },
  { id: 'V14', title: 'Stage Queue · centres', kind: 'screen', question: 'Show the centre stage queue', bq: [], feature: 'F12b', status: 'Red', purpose: 'The stage queue for centre visits.', effects: [...MORPH, 'E04'] },
  { id: 'V15', title: 'Performance Comparison', kind: 'screen', question: 'How does today\'s performance compare with yesterday?', bq: ['BQ14', 'BQ15', 'BQ16', 'BQ17'], feature: 'F14a · F14b', status: 'Green', purpose: 'Today, yesterday, last 7 days, previous 7 days and month to date.', effects: [...MORPH, 'E04'], notes: 'Weekly/monthly comparisons (F14b) are red in scope v2.' },
  { id: 'V16', title: 'Top Countries, Nationalities & Centres', kind: 'screen', question: 'Which countries or nationalities generate the most applications?', bq: ['BQ18', 'BQ22'], feature: 'F08 · F10', status: 'Green', purpose: 'Top five by country of residence, nationality and centre.', effects: [...MORPH, 'E04'] },
  { id: 'V17', title: 'Top Countries on the Globe', kind: 'screen', question: 'Show top countries on the globe', bq: [], feature: 'F08', status: 'Green', purpose: '3D Earth with the top ten countries on plinths.', effects: [...MORPH, 'E04'] },
  { id: 'V18', title: 'Channels Notice', kind: 'screen', question: 'Are customers applying through physical centres or online?', bq: ['BQ21'], feature: 'F09', status: 'Amber', purpose: 'All applications are submitted online; centres handle visits only.', effects: MORPH },
  { id: 'V19', title: 'Compare Side by Side', kind: 'screen', question: 'Compare India and Pakistan', bq: [], feature: 'F08', status: 'Green', purpose: 'Two countries compared measure by measure.', effects: MORPH },
  { id: 'V20', title: 'Travel Purpose Mix', kind: 'screen', question: 'Are applicants travelling for tourism, business, healthcare or other purposes?', bq: ['BQ19'], feature: 'F27', status: 'Red', purpose: 'Share of applications by recorded visa purpose.', effects: MORPH, notes: 'Post-October feature, mock values for design review.' },
  { id: 'V21', title: 'Applicant Occupation Mix', kind: 'screen', question: 'What types of applicants are using VAS services?', bq: ['BQ20'], feature: 'F28', status: 'Red', purpose: 'Share of applications by recorded occupation.', effects: MORPH, notes: 'Post-October feature, mock values for design review.' },
  { id: 'V22', title: 'Applications (focus)', kind: 'screen', question: 'How many applications from India?', bq: [], feature: 'F05 · F08', status: 'Green', purpose: 'Application count for any filter, with status bars.', effects: MORPH, notes: 'Reached by free-text questions with filters (country, centre, visa type).' },
  { id: 'V23', title: 'Processing Time (focus)', kind: 'screen', question: 'Average processing time for India', bq: [], feature: 'F11', status: 'Green', purpose: 'Average processing time for any filter vs the overall average.', effects: MORPH, notes: 'Reached by free-text questions with filters.' },
  { id: 'V24', title: 'Not Available Yet', kind: 'screen', question: 'How long do applications remain with individual reviewers?', bq: ['BQ06', 'BQ12', 'BQ23', 'BQ24', 'BQ25', 'BQ28', 'BQ29', 'BQ30', 'BQ31'], feature: '—', status: 'Out', purpose: 'Honest notice: why this question cannot be answered yet and what to ask instead.', effects: MORPH },
  { id: 'V25', title: 'Didn’t Understand', kind: 'screen', question: 'What is the weather in Dubai?', bq: [], feature: '—', status: 'System', purpose: 'Fallback when a question is outside ODIN’s data, with suggested questions.', effects: MORPH },
];

export const viewById = (id: string) => VIEWS.find((v) => v.id.toLowerCase() === id.toLowerCase());
