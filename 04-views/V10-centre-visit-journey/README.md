# V10 · Centre Visit Journey

> Appointment → payment → biometrics → interview on 3D pedestals.

| | |
|---|---|
| Type | Screen |
| Opens with | “Show the centre visit journey” |
| Feature | F07b |
| Scope status | **Amber** · In scope with known data gaps (see notes). |
| Template | `journey` |
| Components | `metric`, `journey` |
| 3D objects (E04) | pedestal |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E04](../../03-effects/E04-3d-objects/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V10` |

**Notes.** Arrival at centre shown as Not available (event not captured yet).

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Panels.tsx`
- `src/ui/scene/components/Journey.tsx`
- `src/ui/scene/components/journeyGeometry.ts`
- `src/ui/scene/HeroGlass.tsx`
- `src/ui/scene/hero-glass.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `metric` · key `total-appointments`: `card`, `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`
- `metric` · key `biometrics-captured`: `card`, `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`
- `journey` · key `journey`: `channel`, `stages`, `approved`, `rejected`, `outcomeLabels`, `emphasisLabel`, `emphasisKey`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `total-appointments`, `biometrics-captured`, `journey`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V10. Done = contract test + acceptance test (`ODIN_VIEWS=V10`) pass, motion reviewed.
