## Why

The `package-boundaries` capability says the inward-only dependency rule is "a structural fact the compiler enforces," but every scenario it carries tests that a declared edge is *absent* from a package's resolved dependencies — inspection of the manifest, not a compile failure on a violating import. The two are not the same. Worse, the test runner would let a violation through: `package-scaffold` describes a test-time alias map that is "process-global" and "rewrites the specifier wherever it appears," so an outward import from the core to the choreography would resolve to source and the test would pass. The boundary is enforced by `tsc -b` through project references alone; the test runner is intentionally permissive. The code already documents this split — the vitest base config's own comment says "tsc still resolves built `.d.ts` across packages via project references; this alias map is the test runner's concern only" — but neither spec states it, so a reader reasonably believes a boundary-violating test fails. It does not.

Two smaller gaps sit alongside. The core-choreography requirement pins enforcement to "today a comment, `runtime/ARCHITECTURE.md:45`," which is transitional framing and a loose citation — that line is prose pointing elsewhere, not a comment. And `package-scaffold` says the scaffold "produces" each package's files but specifies only the README and the vitest config, omitting the rest of the generated set and the scaffold's safe-to-re-run property, both of which the scaffold CLI already guarantees in its header.

## What Changes

- State that the inward-only rule is **enforced by the type build**: `tsc -b` through project references rejects an outward import, and the **test-time alias map does not enforce boundaries** — it resolves any `@indra/runtime-*` specifier to source by design, so a green test run is not evidence the boundaries hold.
- Drop the transitional "today a comment, `ARCHITECTURE.md:45`" framing from the core-choreography requirement and state the enforcement mechanism directly.
- Enumerate the **full generated file set** the scaffold produces per package — `package.json`, the `src` / `test` / `aggregate` / `build` tsconfigs, `rslib.config.ts`, `vitest.config.ts`, `README.md`, and the `src/` and `test/` directories — all derived from the manifest entry.
- State the scaffold's **re-run safety**: it writes structure and configuration only, never authors or moves source, and leaves existing `src/` and `test/` contents untouched.

## Capabilities

### Modified Capabilities

- `package-boundaries`: add the enforcement-mechanism requirement (type build enforces, test runner is permissive); restate the core-choreography requirement without transitional framing.
- `package-scaffold`: add the full generated output set and the re-run safety property.

## Impact

- Makes the "compiler enforces" claim testable: a deliberate outward import is asserted to fail `tsc -b`, and the permissiveness of the test alias map is stated rather than implied.
- Aligns the README's "inward-only dependency invariants enforced across the cuts" with what actually enforces them.
- No behavior change; the scaffold and the build already work this way. The specs are brought up to what the code does.
