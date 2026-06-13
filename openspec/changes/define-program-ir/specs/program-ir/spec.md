# program-ir

## Purpose

The `program-ir` capability defines the Program document: the artifact every front-end compiles to and the only thing the runtime executes. The format is held by a runtime schema rather than by convention, and every value in a document is plain JSON data, so a program can be written by one tool, checked by another, persisted as a snapshot, and picked back up later without losing its meaning.

One stance organizes all of the requirements: **the format is generous, execution is strict, and refusal is loud and named.** The format grows additively and defines constructs ahead of their execution, so a document written today stays readable as the language grows around it. The version field changes only when the meaning of an existing form changes — it answers "would this runtime misread the document," while the separate capability check answers "can this runtime run what the document uses." And nondeterminism enters a program only through named references that the host binds at load time; everything deterministic is either data in the document or a builtin versioned with the runtime, so the same document means the same thing on every host, every run.

## ADDED Requirements

### Requirement: The Program document is the only executable artifact

The runtime SHALL execute only a `Program` document conforming to the IR format. The format SHALL be defined by a runtime schema that decodes an unknown value into a `Program` at the boundary, and the TypeScript type for the IR SHALL be derived from that schema, so the schema is the single normative definition of the format. A document that fails to decode SHALL be rejected before any walker or interpreter reads it.

#### Scenario: A document is decoded before execution

- **WHEN** a Program document arrives from any producer — a front-end, a hand-built object, or a persisted snapshot
- **THEN** it is decoded against the Program schema before any interpretation begins
- **AND** a document that fails to decode is rejected with a typed decode error

#### Scenario: The store_in-absent await is expressible

- **WHEN** a producer emits an `await:` terminator with no `store_in:` target
- **THEN** the document decodes successfully, with the awaited return destined for `&result`

### Requirement: Program documents are JSON-serializable

Every value in a Program document SHALL be plain JSON data: strings, numbers, booleans, null, arrays, and string-keyed objects. Functions, class instances, and any other non-JSON value SHALL fail to decode, rejecting the document. A valid Program SHALL survive a JSON round trip unchanged, so the document can be persisted as a snapshot and rehydrated. Round-trip equivalence is deep structural equality of the decoded documents — the same relation the runtime's deep-equality guards define; key order and numeral spelling in the serialized text are not part of a document's identity. Object keys are document data only: a key naming an object prototype property has no effect on any runtime object's behavior.

#### Scenario: A non-serializable leaf rejects the document

- **WHEN** a document carries a function, class instance, `Date`, `Map`, or `undefined` leaf anywhere in its tree
- **THEN** schema decode fails and the document is rejected

#### Scenario: A Program survives a JSON round trip

- **WHEN** a valid Program is serialized with `JSON.stringify` and parsed back
- **THEN** the parsed value decodes to a Program deep-structurally equal to the original

#### Scenario: Keys naming object prototype properties are data

- **WHEN** a document contains a string key such as `__proto__` or `constructor` anywhere in its tree
- **THEN** decode treats the key as document data only
- **AND** no runtime object's prototype or behavior is altered by decoding the document

### Requirement: Non-deterministic leaves are referenced by name; deterministic constructs are data

The IR SHALL reference non-deterministic, host-bound behavior — inference functions now, tools later — by string name only, with behavior bound to each name through a registry at load time. Deterministic constructs SHALL NOT be registry entries: guards and value expressions are IR data evaluated by the runtime's evaluator, operator definitions are a table in the Program document like the actor table, and the pure-function leaves (`count`, `has_content`, `get_first`) are runtime builtins versioned with the runtime.

#### Scenario: The same document runs against different hosts

- **WHEN** the same Program referencing inference function `"WelcomeExplorer"` is loaded by a test host that binds the name to a stub and by a production host that binds it to a live model
- **THEN** both hosts execute the identical document; only the registry binding differs

#### Scenario: Pure functions are not host-swappable

- **WHEN** a host supplies a registry
- **THEN** the registry cannot rebind `count`, `has_content`, or `get_first`; those remain runtime builtins outside the registry

### Requirement: The root document carries a version field

Every Program document SHALL carry a version field on its root. The field SHALL be a string, and a version is recognized exactly when it is a member of the runtime's declared set of supported versions — no range, prefix, or structural interpretation. A document with no version field SHALL fail to decode. The compatibility policy for any document is validate-and-reject or migrate — a version the runtime does not recognize SHALL be rejected with a typed error, never silently reinterpreted against the current schema. Additive growth of the format — defining a new node form — SHALL NOT change the version; the version SHALL change exactly when the meaning of an existing form changes, since a construct the runtime cannot execute is caught by the capability check, while a form it would misread is caught only here.

#### Scenario: A missing version field rejects the document

- **WHEN** a document omits the root version field
- **THEN** schema decode fails and the document is rejected

#### Scenario: An unrecognized version is rejected, not reinterpreted

- **WHEN** a document carries a version the running runtime does not recognize
- **THEN** the document is rejected with a typed error naming the version
- **AND** the runtime does not best-effort-read the document against the current schema

#### Scenario: Additive format growth does not strand existing documents

- **WHEN** the format adds a new node form and a document uses only forms that predate it
- **THEN** the document remains recognized under its existing version
- **AND** no version gate rejects a document the runtime can read without misreading

### Requirement: The format defines constructs ahead of execution

The IR format SHALL define node forms for language constructs the runtime does not yet execute — `each`, `until`, `sequence`, operators, `become`, and prose templates — as the format grows to include them, so every producer targets one stable artifact. Whether a loaded runtime executes a construct SHALL be gated by the runtime's advertised capability set, not by the format admitting the node form.

#### Scenario: A forward-declared construct decodes against the schema

- **WHEN** a producer emits a document using a construct the format defines but the loaded runtime does not execute
- **THEN** the document decodes against the schema
- **AND** rejection happens at the capability check, naming the construct, not as a parse failure
