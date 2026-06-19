## Why

There is no CI yet, so nothing catches a broken type, a lint violation, a failing test, or an invalid spec before the work is shared — a commit or push can land red with no gate. Lefthook puts that gate on the developer's machine: a fast staged-file check at commit time and the full suite at push time, leaning on Turbo's cache so the full run stays cheap enough to run on every push.

## What Changes

- Add **Lefthook** as the git-hooks manager: a root `lefthook.yml` and an install step so every clone wires the hooks.
- **pre-commit** runs a fast, mostly staged-scoped gate, behaving like lint-staged:
  - Biome check-and-fix on the staged JS/TS files, restaging what it fixes.
  - markdownlint on the staged Markdown files.
  - a cached `turbo run check:types` — the full type-check, but Turbo's cache makes it near-instant when nothing relevant changed, so a commit still gets type coverage without a per-file type-check.
- **pre-push** runs the full suite, unscoped: `turbo run check:types lint lint:docs test` (the repo's `check` plus `test`) and `openspec validate --strict` across the changes. Turbo caching keeps the repeat cost low.
- A failing check **blocks** the commit or the push; the hooks are the enforcement, not advisory output.

## Capabilities

### New Capabilities

- `git-hooks`: the local verification gates — which checks run at pre-commit (staged-file lint and format, plus a cached full type-check) versus pre-push (full lint, docs lint, type-check, tests, and spec validation), that a failure blocks the operation, and that the hooks install on clone.

### Modified Capabilities

- none. This is toolchain configuration; no runtime capability's requirements change.

## Impact

- **New dev dependency**: `lefthook`, added through the workspace catalog like the other tooling.
- **New config**: a root `lefthook.yml` defining the `pre-commit` and `pre-push` command sets.
- **Install wiring**: `lefthook install` runs on dependency install (a `postinstall`/`prepare` script) so a fresh clone has the hooks without a manual step.
- **Staged-file scoping**: pre-commit invokes Biome and markdownlint with the staged file list rather than the whole-repo `lint`/`lint:docs` scripts, because lint-staged behavior needs file arguments; pre-push uses the whole-repo package scripts.
- No change to runtime behavior or to any existing spec.
