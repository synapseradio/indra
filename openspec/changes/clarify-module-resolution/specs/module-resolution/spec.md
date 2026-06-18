## MODIFIED Requirements

### Requirement: An import inlines the full file; a use clause binds only its listed symbols

Resolving an import SHALL inline the complete content of the imported file, so the file's own transitive imports resolve. When the import carries a `use` clause, only the listed components SHALL be bound and exposed to the importing scope; when no `use` clause is present, all of the imported file's top-level components SHALL be visible. Narrowing by `use` SHALL apply per import site against the single inlined definition: when the same file is imported from two sites with different `use` clauses, each site SHALL bind its own listed symbols, and one site's narrowing SHALL NOT affect what another site binds. The `use` clause narrows only the importing file's scope.

#### Scenario: A use clause narrows the exposed surface

- **WHEN** a file imports `'lib.in' use @a` and `lib.in` defines top-level components @a and @b
- **THEN** the full content of `lib.in` is inlined (including @b's definition, so @b's own imports resolve)
- **AND** only @a is bound in the importing scope; a reference to @b from the importing file is an unresolved-component error

#### Scenario: Two sites import the same file with different use clauses

- **WHEN** file P imports `'lib.in' use @a` and file Q imports `'lib.in' use @b`, and `lib.in` is inlined once
- **THEN** P binds @a and Q binds @b, each against the single inlined definition
- **AND** Q's binding of @b is unaffected by P having narrowed to @a

#### Scenario: No use clause exposes everything

- **WHEN** a file imports `'lib.in'` with no `use` clause
- **THEN** every top-level component of `lib.in` is visible to the importing file

### Requirement: Resolution deduplicates by canonical path and halts on cycles

Static resolution SHALL track a visited set keyed by canonical absolute path. A **canonical absolute path** SHALL be the path with symlinks resolved to their target, normalized, made absolute, and case folded according to the filesystem's case sensitivity, so that two specifiers naming the same underlying file canonicalize equal — including two case variants on a case-insensitive filesystem and two symlinks to one target. The visited set SHALL distinguish a path **in progress on the current resolution stack** from a path **already fully resolved**: encountering a path already on the current stack SHALL halt resolution with a fatal `ImportCycleError` naming the cycle, while encountering an already-resolved path SHALL inline once and bind the already-resolved components as a no-op.

#### Scenario: A diamond inlines once

- **WHEN** A imports B and C, and both B and C import D
- **THEN** D's content is inlined exactly once and both B and C bind against that single resolution

#### Scenario: Two case variants resolve to one file

- **WHEN** one import names `lib.in` and another names `Lib.in` on a case-insensitive filesystem, both naming the same file
- **THEN** the two specifiers canonicalize equal and the file is inlined exactly once

#### Scenario: A cycle is a fatal error

- **WHEN** A imports B and B imports A, so A is re-encountered while still in progress on the current resolution stack
- **THEN** resolution halts with a fatal `ImportCycleError` naming the cycle A → B → A
