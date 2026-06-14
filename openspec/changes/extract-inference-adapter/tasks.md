## 1. Create the adapter package

- [ ] 1.1 Add `@indra/runtime-inference-baml` to the workspace (depends on `@indra/runtime-core` and `@indra/runtime-contracts`; declares the sole `@boundaryml/baml` dependency) with its tsconfig trio, `rslib.config.ts`, and manifest
- [ ] 1.2 Place `experiments/` under the adapter package

## 2. Move the result shape into contracts

- [ ] 2.1 Move `WelcomeResult` into `@indra/runtime-contracts`
- [ ] 2.2 Repoint the port's `WelcomeResult` import (`inference.ts`) to `@indra/runtime-contracts`

## 3. Relocate the adapter and codegen

- [ ] 3.1 Move `inference.layer.ts`, `baml_src/`, and the generated `baml_client/` into `@indra/runtime-inference-baml`
- [ ] 3.2 Repoint `generators.baml`'s `output_dir` and move the `baml_client/` `.gitignore` entry into the adapter so `baml-cli generate` writes only inside the adapter
- [ ] 3.3 Formalize `baml/inference.ts` (tag, interface, stub) as a first-class `@indra/runtime-core` module, out of the shared `baml/` subdirectory

## 4. Wire the host and repoint tests

- [ ] 4.1 Wire `@indra/runtime-inference-baml` behind the port in `@indra/runtime-host`
- [ ] 4.2 Repoint `seam-typed-return.test.ts` and `conductor-cycle.test.ts` to import `WelcomeResult` from `@indra/runtime-contracts`
- [ ] 4.3 Point `live-turn.live.test.ts` at the adapter package for its live dependency

## 5. Verify the boundaries hold

- [ ] 5.1 `@indra/runtime-core` carries no `@boundaryml/baml` dependency and typechecks without running codegen
- [ ] 5.2 `@indra/runtime-inference-baml` is the sole BAML dependant in the workspace
- [ ] 5.3 `WelcomeResult` resolves from `@indra/runtime-contracts` everywhere, with no import reaching into the generated `baml_client` directory
- [ ] 5.4 The offline suite is green; the gated live turn is green through the adapter
- [ ] 5.5 Add the inference-adapter-extraction entry to the monorepo-bootstrap initiative ledger
