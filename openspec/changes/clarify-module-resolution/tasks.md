## 1. Define and implement canonical path

- [ ] 1.1 Implement canonical-path computation: resolve symlinks, normalize, make absolute, case fold per filesystem case sensitivity
- [ ] 1.2 Add tests for two case variants on a case-insensitive filesystem inlining once, and two symlinks to one target inlining once

## 2. Per-import-site use scoping

- [ ] 2.1 Apply `use` narrowing per import site against the single inlined definition
- [ ] 2.2 Add a test that the same file imported with different `use` clauses binds each site's own symbols

## 3. Cycle vs diamond in the visited set

- [ ] 3.1 Distinguish in-progress-on-stack from fully-resolved in the visited set
- [ ] 3.2 Add tests that an in-progress re-encounter is a fatal `ImportCycleError` and a resolved re-encounter is a no-op dedup
