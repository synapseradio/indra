## 1. Tooling and install wiring

- [ ] 1.1 Add `lefthook` to the workspace `tooling` catalog and as a root dev dependency
- [ ] 1.2 Add a root `postinstall`/`prepare` script that runs `lefthook install` so a fresh clone wires the hooks
- [ ] 1.3 Add a root `lefthook.yml` defining the `pre-commit` and `pre-push` command sets

## 2. Pre-commit gate

- [ ] 2.1 Run Biome check-and-fix over the staged JS/TS files and restage what it rewrites
- [ ] 2.2 Run markdownlint over the staged Markdown files
- [ ] 2.3 Run a cached `turbo run check:types` as the type-coverage step

## 3. Pre-push gate

- [ ] 3.1 Run `turbo run check:types lint lint:docs test` (the repo's `check` plus `test`)
- [ ] 3.2 Run `openspec validate --strict` across the changes
- [ ] 3.3 Confirm a failing check blocks the push and a failing pre-commit check blocks the commit

## 4. Verification

- [ ] 4.1 Verify a fresh clone installs the hooks through dependency install with no manual step
- [ ] 4.2 Verify the cached type-check is near-instant on a no-op commit
