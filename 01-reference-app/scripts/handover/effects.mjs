// Engineering handover · effect definitions (rendered to 03-effects/<id>/SPEC.md).
// Facts here are taken from the reference source; keep them in sync when effects change.

export const EFFECTS = [
  {
    id: 'E00', slug: 'canvas-layer', title: '3D canvas layer (Stage)',
    deps: ['three', '@react-three/fiber', '@react-three/drei'],
    files: ['src/scene/Stage.tsx', 'src/state/store.ts', 'src/lib/layout.ts', 'src/lib/motion.ts'],
    connect: 'Mount `<Stage />` once, full screen, behind your UI (`position: fixed; inset: 0; z-index: 0`). Your HTML UI sits above it with a transparent background. Nothing else in your app changes.',
    spec: `
**What it is.** The single persistent WebGL canvas behind every ODIN screen. Every 3D effect (E02, E03, E04, E06, E07) renders inside it, so there is exactly one GPU surface for the whole app.

**Layer order (back → front)**
1. Environment room (E06) · 2. ODIN speaking aura (E03) · 3. ODIN globe (E03) · 4. 3D objects (E04) · 5. Transition particles (E02) · 6. Post-FX (E07). Then the HTML UI above the canvas.

**Renderer settings.** Camera FOV 30°, at the origin. \`antialias: true\`, \`alpha: false\`, \`powerPreference: high-performance\`, \`toneMapping: NoToneMapping\`, \`outputColorSpace: SRGBColorSpace\`. Background \`#0b1424\`.

**Adaptive quality.** drei \`PerformanceMonitor\`, bounds 45–58 fps, 4 flip-flops: device pixel ratio tier high 2 → medium 1.5 → low 1. At tier *low*, post-FX is off. Studio reflections: procedural \`Environment\` (256 px, rendered once) with five Lightformers; hemisphere + two directional lights.

**Screen ↔ 3D.** Objects are placed in CSS pixels: \`lib/layout.ts\` converts screen px to world units at a given depth, so 3D always lines up with the HTML layout.

**Fallback (no WebGL).** Hide the canvas; set \`body\` to the static room image (\`07-assets/env/interior-*.webp\`); the UI works unchanged. 3D objects (donut, Earth, orbs) are not shown, their HTML labels still are.
`,
  },
  {
    id: 'E01', slug: 'morph', title: 'Morph transitions (six choreographies)',
    deps: ['gsap'],
    files: ['src/odin/director.ts', 'src/odin/experience.ts', 'src/lib/motion.ts'],
    connect: 'Tag morphable elements with `data-morph="<stable key>"` (and `data-accent="#hex"`); wrap each screen in `[data-scene="<id>"]` (Home: `[data-layer="home"]`). When your screen changes, keep the old screen mounted for the morph, then run the director\'s `go(next)` sequence (or port it: it only reads the DOM).',
    spec: `
**What it is.** Any screen → any screen. Elements whose \`data-morph\` key exists on both screens travel and reshape from old place to new; the rest exit into depth while the new screen assembles. A particle stream (E02) flies from old shapes, through ODIN, into new ones, with a morph sound (E09).

**Sequence (ms from the question)**
| t | Step |
|---|---|
| 0 | Phase \`thinking\` (mic bar echoes the question). Speech stops; running tweens are killed. |
| 560 | Measure outgoing \`[data-morph]\` rects. Mount next screen (both on screen). Phase \`morphing\`. Room blur on (E06). |
| +1 frame | Measure incoming rects. Fire particles + sound. Globe moves to its new presence (E03). |
| +0 → 550 | Outgoing: \`opacity 0\` + choreography *out* transform, \`power2.in\`, 550 ms, staggered 40 ms by the choreography's order. |
| +100 → 1100 | Shared keys: from old rect (translate + scaleX/scaleY, opacity 0.4) to new, \`expo.inOut\`, 1000 ms. The old copy fades in 250 ms. |
| +420 → | Incoming: from choreography *in* transform (opacity 0) to rest, 950 ms, \`expo.out\` (or the choreography's ease), staggered 70 ms. |
| end | Old screen unmounts. Phase \`speaking\`; aura wraps the focus element; ODIN speaks. |

All transforms use \`transformPerspective: 1300\`. Reduced motion: 80 ms think, 10 ms tweens, no particles, no sound.

**Choreographies** (picked at random, never the same twice in a row). c = screen centre, r = element centre.
| # | Name | Out | In | Order | Particles |
|---|---|---|---|---|---|
| 1 | depth | z −280, scale .86, rotX 7°, blur 12px | z −340, rotX −14°, y +26, scale .9, blur 14px | — | stream |
| 2 | vortex | rotate ±14°, scale .4, 60% toward c, blur 10px | rotate ∓18°, scale .35, 70% toward c, blur 10px; ease back.out(1.25) | outside-in | vortex |
| 3 | sweep | x −160, skewX 10°, blur 8px | x +220, skewX −12°, blur 10px | left → right | wave |
| 4 | rise | y −90, z −140, rotX 22°, blur 10px | y +140, z −120, rotX −32°, scale .94, blur 8px | bottom → top | rise |
| 5 | scatter | 35% away from c, z +160, scale 1.18, blur 16px | from 25% beyond c, z −420, scale .6, blur 12px | — | scatter |
| 6 | helix | rotY ±70°, z −220, blur 8px | rotY ∓75°, z −220, blur 8px; ease expo.out | left → right | helix |

**Connection points the director reads**: \`data-scene\`, \`data-layer="home"\`, \`data-morph\`, \`data-accent\`, \`data-focus\` (aura target), \`data-aura\`, \`data-surface\` (corner radius for the aura), \`data-presence\` (globe sits in this element). See each screen's \`morphKeys\` in \`manifest.json\`.

**If you keep your own transition system**: reproduce the table above with your animation library; the timings, eases and stagger orders are the spec.
`,
  },
  {
    id: 'E02', slug: 'particles', title: 'Transition particles',
    deps: ['three', '@react-three/fiber'],
    files: ['src/scene/TransitionParticles.tsx', 'src/odin/fx.ts', 'src/lib/layout.ts'],
    connect: 'Call `burst(fromRects, toRects, via, style)` from `odin/fx.ts` at the start of a transition (rects in CSS px with an accent colour). Mount `<TransitionParticles />` inside the Stage (E00).',
    spec: `
**What it is.** 4,200 GPU particles sampled on the outline and body of the outgoing components stream along curves through ODIN and settle onto the incoming components, then fade as the real UI resolves. One progress uniform drives everything on the GPU.

**Timing.** Burst duration 1.35 s. Each particle: delay up to 35% of the duration (style-specific below), life 65% of the duration, ease in-out cubic. Size 1.6–4.2 px × DPR, swelling ×2.4 mid-flight. Colour = the source/target element's \`data-accent\`. Additive blending.

**Styles** (paired with the morph choreography)
| Style | Path |
|---|---|
| 0 stream | Quadratic Bézier from → ODIN → to, with a small mid-flight swirl (18–58 px). |
| 1 vortex | Spiral around ODIN: radius pulled in by 75% mid-flight, 4.5–6.5 rad of extra rotation, half clockwise. |
| 2 wave | Straight path with a travelling sine front (60–130 px), delayed left → right. |
| 3 rise | Lift like embers (160–420 px up mid-flight) with a horizontal flutter, bottom-first. |
| 4 scatter | Burst outward from each old shape (220–600 px), Bézier back onto the new shapes. |
| 5 helix | Twin strands braiding from old to new (36–66 px amplitude). |

**Fallback.** Skip particles entirely; the morph (E01) still reads well without them. Always skipped with reduced motion.
`,
  },
  {
    id: 'E03', slug: 'globe-aura', title: 'ODIN globe + speaking aura',
    deps: ['three', '@react-three/fiber'],
    files: ['src/scene/globe/OdinGlobe.tsx', 'src/scene/globe/geometry.ts', 'src/scene/SpectrumAura.tsx', 'src/lib/aura.ts', 'src/odin/experience.ts', 'src/audio/odinAudio.ts'],
    connect: 'Mount both inside the Stage (E00). Drive them with three plain objects: `presence.target` {x, y, r, form} (where the globe sits; form 0 = dissolved), `setAuraTarget(shape)` (what the spectrum wraps), and `odinAudio.level / speaking` (ODIN\'s output audio level 0–1).',
    spec: `
**What it is.** ODIN's presence. The globe (particle sphere with energy arcs) lives at Home's centre and travels into each screen's core, or dissolves when a screen has no core. While ODIN speaks, a spectrum hugs the object being discussed.

**Globe.** Eases toward \`presence.target\` (x, y, radius in CSS px; \`form\` 1 = sphere, 0 = dissolved into particles). Energy follows ODIN's output level (rate 10/s). On screens with \`presence: 'core'\`, the globe sits in the element marked \`data-presence="k"\` with radius = k × its short side.

**Speaking aura.** Driven only by ODIN's *output* audio (never the user's mic). Two forms that morph into each other (rate 4/s):
- **wrap** — concentric vibrating rings, radial spikes and a waveform around one object's silhouette (rounded-box SDF: circle, capsule or card; the corner radius comes from the target's CSS \`border-radius\`).
- **floor** — a perspective ring on the floor around a whole composition (journeys, rows of jars) with a voice curtain rising behind it. Used when ODIN speaks about everything on screen at once.
Fades in/out with speech (rate 4/s); level smoothing 14/s.

**Fallback.** Static globe image/video loop in the Home centre; aura as a CSS glow ring (\`box-shadow\`) pulsing on the focus card while speaking.
`,
  },
  {
    id: 'E04', slug: '3d-objects', title: '3D objects on HTML placeholders',
    deps: ['three', '@react-three/fiber', '@react-three/drei', 'd3-geo', 'topojson-client', 'world-atlas'],
    files: ['src/odin/fx.ts', 'src/ui/scene/components/shared.tsx', 'src/scene/Donut3D.tsx', 'src/scene/earth/Earth3D.tsx', 'src/scene/orb/GlassOrb3D.tsx', 'src/scene/plinth/Plinths3D.tsx', 'src/scene/journey/Journey3D.tsx', 'src/scene/journey/objects.tsx', 'src/scene/journey/CrystalIcon.tsx'],
    connect: 'Your screen renders an empty, sized `<div>` where the object belongs and registers it: `registerProxy(key, { el, kind, data })` (or the `useProxy` hook in shared.tsx). The matching 3D component inside the Stage reads that element\'s live rect and opacity every frame. Your layout stays yours.',
    spec: `
**What it is.** Real 3D objects that follow an HTML placeholder. Because they read the placeholder's rect and opacity every frame, the HTML morph (E01) drives the 3D too: move/fade the box and the object follows.

| kind | Object | Used by |
|---|---|---|
| donut | 3D outcomes donut (segments extrude, clean mode for V04) | V03, V04 |
| pedestal | Journey pedestals with crystal icons | V10 |
| plinths | Glass plinths/jars (periods, queue, revenue, podiums) | V08, V13–V16 |
| earth | 3D Earth with country arcs (d3-geo + world-atlas) | V17 |
| orb | Glass sphere for "in processing" | V02 |

Material colour rule: write uniforms through the live material ref; non-additive ShaderMaterials are decoded to linear before post-FX (see E07) so authored colours render exactly.

**Fallback.** Labels and values are HTML and render without WebGL; the empty placeholder can show a static image of the object instead (crop it from the screen captures).
`,
  },
  {
    id: 'E05', slug: 'energy-streams', title: 'Energy streams',
    deps: [],
    files: ['src/ui/home/EnergyStreams.tsx', 'src/ui/home/home.css'],
    connect: 'Plain React + SVG. Pass `layout` (globe {x, y, r} and capsule boxes) and `accents` (one colour per card). Place it in a full-size layer under the cards.',
    spec: `
**What it is.** Light connecting each card to ODIN, plus ambient strands to the screen edges. Paths are recomputed every frame: strands breathe at idle and widen into waves while ODIN speaks (driven by ODIN's output level).

**Layers per link (back → front)**: wide bloom (stroke × 5, Gaussian blur 7·s, colour mixed 38% toward rgb(214,226,245)) → fine filament core (stroke × 0.55, gradient, intro draw-on) → drifting dust (dash 0.0015/0.028, 9 + (i mod 4)·2.5 s per loop) → comet tail (stroke × 2.2, dash 0.16, eased \`cubic-bezier(.55,.05,.35,1)\`) → white-hot comet head, travelling card → ODIN every 4.2 + (i mod 3)·1.1 s, offset −0.91 s per strand.

Opacity: glow (0.16 + energy·0.35)·base; dust 0.5·k; comets k, where k = ambient ? 0.35 + energy : 0.8 + energy·0.4.

**Reduced motion.** Dust, tail and head animations stop; strands stay static.
`,
  },
  {
    id: 'E06', slug: 'environment', title: 'Environment: room, blur, camera push',
    deps: ['three', '@react-three/fiber', '@react-three/drei'],
    files: ['src/scene/EnvironmentLayers.tsx', 'src/scene/CameraRig.tsx', 'src/lib/envFit.ts', 'src/lib/intro.ts'],
    connect: 'Mount inside the Stage (E00). Set `useStage.getState().setFocus(0 | 1)` (1 = any answer screen: room recedes) and `envView.target` (camera push; `floorView()` for the online journey).',
    spec: `
**What it is.** The daylight ODIN interior as two real depth layers: exterior waterfront plate (depth 15) behind, interior arch with true alpha (depth 10) in front. Pixels as supplied, no regrade. Cover-fitted with 7% overscan for parallax; artwork aspect 7600 × 4652. Sky and water shimmer drift; skyline stays put. Variant by screen pixels: 1600 / 2560 / 3840 px WebP (+ pre-blurred copies).

**Focus (answer screens).** Eases at rate 3.2/s. Exterior: blur 0.85, dim to 0.78, saturation 0.82. Interior: blur 0.45, dim 0.72, saturation 0.85. Home: all at rest.

**Camera.** Slow drift parallax (rate 1.6/s). Online journey (V09, wide): push onto the floor so the bottom ~61% of the artwork fills the screen (\`FLOOR_CY 0.696\`), panned so the journey is centred.

**Fallback (recommended).** CSS: two stacked \`<img>\` layers with \`filter: blur() brightness() saturate()\` at the focus values above, transitioned ~600 ms.
`,
  },
  {
    id: 'E07', slug: 'post-fx', title: 'Post-FX glow',
    deps: ['@react-three/postprocessing', 'postprocessing'],
    files: ['src/scene/PostFX.tsx'],
    connect: 'Mount `<PostFX />` last inside the Stage (E00), in its own `<Suspense>`. `?fx=0` turns it off.',
    spec: `
**What it is.** The cinematic finish: selective bloom on light sources only, soft vignette, fine film grain, SMAA edges.

| Pass | Settings |
|---|---|
| Bloom | mipmapBlur, luminanceThreshold 0.985, smoothing 0.04, intensity 0.32, radius 0.6 (above the daylight plate, so cards and text stay crisp) |
| Vignette | offset 0.36, darkness 0.32 |
| Noise | opacity 0.045, soft-light, premultiplied |
| SMAA | default |

\`multisampling={0}\`: no MSAA / half-float targets (they render black on some GPUs). Off at quality tier *low*.

**Colour accuracy.** Custom GLSL authors colours as display (sRGB) values; the composer renders linear and encodes at the end, which would wash them out. PostFX.tsx patches plain non-additive \`ShaderMaterial\`s to clamp and decode their output to linear first. Keep this patch if you keep our shaders.
`,
  },
  {
    id: 'E08', slug: 'count-up', title: 'Count-up numbers',
    deps: [],
    files: ['src/ui/NumberRoll.tsx', 'src/ui/scene/components/shared.tsx', 'src/lib/format.ts'],
    connect: 'Plain React. `<Count v={n} fmt={formatter} />` in screens; `<NumberRoll value format countUp />` on Home.',
    spec: `
**What it is.** Numbers count up as a component morphs in, then glide to later values.

- Screen numbers (\`Count\` / \`useCountUp\`): wait 520 ms (entrance), then 0 → value over 1,150 ms, ease-out; later changes tween from the current value with no wait.
- Home figures (\`NumberRoll\`): 700 ms ease-out cubic; on first load they wait for the intro to release them (E10).
- Reduced motion: values appear immediately.
- Formatting (\`lib/format.ts\`): tabular numerals, thousands separators, \`Not available\` for null, days to one decimal.
`,
  },
  {
    id: 'E09', slug: 'sound', title: 'Sound',
    deps: [],
    files: ['src/audio/morphSfx.ts', 'src/audio/odinAudio.ts'],
    connect: 'Call `playIntro()` when ODIN first appears and `playMorph()` at each transition. `odinAudio` exposes ODIN\'s output `level` (0–1) and `speaking` for E03/E05; replace the simulated speech preview with your TTS output analyser.',
    spec: `
**What it is.** Interface sound under ODIN's voice (Web Audio, so timing is exact).

| Sound | When | Gain |
|---|---|---|
| intro-pulse.m4a | ODIN first appears (Home load-in) | 0.7 |
| morph-bass.m4a / morph-woosh.m4a | every morph, one picked at random | 0.6 / 0.55 |

Browsers block audio until the first gesture: if the page loads silent, the intro pulse plays on the first click/key **within 6 s** of load, otherwise it is skipped. \`?sfx=0\` or the **M** key mutes.

**ODIN's voice level.** \`odinAudio.level\` feeds the globe energy, aura and energy streams; in the prototype it comes from a simulated speech preview. Connect it to an \`AnalyserNode\` on your real TTS output.
`,
  },
  {
    id: 'E10', slug: 'intro', title: 'Intro load-in',
    deps: ['gsap'],
    files: ['src/ui/IntroDirector.tsx', 'src/ui/intro.css', 'src/lib/intro.ts'],
    connect: 'Mount `<IntroDirector />` once. Tag elements with `data-intro="chrome | capsule | readout | hud"`. `?nointro` skips.',
    spec: `
**What it is.** First appearance: light floods the room as the camera eases in, a beam rises from the floor ring, particles converge into ODIN, capsules materialise, energy draws on, figures count up, the HUD settles. Starts when the environment textures are ready.

| t (s) | Step | Duration · ease |
|---|---|---|
| 0 | Loader fades out | 0.7 · power2.inOut |
| 0 | Room reveal (dark & soft → as supplied) | 2.1 · power2.out |
| 0 | Camera ease-in | 2.8 · power3.out |
| 0.5 | Floor beam | 1.1 · power2.inOut |
| 0.85 | Globe forms | 1.9 · expo.out |
| 1.2 | Chrome (logo, date) from y −12 | 0.9 |
| 1.6 | Capsules from scale .8 + blur 12px, stagger 0.12 | 1.0 |
| 1.85 | Energy streams draw on | 1.5 · power2.out |
| 1.95 | Globe readout from scale .88 | 0.9 |
| 2.0 | Figures released (count-up) | — |
| 2.35 | HUD (summary, mic bar) from y +26, stagger 0.14 | 0.9 |

Default ease power3.out. Intro sound at start (E09). Reduced motion: skipped.
`,
  },
  {
    id: 'E11', slug: 'composer', title: 'Screen composer + bridge',
    deps: [],
    files: ['src/odin/compose.ts', 'src/ui/scene/SceneLayer.tsx', 'src/lib/homeLayout.ts', 'src/ui/bridge.tsx', 'src/odin/types.ts'],
    connect: 'Wrap ODIN screens in `<OdinBridgeProvider value={{ ask, layout }}>`: `ask(question)` routes follow-ups (chevrons, tabs, chips) to your Q&A; `layout = computeHomeLayout(innerWidth, innerHeight)`. Screens never import stores or mock data.',
    spec: `
**What it is.** Places a screen's components for the current device. Each template defines slots per layout mode; any answer using those slots is laid out automatically. Slots missing on a device are dropped (ODIN's spoken answer still carries the information).

**Layout modes** (\`computeHomeLayout\`): \`wide\` (landscape desktop/TV, 1920 × 1080 reference frame), \`portrait\` (1080 × 1920 frame), \`compact\` (phones, ~430 px frame), \`short\` (landscape phones). Frames scale to the real viewport.

**Templates**: focus, stage, journey, floor, matrix, board, outcomes, ringCards, notice. \`floor\`, \`board\` and \`matrix\` are full-viewport compositions on wide screens.

**Screen contract.** A screen is \`SceneAnswer\` (see 05-data-contracts): title, subtitle, template, components (each a typed spec placed in a slot), focusKey, presence, spoken text and summary. The composer wraps each component in \`[data-morph=<spec.key>]\`, so spec keys are the morph keys.
`,
  },
];
