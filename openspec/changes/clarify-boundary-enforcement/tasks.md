## 1. State enforcement in package-boundaries

- [ ] 1.1 Document that `tsc -b` project references enforce the inward-only rule and the test alias map does not
- [ ] 1.2 Add a test/check that a deliberate outward import (core → choreography) fails `tsc -b`
- [ ] 1.3 Note in the boundary docs that a green offline test run is not evidence the boundaries hold

## 2. Scaffold output set and re-run safety

- [ ] 2.1 Reflect the full generated file set per package in the scaffold spec and any scaffold docs
- [ ] 2.2 Confirm (test or check) that re-running the scaffold leaves existing `src/` and `test/` untouched
