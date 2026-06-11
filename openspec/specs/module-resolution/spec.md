# module-resolution

## Purpose

The `module-resolution` capability owns how INDRA programs assemble from files. Static imports resolve recursively and deepest-first before the first turn, so execution never begins with an unresolved directive. An import inlines the complete imported file (so transitive imports resolve), while a `use` clause narrows the exposed surface to its listed symbols. Resolution deduplicates by canonical absolute path — a diamond inlines once — and a true import cycle halts with a fatal error naming the cycle. Dynamic imports encountered during execution load synchronously, respect their `when:` guards, and are idempotent per session.

## Requirements

### Requirement: Static resolution completes before execution

The runtime SHALL resolve all static import directives before the first turn, recursively and deepest-first: when an imported file itself contains static imports, those SHALL be resolved before the importing file's resolution completes. Execution SHALL NOT begin while any static import directive remains unresolved.

#### Scenario: Transitive imports resolve before turn one

- **WHEN** the entry file imports A, and A imports B
- **THEN** B is resolved into A and A into the entry file before the first turn dispatches

### Requirement: An import inlines the full file; a use clause binds only its listed symbols

Resolving an import SHALL inline the complete content of the imported file, so the file's own transitive imports resolve. When the import carries a `use` clause, only the listed components SHALL be bound and exposed to the importing scope. When no `use` clause is present, all of the imported file's top-level components SHALL be visible.

#### Scenario: A use clause narrows the exposed surface

- **WHEN** a file imports `'lib.in' use @a` and `lib.in` defines top-level components @a and @b
- **THEN** the full content of `lib.in` is inlined (including @b's definition, so @b's own imports resolve)
- **AND** only @a is bound in the importing scope; a reference to @b from the importing file is an unresolved-component error

#### Scenario: No use clause exposes everything

- **WHEN** a file imports `'lib.in'` with no `use` clause
- **THEN** every top-level component of `lib.in` is visible to the importing file

### Requirement: Resolution deduplicates by canonical path and halts on cycles

Static resolution SHALL track a visited set keyed by canonical absolute path. A file already visited SHALL inline once; later references to it SHALL be no-ops binding the already-resolved components. A true import cycle SHALL halt resolution with a fatal `ImportCycleError` naming the cycle.

#### Scenario: A diamond inlines once

- **WHEN** A imports B and C, and both B and C import D
- **THEN** D's content is inlined exactly once and both B and C bind against that single resolution

#### Scenario: A cycle is a fatal error

- **WHEN** A imports B and B imports A
- **THEN** resolution halts with a fatal `ImportCycleError` naming the cycle A → B → A

### Requirement: Dynamic loading is blocking, conditional, and idempotent

A dynamic import directive encountered during execution SHALL load synchronously, blocking the current turn until the content is resolved and available. A dynamic import inside a `when:` block SHALL load only if the condition is true. Dynamic loading SHALL be idempotent per session: a file already loaded in the session SHALL NOT be loaded again.

#### Scenario: A conditional dynamic import respects its guard

- **WHEN** a `read_file:` directive sits inside a `when:` block whose condition is false
- **THEN** the file is not loaded

#### Scenario: A repeated dynamic import is a no-op

- **WHEN** an actor dynamically imports a file that was already loaded earlier in the session
- **THEN** the directive completes without re-loading and the previously loaded components remain available
