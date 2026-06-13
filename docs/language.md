# The INDRA language

INDRA is a language for choreographing reasoning. You write down the shape of a thinking process — who speaks, in what voice, what they ask, what they decide — and a deterministic runtime carries out that choreography while a language model supplies judgment at the points you mark for it. The structure is yours and runs the same way every time. The judgment is the model's, and it happens only inside bounded inference points you place by hand.

This document describes the language surface: the constructs you write in a `.in` file and what they mean. For how the runtime executes them, see the [architecture](./architecture.md). For where the toolchain is headed, see the [toolchain](./toolchain.md). For the philosophy underneath the design, see [principles.md](./principles.md).

Every construct shown here is drawn from a real file under `legacy/commands/` or `legacy/lib/prism/`. Where a construct is defined in the language but not yet carried out by the runtime, the text says so plainly.

## Actors

An actor is the unit that takes a turn. It has an identity, the rules it holds itself to, what it understands about its situation, and a `perform:` block that says what it does when it is its turn to act. Here is the entry actor for the `explore` command, which welcomes a user and then hands the real work to a reasoning module:

```indra
actor @explore:
  identity: `I explore ideas by branching them into possibilities and following the most promising threads`
  rules:
    - `I welcome users by immediately inviting them to explore a topic`
    - `I delegate all exploration to the specialized tree_of_thought module`
    - `I make the exploration process accessible and engaging`
  understands:
    - `users want to explore ideas naturally and thoroughly`
    - `Tree of Thought provides a powerful way to explore possibilities`
    - `the journey of exploration is as valuable as the destination`
  perform:
    method: `facilitating natural thought exploration`
    output: "*Explore Command initializing...*"
    goal: `to provide an accessible interface to Tree of Thought reasoning`
    then:
      ...
```

The `identity`, `rules`, and `understands` fields are not executed line by line. They are the actor's standing self-description, and they become the system-role framing the model reads whenever this actor runs an inference. The `perform:` block is where a turn actually happens. It names the `method:` the actor is using and the `goal:` it is pursuing, and then a `then:` block holds the branching logic that decides what the turn does.

An actor identified with the `@` sigil is addressable. Other actors hand it work by name, and the runtime keeps a registry of every actor in the running program.

## Personas

A persona is a voice an actor can put on. It carries an `identity`, `rules`, and `understands` in the same shape an actor does, but it has no `perform:` block, so it never drives a turn of its own. It is data, not a participant. Here is a complete persona from the PRISM library:

```indra
persona @tree_thinker:
  identity: `I explore ideas thoughtfully and think naturally through problems by branching them into possibilities`
  rules:
    - `embrace uncertainty and backtracking as natural parts of the thinking process`
    - `make the journey of exploration visible and easy to follow`
  understands:
    - `thinking is a process of exploration, not a direct path to an answer`
    - `the path of reasoning is often as valuable as the final conclusion`
```

An actor adopts a persona for the next stretch of work with `as:`. Adopting a persona selects which voice the inference points read from; no separate participant comes to life. In the tree-of-thought module, a single sequence switches voices step by step, speaking first as the explorer and later as the evaluator:

```indra
  step:
    as: @curious_explorer
    method: `initial wondering`
    output: <<|
      My first thought on this is...
      ${wonder_about(topic: question)}
    |>>
```

This is how an INDRA program reads as a structured monologue rather than a single flat prompt. The same actor moves between lenses, and each lens shapes the framing the model sees at the inference points that run while it is held.

## The inference channel

The `<...>` channel is where the model's judgment enters a program. Everywhere else in a `.in` file is deterministic. Inside the angle brackets you write, in plain language, the one bounded judgment you want the model to make, and the result is a typed value the rest of the program can route on.

A `<...>` appears spliced into a prose template through `${...}`, so the model's judgment lands exactly where it belongs in the sentence the actor is composing:

```indra
    set:
      &context.tree.mode: ${<deepen or broaden>}
```

Here the model is asked to choose between two named directions, and its choice is written into context as the value at `&context.tree.mode`. A later branch reads that value and routes on it. The model never names the branch; it writes a value, and a deterministic guard decides what the value means for control flow.

The judgments can be richer than a two-way choice. The same module asks the model for a list and for a free-form synthesis:

```indra
    set:
      &context.tree.open_questions: ${<list of specific questions needing evidence>}
```

```indra
      To directly address your original question, "${&context.tree.original_question}":
      ${<
        Based on everything explored, provide a clear, final answer
        that acknowledges uncertainty where appropriate.
      >}
```

Each inference point is bounded by design. It produces one typed value and does not itself splice or chain other inferences; combining results is the job of the surrounding language, not of a single call. Because the work at each point is small, the program does not lean on a powerful model — the sophistication lives in how the points are assembled, and weak models suffice. The principle behind this, and the boundary it draws, is [principle 7](./principles.md).

Not every `<...>` is a model call. Some are pure computation written in the inference channel's shorthand. The base library defines utility operators this way:

```indra
# Count items in a collection
operator count(collection) ::= <<|
  ${<count the items in ${collection}>}
|>>

# Get first item from collection
operator get_first(collection) ::= <<|
  ${<Get first item from ${collection>}}
|>>
```

Counting a list and getting its first item require no judgment. The runtime carries these out as ordinary functions rather than sending them to a model, because asking a model to count would trade determinism for nothing. The line between a genuine inference and a pure function is drawn in [principle 3 and corollary C1](./principles.md), and the runtime's handling of it is described in the [architecture](./architecture.md).

