# INDRA

INDRA is a framework for building agent systems you can refactor. It is currently in exploratory phases. It is inspired by the [Syndicated Actor Model](https://synit.org/book/syndicated-actor-model.html).

## Vocabulary

These are some foundational terms INDRA uses, defined precisely.

### inference

The substrate of AI operations: stochastic calculation internal to a model. Inference is opaque and non-deterministic.

### inference call

An API call that routes a query — usually a natural-language prompt — to a model, often through an inference provider. One inference call is one consultation of the model.

### agent

An inference call placed inside a loop, where each iteration is conditioned on context accumulated over prior iterations and on the results of actions the loop lets the model take. An agent acts on its environment through tools, which the framework's end user supplies in whatever form the task needs; the loop, not the single call, is what makes it an agent. In mainstream usage the model drives the loop and decides when to stop.

### actor

INDRA's runtime unit: a sealed participant that takes turns under the runtime's deterministic dispatch, with typed input, a typed return, and private working context unreadable from outside. An actor that consults the model realizes an agent: the turn cycle is the loop, and the inference boundary is where the model is consulted. An agent system is a composition of actors, and one actor can be replaced by a whole subtree of actors behind the same typed interface without any caller noticing.

### inference boundary

The one marked place where a turn hands off to non-deterministic inference and gets a typed value back. A program's non-determinism is confined to its inference boundaries; the dispatch around them is fixed, so the same program over the same inputs runs the same way each time.

### assertion

A published, retained, typed value, and INDRA's core primitive for sharing state. Its body is a fact. An assertion stays only while the actor that published it maintains it, and the runtime retracts it automatically when that actor ends, on a crash as much as a clean exit, so the disappearance of a fact is itself a failure signal.

### fact

The body of an assertion: the typed value it carries. The current facts together are a program's shared state.

### observe

The act by which an actor declares interest in facts of a given shape. The runtime delivers every matching fact as it appears and signals when one retracts. An actor's context is assembled from the facts it observes, and isolation is the guarantee that another actor's facts stay out of that context unless observed.

### dataspace

The single shared pool where every published fact lives and from which each observed fact is delivered. There is one dataspace; an actor never sees all of it, only the facts its capability admits.

### capability

An actor's handle to the dataspace, narrowable so the holder may observe and assert only some facts. The narrowing is attenuation, and it is where isolation is set by hand. A capability is a scoped permission, like a read-only key to one storage bucket, and attenuation mints a child key that can do less.

### message

A transient value sent once and not retained, for the cases where a lasting fact is not wanted. Where an assertion persists until it is retracted, a message simply arrives.

### persona

An agent's authored configuration: its instructions, its available tools, and its other settings, held as a value with no actor lifecycle of its own. A persona is reusable across agents and composes with other personas by a deterministic data merge — layering instructions, adding tools, extending settings — resolved before any turn runs. Composing personas is data composition, distinct from the side-effect scheduling that composing agents requires. An agent is parameterized by a persona, which supplies the constraints its inference boundary marshals into the model request.

The word also names, as a mental model, the emergent and often anthropomorphic character that configuration produces in inference output. As a technique that character is invoked by a natural-language role description, `you are a ___, your role is ___`; as a result it is the character that grows more noticeable as a session progresses, as persona prompts are composed, made more explicit, or placed earlier in the context the call receives. That emergent character is a mental-model term and appears in no specification.

## Where to go next

Read [docs/index.md](docs/index.md) for a map of the documentation. Read [runtime/README.md](runtime/README.md) to run what experimental modules exist today. Read [docs/principles.md](docs/principles.md) for the reasoning the whole design rests on.
