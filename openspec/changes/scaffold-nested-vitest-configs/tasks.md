## 1. README generator

- [ ] 1.1 Add a `readme` generator to `scripts/scaffold/parts.ts` that produces `<relpath>/README.md` from the manifest entry (package name, a description slot, conventional section headings); add a per-package description field to `manifest.ts` only if the template needs more than the name
- [ ] 1.2 Wire `readme` into the `packageScaffold` composition and add a `readme` subcommand to `scripts/scaffold/index.ts`, consistent with the other part subcommands

## 2. Self-contained nested vitest config

- [ ] 2.1 Rewrite the `vitestConfig` generator to emit a self-contained `vitest.config.ts`: the `vite-tsconfig-paths` plugin for `~/*`, plus a generated `resolve.alias` map covering every workspace package (`@indra/runtime-*` → `../<dep>/src/index.ts`) and the `@indra/runtime-core/inference-live` subpath, plus `test` name/root/environment/include/exclude
- [ ] 2.2 Remove the root `vitest.shared.ts` and `vitest.workspace.ts`, and drop any scaffold code that generated or referenced them
- [ ] 2.3 Regenerate all packages with the scaffold (`all`) and confirm the working tree matches the generators

## 3. Turbo orchestration and type-check gate

- [ ] 3.1 Update `turbo.json` so the `test` task declares `dependsOn` on `check:types` and `^check:types` (alongside the existing generate edges), enforcing type-check-before-test in every scope
- [ ] 3.2 Confirm the root `test` script runs through `turbo run test` and that each package's `test` script is `vitest run`

## 4. Verify

- [ ] 4.1 State the expectation first: the offline suite resolves cross-package and transitive `@indra/runtime-*` imports and `~/*` to source with no build; run it and confirm green via the package script
- [ ] 4.2 `turbo run test` is a cache hit for an unchanged package on a second run, and a change to one package does not rerun another's tests
- [ ] 4.3 Type-checking is shown to run before tests under turbo (the `test` task waits on `check:types`)
- [ ] 4.4 `tsc -b` from the repo root is green and still resolves cross-package types through project references
- [ ] 4.5 Every package directory contains a generated `README.md`