## The shared world: `&context`

`&context` is the shared world the actors coordinate through. It is a blackboard: a workspace every actor can read and write, addressed by path. An actor writes a value at a path with `set:`, and any actor that runs later can read it:

```indra
    set:
      &context.tree.original_question: question
      &context.tree.exploration_style: exploration_style
      &context.tree.thoughts_so_far: []
      &context.tree.current_depth: 0
```

Reading a path is just naming it. Guards read context to decide what a turn does, and prose templates splice context values into what the actor says:

```indra
      when: &context.tree.mode is `broaden`
        ...
```

```indra
      I'm going to think through "${question}" using a style of exploration that feels ${exploration_style}.
```

`&context` is shared coordination state, not shared prompt attention. The whole of the blackboard is never poured into a model's prompt. An inference point receives only the scoped values it is given, so actors coordinate through the workspace without flooding each other's context windows. This distinction is load-bearing, and [principle 5](./principles.md) explains why.

Alongside `&context` the language has a small set of other namespaces with reserved meaning. `&user` carries what the human contributed and is readable but not writable by a program. `&args` carries the arguments to a command interface. `&signals` is written only by the runtime, to record signals as they arrive. A program writes `&context`, reads the reserved namespaces, and never forges what belongs to the runtime. These namespaces and the rules that protect them are detailed in the [architecture](./architecture.md).

One namespace seen in the examples, `&dialogue`, holds the running conversation and is read in the `explore` welcome guard above. It is a working part of the runtime today, and whether it stays a distinct namespace is an open question the [toolchain](./toolchain.md) carries; the language guide notes it where the examples use it rather than leaning on it as settled.

## Control transfer: `say:`, `await:`, `return:`

A turn ends by transferring control, and the language gives three ways to do it.

`say:` speaks to a target and yields. The actor produces output for someone and hands the turn on. In the `explore` actor, the opening branch greets the user and yields so the user can reply:

```indra
      when: &dialogue.latest_dialogue_entry is ''
        say:
          to: @user
          what: <<|
            ## Tree of Thought Explorer

            I can help you think through ideas by exploring multiple angles, following promising threads, and making natural connections.

            What would you like to explore together?
          |>>
```

`await:` delegates to another actor and waits for its result. The caller pauses, the named actor runs, and its return value comes back to the caller. The `explore` actor delegates the whole exploration to a reasoning module, passing it a scoped set of inputs and naming where the result should land:

```indra
        await: @tree_thinker
        with: {
          dialogue: {
            latest_dialogue_entry: &context.query
          },
          tree: {
            caller: @explore,
            exploration_style: &context.explore.exploration_style,
            max_depth: 4
          }
        }
        store_in: &context.tree_result
```

`return:` ends the turn by producing a value to whoever was waiting. A sequence finishes by returning the result it assembled:

```indra
  step:
    return: &context.tree.final_result
```

The runtime carries out the parts of this contract that the walking skeleton covers today, and the rest is defined in the language ahead of being built. Emitting output and yielding, delegating with `await:`, storing a delegated result, and returning a value all run today. Two refinements of control transfer are written in the language but not yet carried out by the runtime: `say:`'s `to:` target does not yet route control to a named recipient, and an actor that delegates with `await:` does not yet resume from the await point — it finalizes once the result is stored. These gaps are recorded in the design's seam log and tracked in the [toolchain](./toolchain.md); the language defines the intended behavior, and the runtime grows into it.

## The human as a first-class actor

`@user` is an actor, written and addressed exactly like any other. A program does not treat the human as an external event source that interrupts an otherwise self-contained machine. The human takes turns in the same loop as every other actor.

This shows up in two directions. An actor speaks to the human by naming `@user` as the target of a `say:`, as the `explore` greeting does above. An actor waits for the human the same way it waits for any other actor, by awaiting it, and then reads what the human contributed from `&user`:

```indra
              await: @user
              set:
                &context.ponder.topic: &user.latest
```

When an actor awaits `@user`, the turn passes to the human, and the human's contribution becomes readable at `&user.latest`. The actor reads it and writes it into the shared world, here storing the human's topic at `&context.ponder.topic`. Because `@user` is an ordinary actor in the registry, the same delegation machinery that lets one reasoning module call another lets a module ask the human a question and weave the answer back into the work. The human and the model are two kinds of participant in one choreography, and the language does not privilege either over the structure that coordinates them.

## How the pieces compose

A command file pulls reusable fragments from the PRISM library, defines an entry actor, and starts a dialogue. The `explore` command imports the tree-of-thought module and a handful of thinking primitives, then names its entry actor and the world it starts with:

```indra
>>read_file: '../lib/prism/modules/tree_of_thought.in' use @tree_thinker,
                                                     tree_of_thought<<

actor @explore:
  ...

dialogue explore_flow:
  start: @explore
  with: {
    context: {
      ...
    }
  }
```

An import inlines a file and, with a `use` clause, binds only the named symbols from it. The `dialogue` block names the actor that takes the first turn and the initial contents of the shared world. From there the choreography runs: actors take turns, write to `&context`, consult the model at the inference points, and transfer control until the dialogue settles.

The library these commands draw from is organized as layers of increasing cognitive complexity, from atomic thinking verbs up to whole reasoning engines. Its structure is described in [legacy/lib/prism/README.md](../legacy/lib/prism/README.md), and the commands that assemble it are the worked examples to read next.
