# V11 · Application Journey Map

> End-to-end stages as orbs with volumes and average days.

| | |
|---|---|
| Type | Screen |
| Opens with | “Show the application journey map” |
| Feature | F07a |
| Scope status | **Green** · In October scope. |
| Template | `journey` |
| Components | `metric`, `journey` |
| 3D objects (E04) | plinths |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E04](../../03-effects/E04-3d-objects/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V11` |

**Notes.** Card C headline cards.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Panels.tsx`
- `src/ui/scene/components/Showcase.tsx`
- `src/ui/scene/HeroGlass.tsx`
- `src/ui/scene/hero-glass.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `metric` · key `total-online`: `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`, `card`
- `metric` · key `e2e-online`: `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`, `card`
- `journey` · key `journey`: `channel`, `stages`, `approved`, `rejected`, `emphasisKey`, `variant`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `total-online`, `e2e-online`, `journey`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V11. Done = contract test + acceptance test (`ODIN_VIEWS=V11`) pass, motion reviewed.
