## ADDED Requirements

### Requirement: The scaffold produces a defined file set per package from the manifest

The scaffold SHALL produce, for each package it generates, a defined set of files derived from that package's manifest entry: a `package.json`, the `tsconfig` set the build uses (`src`, `test`, `aggregate`, and `build`), an `rslib.config.ts`, a `vitest.config.ts`, a `README.md`, and the `src/` and `test/` directories. Each generated file SHALL be derived from the manifest entry — its path, name, and declared dependencies — so the manifest stays the single edit point. Root-level configuration shared across packages (the root `package.json`, `turbo.json`, the base tsconfigs, and the root vitest config) is authored separately and SHALL NOT be produced by the per-package scaffold.

#### Scenario: Scaffolding a package writes the full generated set

- **WHEN** the scaffold runs `package <key>` for a manifest entry
- **THEN** the generated file set includes that package's `package.json`, its `src`/`test`/`aggregate`/`build` tsconfigs, `rslib.config.ts`, `vitest.config.ts`, and `README.md`, and ensures its `src/` and `test/` directories exist

### Requirement: The scaffold is safe to re-run over existing source

The scaffold SHALL write structure and configuration only. It SHALL NOT author or move source, and re-running it over an already-scaffolded package SHALL leave any existing `src/` and `test/` contents untouched while regenerating the package's generated configuration. Regeneration SHALL therefore be safe to run at any time without risk to hand-written source.

#### Scenario: Re-running leaves hand-written source untouched

- **WHEN** the scaffold regenerates a package that already has hand-written files under `src/` and `test/`
- **THEN** the generated configuration is rewritten and the existing `src/` and `test/` contents are left unchanged
