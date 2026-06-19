# git-hooks

## Purpose

The `git-hooks` capability owns the local verification gates that run on the developer's machine before work is shared. With no CI yet, nothing otherwise catches a broken type, a lint violation, a failing test, or an invalid spec before a commit or push lands. This capability puts that gate where the work happens: a fast, mostly staged-scoped check at commit time, and the full suite at push time, leaning on Turbo's cache so the full run stays cheap enough to run on every push. A failing check blocks the operation rather than printing advice, and the hooks install themselves on a fresh clone so the gate is never something a contributor has to remember to wire up.

## ADDED Requirements

### Requirement: The pre-commit hook runs a fast staged-scoped gate

The pre-commit hook SHALL run, scoped to the staged files where the tool supports it: a Biome check-and-fix over the staged JavaScript and TypeScript files that restages whatever it rewrites, a markdownlint pass over the staged Markdown files, and a cached full type-check through Turbo. The type-check SHALL be the whole-program `check:types`, relying on Turbo's cache to stay near-instant when nothing relevant changed, so a commit still carries type coverage without a per-file type-check.

#### Scenario: A staged formatting fix is restaged

- **WHEN** the pre-commit hook runs and Biome rewrites a staged TypeScript file to satisfy its checks
- **THEN** the rewritten file is restaged so the commit includes the fix
- **AND** only the staged JavaScript and TypeScript files are passed to Biome

#### Scenario: Markdown is linted over the staged files

- **WHEN** a commit stages one or more Markdown files
- **THEN** the pre-commit hook runs markdownlint over those staged Markdown files

#### Scenario: The cached type-check stays cheap when nothing relevant changed

- **WHEN** the pre-commit hook runs its `check:types` step and no input the type-check depends on has changed since the last run
- **THEN** Turbo serves the cached result rather than re-running the full type-check
- **AND** the commit still gets full type coverage

### Requirement: The pre-push hook runs the full verification suite

The pre-push hook SHALL run the full suite, unscoped: `check:types`, `lint`, `lint:docs`, and `test` through Turbo — the repository's `check` plus `test` — together with `openspec validate --strict` across the changes. Turbo caching SHALL keep the repeat cost of the run low.

#### Scenario: The full suite and spec validation run before a push

- **WHEN** a developer pushes
- **THEN** the pre-push hook runs `check:types`, `lint`, `lint:docs`, and `test` through Turbo and `openspec validate --strict` across the changes before the push proceeds

### Requirement: A failing check blocks the operation

A failing check SHALL block the git operation that triggered it: a failing pre-commit check blocks the commit, and a failing pre-push check blocks the push. The hooks SHALL be the enforcement, never advisory output that the operation ignores.

#### Scenario: A failing pre-commit check blocks the commit

- **WHEN** any pre-commit check fails
- **THEN** the commit does not complete and the failure is surfaced to the developer

#### Scenario: A failing pre-push check blocks the push

- **WHEN** any pre-push check fails
- **THEN** the push does not proceed and the failure is surfaced to the developer

### Requirement: The hooks install on clone

The hooks SHALL be installed as part of dependency installation — a `postinstall` or `prepare` script that runs `lefthook install` — so a fresh clone has the hooks wired without a manual step.

#### Scenario: A fresh clone has the hooks wired after install

- **WHEN** a contributor clones the repository and installs dependencies
- **THEN** the pre-commit and pre-push hooks are installed without any manual hook-setup step
