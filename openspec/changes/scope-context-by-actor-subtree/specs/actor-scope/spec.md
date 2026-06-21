## ADDED Requirements

### Requirement: An actor's readable state is its lexical scope chain

An actor SHALL read exactly three sources: the immutable frames established by actors on its ancestor path, its own private state, and the values delivered as its declared inbound crossings. No other state SHALL be readable. A sibling's private state, and the private state of any actor not on the reader's ancestor path, SHALL be unreadable. State is typed (`framework-native-contracts`), so each readable source is a typed value and "readable" means in lexical scope as a typed value, not resolvable as a path.

#### Scenario: An actor reads an ancestor's frame

- **WHEN** a supervisor establishes a frame and spawns a child
- **THEN** the child may read that frame's typed value

#### Scenario: An actor cannot read a sibling's private state

- **WHEN** two actors are spawned by the same supervisor and one references the other's private state
- **THEN** the reference is not in the referencing actor's scope and does not typecheck

### Requirement: No accidental meld is enforced statically

A program in which an actor reads state outside its lexical scope chain SHALL be rejected before the first turn. The type system SHALL carry the enforceable share: a reference to a value not in an actor's scope — a sibling's private state, an undeclared crossing — does not typecheck, so the violation is an author-time error (`framework-native-contracts`). The load-time validator SHALL backstop what the type system cannot express statically — a spawn site whose actor identity is chosen at runtime, and crossing routing — rejecting a violating program with an error naming the actor, the reference, and the scope it escaped. No turn SHALL execute for a rejected program.

#### Scenario: A cross-actor read fails to typecheck

- **WHEN** an actor references a sibling's private state
- **THEN** the program fails to typecheck at author time
- **AND** no turn executes

#### Scenario: The validator backstops a dynamic spawn

- **WHEN** a spawn site selects an actor's identity at runtime and the chosen actor would read outside its spawn-site scope
- **THEN** the load-time validator rejects the program before turn one, naming the actor and the reference

#### Scenario: An in-scope read passes

- **WHEN** every reference an actor makes resolves to an ancestor frame, its own private state, or a declared inbound crossing
- **THEN** the program typechecks and load-time validation reports no no-meld violation

### Requirement: Crossings are the only inter-actor data path

Actors SHALL communicate only by crossings. A crossing is an explicit typed envelope an actor emits and a supervisor routes to a named recipient's declared inbound interface. The envelope's value shape is the typed crossing `framework-native-contracts` defines; this capability governs its routing — only the declared fields cross, and the sender's private state SHALL NOT cross. A declared field MAY carry prose, but only the declared fields cross, never the sender's working memory.

#### Scenario: A crossing delivers only its declared fields

- **WHEN** an actor emits a typed crossing to a recipient
- **THEN** the recipient reads the declared fields
- **AND** the recipient cannot read the sender's private state

#### Scenario: An undeclared crossing field does not typecheck

- **WHEN** a recipient references a field not on its declared inbound interface
- **THEN** the reference does not typecheck

### Requirement: An actor is addressable only through its interface

A caller SHALL address another actor only through its typed interface: the crossings it accepts and the value it returns. The actor's private state and any subtree it supervises SHALL be unaddressable from outside that interface. Replacing an actor's implementation — one inference leaf, or a subtree of actors — SHALL NOT change what any caller or sibling observes, provided the interface is unchanged.

#### Scenario: A caller observes only the typed return

- **WHEN** a caller awaits an actor implemented as a single inference leaf, then the actor is reimplemented as a supervised subtree with the same interface
- **THEN** the caller receives the same typed return in both cases
- **AND** the caller cannot address the subtree's internal actors or their private state

### Requirement: Scope is checked modularly so dynamic spawning stays sound

Validation SHALL check each actor against its own scope and each call site against the callee's declared interface, without requiring the whole actor tree to be statically known. A spawned actor's lexical position — its spawn site — SHALL determine the frame it inherits and the crossing shapes it may receive, even when the spawned actor's identity is selected at runtime. The type system SHALL carry this where the spawn site's types prove it; the load-time validator SHALL check the residue that depends on runtime-chosen identity.

#### Scenario: A dynamically-selected actor is checked against its spawn-site scope

- **WHEN** a spawn site selects an actor's identity from a runtime value but declares the inherited frame and inbound crossing shapes
- **THEN** validation checks the spawned actor against the declared scope regardless of which identity is selected

### Requirement: One inference leaf is one inference call

A single inference leaf SHALL be exactly one inference call: one consultation of the model. Composition that combines more than one inference result SHALL be expressed as distinct actors exchanging crossings, above the leaf, never as multiple inference calls collapsed into a single leaf. Prompt-string assembly below the leaf — composing one call's prompt from fragments — is internal to that inference call and is not a crossing.

#### Scenario: Multi-result composition is not a single leaf

- **WHEN** a choreography composes the contributions of two inference calls
- **THEN** each is a distinct actor with its own inference leaf
- **AND** their contributions meet through a typed crossing, not inside one prompt
