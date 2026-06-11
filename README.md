# INDRA

INDRA is a language for choreographing reasoning. You describe a thinking process — who speaks, in what voice, what they ask, what they decide — and a deterministic runtime carries out that choreography while a language model supplies judgment at the points you mark for it. The structure you write runs the same way every time. The judgment is the model's, and it happens only inside the bounded inference points you place by hand.

The name is **I**nferential **N**arrative **D**riven **R**easoning **A**ctors. The idea underneath it is that human insight and machine inference are complementary. People weave context into meaning and recognize what matters; inference engines read and generate at a scale and speed people cannot. When the two are combined, each unburdened by the other's limits, they can reach insights neither would reach alone. INDRA is built to make that combination something you can write down, compose, and run.

One consequence of that framing shapes the whole design: the sophistication of an INDRA program lives in the assembly, not the model. The choreography, the composition, and the small typed inference leaves carry the weight, so weak models suffice. The principles that follow from this are in [docs/principles.md](docs/principles.md).

## What an INDRA program looks like

An INDRA program is built from actors that take turns, personas they speak through, a shared world they coordinate in, and inference points where the model supplies a judgment. Here is a step from the tree-of-thought reasoning module. It adopts a persona, speaks in that voice, asks the model to choose a direction, and writes the model's choice into the shared world:

```indra
  step:
    as: @careful_evaluator
    method: `choosing exploration path`
    output: <<|
      I'm sensing whether it's more helpful to go deeper on our current thread, or broaden our perspective...
    |>>
    set:
      &context.tree.mode: ${<deepen or broaden>}
```

The `as: @careful_evaluator` puts on a persona, a voice the step thinks in. The `output:` is what the actor says. The `${<deepen or broaden>}` is the inference channel: the one bounded judgment the model is asked to make, here a choice between two named directions. The result is written into the shared world at `&context.tree.mode`, where a later step reads it and decides where the exploration goes. The model supplies the judgment; the runtime decides the control flow that judgment feeds.

The human takes part in the same way any actor does. An actor awaits the human exactly as it would await another actor, then reads what the human contributed and writes it into the shared world:

```indra
              await: @user
              set:
                &context.ponder.topic: &user.latest
```

For the full language — actors, personas, the `<...>` inference channel, `&context`, `say:`/`await:`/`return:`, and the human as a first-class actor — read [docs/language.md](docs/language.md).

## What runs today

The deterministic runtime is a TypeScript program that executes INDRA. Its offline core is complete and tested: the generic actor interpreter, the conductor that owns the turn cycle, the shared context store with its staged-versus-immediate write rule, the typed inference return path, and `await:` delegation all run and are covered by tests against a stub inference layer. The live seam is proven too — a gated test drives one full turn against a real model, from typed inference return through commit to output.

The program the runtime executes today is a hand-authored syntax tree, not a `.in` file parsed from disk. A walking skeleton proves the architecture end to end through all of its layers before breadth is added on top. How to install, generate the inference client, and run the offline suite and a live turn is documented in [runtime/README.md](runtime/README.md).

What is built today and what is planned are kept distinct throughout the documentation, so a reader is never misled about which is which. The toolchain that grows outward from the language — a parser producing a spanned syntax tree, module resolution, a command-line runner, an agent-integrated REPL, and editor support — is described in [docs/toolchain.md](docs/toolchain.md).

## The library and the commands

The repository ships a library of reusable thought fragments and a set of pre-built commands assembled from them.

- `lib/prism/` — the PRISM library: the reusable building blocks of reasoning, from atomic thinking verbs up to whole reasoning engines, organized in layers of increasing cognitive complexity. Its structure is described in [lib/prism/README.md](lib/prism/README.md).
- `commands/` — pre-built commands assembled from the library, including `explore`, `ponder`, `reason`, `confer`, `consider`, `inquire`, and `learn`. Each one structures collaborative thinking a different way, and each is a worked example of the language.
- `runtime/` — the deterministic TypeScript runtime that executes `.in` programs.
- `docs/` — the documentation. Start at [docs/index.md](docs/index.md).

## Where to go next

Read [docs/index.md](docs/index.md) for a map of the documentation. Read [docs/language.md](docs/language.md) to learn the language. Read [runtime/README.md](runtime/README.md) to run what exists today. Read [docs/principles.md](docs/principles.md) for the reasoning the whole design rests on.
