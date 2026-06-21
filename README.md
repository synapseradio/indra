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

INDRA's runtime unit: a sealed participant that takes turns under the conductor, with typed input, a typed return, and private working context unreadable from outside. An actor that consults the model realizes an agent: the conductor's turn cycle is the loop, and an inference leaf is where the model is consulted. An agent system is a composition of actors, and one actor can be replaced by a whole subtree of actors behind the same typed interface without any caller noticing.

## Where to go next

Read [docs/index.md](docs/index.md) for a map of the documentation. Read [runtime/README.md](runtime/README.md) to run what experimental modules exist today. Read [docs/principles.md](docs/principles.md) for the reasoning the whole design rests on.
