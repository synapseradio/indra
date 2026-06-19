## 1. Tooling and install wiring

- [x] 1.1 Add `lefthook` to the workspace `tooling` catalog and as a root dev dependency
- [x] 1.2 Add a root `postinstall`/`prepare` script that runs `lefthook install` so a fresh clone wires the hooks
- [x] 1.3 Add a root `lefthook.yml` defining the `pre-commit` and `pre-push` command sets

## 2. Pre-commit gate

- [x] 2.1 Run Biome check-and-fix over the staged JS/TS files and restage what it rewrites
- [x] 2.2 Run markdownlint over the staged Markdown files
- [x] 2.3 Run `check:types` (incremental `tsc -b`) as the type-coverage step

## 3. Pre-push gate

- [x] 3.1 Run the fix-variant lint scripts over the pushed files (`lint:staged` for JS/TS, `lint:docs:fix` for Markdown), then `check:types`, then `test`
- [x] 3.2 Confirm a failing check blocks the push and a failing pre-commit check blocks the commit

## 4. Verification

- [x] 4.1 Verify a fresh clone installs the hooks through dependency install with no manual step
- [x] 4.2 Verify the cached type-check is near-instant on a no-op commit
