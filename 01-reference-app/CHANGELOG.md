# Changelog

## ODIN Oct ver03 Nasir — 16 Oct 2026 (`odin-oct-ver03-nasir`)

Engineering handover release, plus the visual work since ver02.

- **Engineering handover kit:** every UI numbered (S01–S05 system states, V01–V25 screens) with captures (wide, portrait, phone), its own source, a data sample and README; effects E00–E11 with exact SPECs, source, morph videos and frames; data contracts (types, JSON Schema, question → screen → data table); a port kit for engineering's Claude (instructions, ready prompts, @playwright/test acceptance tests with golden frames, vitest contract tests).
- **Engineering stack:** rebuilt on engineering's versions (React 19.2, three 0.180, R3F 9.3, drei 10.7, Vite 7, TypeScript 5.8, ESLint 9, vitest, @playwright/test); tested at the oldest and newest versions of their ranges; unused packages removed.
- **Decoupled screens:** screens read follow-ups and layout from one bridge (`OdinBridgeProvider`), Home takes its data as props; nothing in a screen imports stores or mock data. `?view=V05` opens any screen directly.
- **Card system:** A capsule (live pulse: Home, Applications in Processing) · B tile (analysis) · C hero glass, the default for headline cards that carry a chart (Outcome Distribution, Time Matrix, Journey Map, Centre journey).
- **Home:** thinner, calmer capsules; energy links rebuilt as layered VFX (bloom, filament, drifting dust, eased comet with a white-hot head).
- **Screens:** online visa journey on the ODIN floor (traveller walks, stages light up, camera push, auto blur); Applications in Processing as a Home-style board around a glass orb; Outcome Distribution and the online Processing Time Matrix to the approved references.
- **Sound:** supplied intro pulse on first load; supplied bass / woosh picked at random on each morph.

## ODIN Oct ver02 Nasir — 15 Oct 2026 (`odin-oct-ver02-nasir`)

Scope v2 (Data and Delivery Plan v2, call 8) and the premium visual pass.

- **Scope v2:** all applications are submitted online (DXC); the channel question answers with a notice. Centre journey is now a **Centre Visit Journey** (appointment → arrival *not available* → payment at centre → biometrics → interview) with unconfirmed stages labelled. Revenue (F13a/b) is shown with **Validation required** on Home and in the revenue view. Processing time (F11) is live. The question list statuses match v2.
- **Accessible light glass:** every internal card uses the custom-report frosted glass with dark navy ink (WCAG AA+), semantic deltas that pass on white with ▲/▼ kept, glass-chip ring callouts, dark lenses behind numbers on the globe, a deeper summary strip and readable unspoken words. Reduced motion is respected throughout.
- **3D:** crystal stage objects (refractive accent glass tiles with luminous icons); grounded pedestals.
- **Cinematic finish:** selective bloom, vignette, grain, SMAA; colour-accurate shaders under post-processing; NaN-safe shaders; adaptive quality tiers (`?tier=high|medium|low`, auto-adjusts to hold frame rate; `?fx=0` disables effects).
- **Hero moments:** gold light arcs from each country into the UAE on the Earth; data streams rising from the revenue pillars into the core; aging heat in the stage-queue jars; count-up reveals on every number.
- **Sound:** six synthesised morph cues, one per morph choreography (press M to mute, `?sfx=0` to disable).

## ODIN Oct ver01 Nasir — 15 Oct 2026 (`odin-oct-ver01-nasir`)

First October review build.

- **Home:** ODIN presence globe, four glass KPI capsules, summary strip that shows what ODIN says, moving clouds, adaptive layouts (desktop, tablet, phone, landscape phone).
- **Navigation:** typed questions (voice-ready); runtime-composed scenes; any state to any state through 3D morphs; six morph choreographies (depth, vortex, sweep, rise, scatter, helix) with matching particle paths.
- **Question picker:** the full business-question catalogue (BQ01–BQ31 plus design views), grouped by area, with status (live, pending validation, design preview · mock, out of scope), live search and keyboard selection.
- **Views (v1 designs):** online and physical-centre journeys on 3D pedestals, journey map, outcomes donut and outcome distribution ring, processing time matrix (online, centre, focus stage), submission channels, visa performance comparison, stage queue / aging, VAS revenue (“Not available” and labelled design preview), top countries / nationalities / centres, 3D Earth ranking, purpose and applicant mix, comparisons, rankings, out-of-scope notices.
- **ODIN spectrum:** wraps single-object answers; for compositions (journeys, jar rows) it becomes a floor ring around everything with a voice curtain behind it.
- **Data:** mock VAS data, clearly labelled; no causal claims; deltas vs yesterday.
