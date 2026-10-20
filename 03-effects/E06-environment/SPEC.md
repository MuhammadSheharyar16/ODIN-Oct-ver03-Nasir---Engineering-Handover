# E06 · Environment: room, blur, camera push

**How it connects to your app.** Mount inside the Stage (E00). Set `useStage.getState().setFocus(0 | 1)` (1 = any answer screen: room recedes) and `envView.target` (camera push; `floorView()` for the online journey).

**Libraries.** `three`, `@react-three/fiber`, `@react-three/drei`

**Source** (in `source/`, same paths as the reference app): `src/scene/EnvironmentLayers.tsx`, `src/scene/CameraRig.tsx`, `src/lib/envFit.ts`, `src/lib/intro.ts`

**What it is.** The daylight ODIN interior as two real depth layers: exterior waterfront plate (depth 15) behind, interior arch with true alpha (depth 10) in front. Pixels as supplied, no regrade. Cover-fitted with 7% overscan for parallax; artwork aspect 7600 × 4652. Sky and water shimmer drift; skyline stays put. Variant by screen pixels: 1600 / 2560 / 3840 px WebP (+ pre-blurred copies).

**Focus (answer screens).** Eases at rate 3.2/s. Exterior: blur 0.85, dim to 0.78, saturation 0.82. Interior: blur 0.45, dim 0.72, saturation 0.85. Home: all at rest.

**Camera.** Slow drift parallax (rate 1.6/s). Online journey (V09, wide): push onto the floor so the bottom ~61% of the artwork fills the screen (`FLOOR_CY 0.696`), panned so the journey is centred.

**Fallback (recommended).** CSS: two stacked `<img>` layers with `filter: blur() brightness() saturate()` at the focus values above, transitioned ~600 ms.

**Used by**: S01 Intro load-in · V01 Executive Home · V02 Applications in Processing · V03 Application Outcomes · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · V09 Online Visa Journey · V10 Centre Visit Journey · V11 Application Journey Map · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V19 Compare Side by Side · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · V23 Processing Time (focus) · V24 Not Available Yet · V25 Didn’t Understand
