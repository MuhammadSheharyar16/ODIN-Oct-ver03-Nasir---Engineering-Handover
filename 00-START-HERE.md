# ODIN Oct ver03 Nasir - Engineering Handover

Version ver03 (0.3.0) · generated 2026-10-16 · ODIN reference app 0.3.0

Everything an engineering team needs to take ODIN screens and effects into its own app, one at a time, without replacing its core.

1. Open `00-START-HERE.html` for the visual catalogue.
2. Read `INTEGRATION-GUIDE.md` (leads) and `STACK.md` (versions, already matched to your stack).
3. Give your Claude `06-port-kit/CLAUDE.md` and a request from `06-port-kit/PORT-PROMPTS.md`.

| Folder | Contents |
|---|---|
| `01-reference-app/` | Runnable ODIN prototype (`npm ci && npm run dev`, `?view=V05`) |
| `02-design-system/` | Tokens, card system A/B/C, type, colour by meaning |
| `03-effects/` | E00–E11: SPEC, source, videos/frames |
| `04-views/` | S01–S05 system states, V01–V25 screens: README, component, spec.sample.json, captures |
| `05-data-contracts/` | Types, JSON Schema, question → screen → data |
| `06-port-kit/` | Claude instructions, prompts, contract + acceptance tests, golden frames |
| `07-assets/` | Room imagery, sounds |
| `manifest.json` | Machine-readable map of all of the above |

## Screens and states

| ID | Title | Status | Business questions | Effects |
|---|---|---|---|---|
| [S01](04-views/S01-intro-load-in/README.md) | Intro load-in | System | — | E00 E03 E06 E07 E09 E10 |
| [S02](04-views/S02-question-composer/README.md) | Question composer | System | — |  |
| [S03](04-views/S03-thinking/README.md) | Thinking | System | — |  |
| [S04](04-views/S04-morph-transition/README.md) | Morph transition | System | — | E00 E01 E02 E03 E09 |
| [S05](04-views/S05-speaking-summary/README.md) | Speaking + summary | System | — | E00 E03 E09 |
| [V01](04-views/V01-executive-home/README.md) | Executive Home | Green | — | E00 E03 E05 E06 E07 E08 E10 |
| [V02](04-views/V02-applications-in-processing/README.md) | Applications in Processing | Green | BQ01 | E00 E01 E02 E03 E04 E05 E06 E07 E08 E09 E11 |
| [V03](04-views/V03-application-outcomes/README.md) | Application Outcomes | Green | BQ02, BQ03 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V04](04-views/V04-outcome-distribution/README.md) | Outcome Distribution | Green | BQ26 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V05](04-views/V05-processing-time-matrix-online/README.md) | Processing Time Matrix · online | Green | BQ04, BQ07 | E00 E01 E02 E03 E05 E06 E07 E08 E09 E11 |
| [V06](04-views/V06-processing-time-matrix-centre-visits/README.md) | Processing Time Matrix · centre visits | Red | — | E00 E01 E02 E03 E05 E06 E07 E08 E09 E11 |
| [V07](04-views/V07-time-matrix-focus-stage/README.md) | Time Matrix · focus stage | Red | BQ08, BQ09, BQ10 | E00 E01 E02 E03 E05 E06 E07 E08 E09 E11 |
| [V08](04-views/V08-vas-revenue/README.md) | VAS Revenue | Validation | BQ05, BQ27 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V09](04-views/V09-online-visa-journey/README.md) | Online Visa Journey | Green | — | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V10](04-views/V10-centre-visit-journey/README.md) | Centre Visit Journey | Amber | — | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V11](04-views/V11-application-journey-map/README.md) | Application Journey Map | Green | — | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V12](04-views/V12-centre-ranking-by-time/README.md) | Centre Ranking by Time | Red | BQ11 | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V13](04-views/V13-stage-queue-online/README.md) | Stage Queue · online | Red | BQ13 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V14](04-views/V14-stage-queue-centres/README.md) | Stage Queue · centres | Red | — | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V15](04-views/V15-performance-comparison/README.md) | Performance Comparison | Green | BQ14, BQ15, BQ16, BQ17 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V16](04-views/V16-top-countries-nationalities-and-centres/README.md) | Top Countries, Nationalities & Centres | Green | BQ18, BQ22 | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V17](04-views/V17-top-countries-on-the-globe/README.md) | Top Countries on the Globe | Green | — | E00 E01 E02 E03 E04 E06 E07 E08 E09 E11 |
| [V18](04-views/V18-channels-notice/README.md) | Channels Notice | Amber | BQ21 | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V19](04-views/V19-compare-side-by-side/README.md) | Compare Side by Side | Green | — | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V20](04-views/V20-travel-purpose-mix/README.md) | Travel Purpose Mix | Red | BQ19 | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V21](04-views/V21-applicant-occupation-mix/README.md) | Applicant Occupation Mix | Red | BQ20 | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V22](04-views/V22-applications-focus/README.md) | Applications (focus) | Green | — | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V23](04-views/V23-processing-time-focus/README.md) | Processing Time (focus) | Green | — | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V24](04-views/V24-not-available-yet/README.md) | Not Available Yet | Out | BQ06, BQ12, BQ23, BQ24, BQ25, BQ28, BQ29, BQ30, BQ31 | E00 E01 E02 E03 E06 E07 E08 E09 E11 |
| [V25](04-views/V25-didnt-understand/README.md) | Didn’t Understand | System | — | E00 E01 E02 E03 E06 E07 E08 E09 E11 |

## Effects

- [E00 · 3D canvas layer (Stage)](03-effects/E00-canvas-layer/SPEC.md)
- [E01 · Morph transitions (six choreographies)](03-effects/E01-morph/SPEC.md)
- [E02 · Transition particles](03-effects/E02-particles/SPEC.md)
- [E03 · ODIN globe + speaking aura](03-effects/E03-globe-aura/SPEC.md)
- [E04 · 3D objects on HTML placeholders](03-effects/E04-3d-objects/SPEC.md)
- [E05 · Energy streams](03-effects/E05-energy-streams/SPEC.md)
- [E06 · Environment: room, blur, camera push](03-effects/E06-environment/SPEC.md)
- [E07 · Post-FX glow](03-effects/E07-post-fx/SPEC.md)
- [E08 · Count-up numbers](03-effects/E08-count-up/SPEC.md)
- [E09 · Sound](03-effects/E09-sound/SPEC.md)
- [E10 · Intro load-in](03-effects/E10-intro/SPEC.md)
- [E11 · Screen composer + bridge](03-effects/E11-composer/SPEC.md)
