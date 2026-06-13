# INDRA documentation

INDRA is a language for choreographing reasoning. You describe a thinking process and a deterministic runtime carries it out, while a language model supplies judgment at the bounded inference points you mark. The structure runs the same way every time; the judgment is the model's. This page maps the documentation so you can go straight to what you need.

## Start here

If you are new to INDRA, read the [language guide](./language.md). It covers actors, personas, the `<...>` inference channel, the shared `&context` world, the `say:`/`await:`/`return:` control transfers, and the human as a first-class actor addressed as `@user`. Every construct is shown with an example drawn from a real program in `legacy/commands/` or `legacy/lib/prism/`.

To run what exists today, follow [runtime/README.md](../runtime/README.md). It explains how to install dependencies, generate the inference client, run the offline test suite, and drive a real turn against a model.

## The map

The documentation divides along a clear seam: what the language is, how the runtime is built, where the toolchain is headed, and why the design holds together.

- **[The language](./language.md)** — what you write in a `.in` file and what it means. The observable surface and semantics: actors and turns, personas as voices, the inference channel, the shared world, control transfer, and the human as a participant.
- **[The architecture](./architecture.md)** — how the runtime executes the language. The three-layer split that owns choreography, substrate, and inference; the reserved namespaces and the rules that protect them; how genuine inference is told apart from pure computation; and how a turn is carried out.
- **[The toolchain](./toolchain.md)** — where the project is headed. The pipeline that grows outward from the language core: a parser producing a spanned syntax tree, module resolution, a command-line runner, an agent-integrated REPL where the human acquires the turn baton, and editor support. This is also where INDRA constructs compile into generated inference functions.
- **[The principles](./principles.md)** — the reasoning the whole design rests on. Each principle states what it protects and where it is enforced, so a change that strains against one can be recognized before it lands.
- **The specifications (`../openspec/specs/`)** — the normative contract the runtime is held to. Each capability's spec opens with a purpose that names what it protects, then states requirements with scenarios a test can verify. Beneath the specs, the change records in `../openspec/changes/` and its archive keep the design reasoning, the alternatives considered, and the research behind each decision — so every requirement has a findable why.

## What runs today versus what is planned

The runtime's offline core is complete and tested, and the live inference seam is proven by a gated test that drives one full turn against a real model. The program the runtime executes today is a hand-authored syntax tree rather than a `.in` file parsed from disk; a walking skeleton proves the architecture end to end before breadth is added.

The documentation keeps current capability and planned capability distinct everywhere the two could be confused. The language guide states plainly where a construct is defined in the language but not yet carried out by the runtime. Planned work lives in the [toolchain](./toolchain.md) document, clearly marked as the direction the project is building toward.

## The repository

- `runtime/` — the deterministic TypeScript runtime. See [runtime/README.md](../runtime/README.md).
- `openspec/` — the normative specifications and the change records behind them.
- `docs/` — this documentation.
- `legacy/` — the prompt-era source, kept for reference and not part of the current system: the PRISM library (`legacy/lib/prism/`, see [its README](../legacy/lib/prism/README.md)), the commands assembled from it (`legacy/commands/`), the protocol (`legacy/core/`), the agent definitions (`legacy/thinkies/`), and the original documentation (`legacy/docs/`). The PRISM library it describes is not yet implemented.
