# E08 · Count-up numbers

**How it connects to your app.** Plain React. `<Count v={n} fmt={formatter} />` in screens; `<NumberRoll value format countUp />` on Home.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/ui/NumberRoll.tsx`, `src/ui/scene/components/shared.tsx`, `src/lib/format.ts`

**What it is.** Numbers count up as a component morphs in, then glide to later values.

- Screen numbers (`Count` / `useCountUp`): wait 520 ms (entrance), then 0 → value over 1,150 ms, ease-out; later changes tween from the current value with no wait.
- Home figures (`NumberRoll`): 700 ms ease-out cubic; on first load they wait for the intro to release them (E10).
- Reduced motion: values appear immediately.
- Formatting (`lib/format.ts`): tabular numerals, thousands separators, `Not available` for null, days to one decimal.

**Used by**: V01 Executive Home · V02 Applications in Processing · V03 Application Outcomes · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · V09 Online Visa Journey · V10 Centre Visit Journey · V11 Application Journey Map · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V19 Compare Side by Side · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · V23 Processing Time (focus) · V24 Not Available Yet · V25 Didn’t Understand
