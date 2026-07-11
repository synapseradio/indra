# inference-layer

## REMOVED Requirements

### Requirement: Every inference returns a typed value

**Reason**: The `inference-layer` capability is retired. It framed INDRA as the generative surface that performs inference, but INDRA does not perform inference — a model is always consulted at an external provider. The validated-typed-value contract this requirement carried is kept, restated as the edge where an external result crosses back into the program.

**Migration**: See `inference-boundary`, "An inference boundary returns a typed value validated at the edge". The same retry-then-`InferenceParseError`-before-commit behavior is preserved there, expressed as validation at the model edge rather than as inference the runtime performs.

### Requirement: Inference output shapes are declared, not parsed from prose

**Reason**: Retired with the rest of `inference-layer`. The declared-output-shape contract is kept, relocated to the model edge.

**Migration**: See `inference-boundary`, "Output shapes are declared, not parsed from prose". A boundary declares a boolean, enum, class, or typed list, and the output-format instruction is generated from that declaration.

### Requirement: Personas are data records, never actors

**Reason**: Retired here, and persona is redefined rather than dropped. The `{identity, rules, understands}` record and the `as:` adoption form are removed with the colon-form surface, but a persona is kept as a first-class construct: an agent's authored configuration, with no actor lifecycle.

**Migration**: See `agent-configuration`. A persona is an agent's instructions, available tools, and other settings, composed as data and used to parameterize an agent; it no longer selects a record on a single inference call via `as:`.

### Requirement: Typed inference leads with a reasoning field

**Reason**: Dropped, not relocated. Mandating a leading `reasoning` field on every structured output made INDRA a reasoning framework, which it is not. The runtime mandates no reasoning field.

**Migration**: None required. A program that wants a reasoning field declares one on its output shape at an `inference-boundary` like any other field; the runtime neither requires nor privileges it.

### Requirement: Pure functions are host functions, and composition stays in the language

**Reason**: Dropped with the colon-form and angle-form (`<...>`) surface. INDRA is a TypeScript framework, not a protocol language, so pure computation such as `count` or `get_first` is ordinary TypeScript rather than a runtime-special host-function call, and there is no separate "protocol language" for composition to stay in.

**Migration**: Express pure computation as ordinary TypeScript functions in the authored program. The `select`-field discard guarantee is subsumed by declared output shapes at the `inference-boundary`: a boundary returns only its declared typed value, and a program reads the fields it needs by ordinary value access, so no un-read field ever becomes program state.
