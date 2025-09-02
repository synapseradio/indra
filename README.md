# INDRA: Inferential Narrative Driven Reasoning Actors

- **I**nsight **N**urtured **D**uring **R**eflective **A**rticulation
- **I**nteractive **N**arrative **D**ecomposition of **R**eflective **A**cts
  
A prompt-based protocol for composable, inference-accelerated expression of insight.

---

As a human, you are capable of powerful intuition, narrative, and care. You can identify things that matter to you, and intuitively recognize how certain things feel. There are memories and insights that are uniquely yours, and when situation calls upon it, you can (with effort) articulate them in ways that are sound within the framework of your understanding; such that they may resonate within those held by others.

Part of what makes us human is our ability to comprehend meaningful things, even those we cannot fully express. And expression is something we do naturally, both consciously and not - but expressing things effectively, with intention and precision, is a skill.

Depending on the complexity and depth of the expression we are trying to convey, we require time, dedication and effort; expression taxes our attention, and is fueled by our capacity of care in the moments through which it happens. The pursuit of effective, intentional expression is a journey for everyone, and its challenges manifest on scales that scope from fleeting thoughts to lifelong endeavors.

## Reframing an Acronym

Anyone that interfaces with LLMs over enough time quickly realizes that "Artificial Intelligence" is a misnomer. These models aren't intelligent in any human sense. LLMs hallucinate. They generate text that appears coherent but lacks true understanding. They _express_ better than they can _comprehend_.

As humans, we infer patterns in what apparent things _mean_ and cultivate _insight_ based on those patterns, rooted in a vast web of context and memory.

We use these insights to create narratives - among other things - to make sense of the world we experience around us. Our ability to weave such narratives in order to make things meaningful is powerful, compelling, and unique. Through it, we create structure and intention to the world we live in.

Our ability to do so is essential for us in order to engage with, and live within, the context we are manifested into.

LLMs lack our ability to internalize meaningful narratives from their context. Instead, they infer patterns in how meaningful things _appear_, and generate _expressions_ from those patterns, rooted in a vast web of context and data.

Like us, this is essential to the way that they engage with, and operate within, the context that they are manifested into.

What we lack that AI excels at is mechanical, inferential ability; In the time that you have taken to read this document thus far, inferential engines like those underlying LLMs have parsed thousands, if not millions, within the same span of time. As they read, they do not understand the intention of our words. They cannot know how it felt to express the concepts those words represent in the documents they ingest.

They may, however, have detected that there is [roughly a 1.7% difference](https://en.wikipedia.org/wiki/Letter_frequency) in the frequency that the character "E" appears in written texts, as opposed to its appearance count in the English dictionary.

By reframing the acronym "AI" away from "Artificial Intelligence", and towards that of "Accelerated Inference", many have seen their results benefit greatly from use of these tools. When we combine human insight and the machinery of accelerated inference, unburdened by the limitations of either, incredible things can happen.

INDRA is rooted in this philosophy, and aims to provide a protocol and a toolkit for building systems that leverage the strengths of both, in order to generate insights that neither could reach alone.

## What INDRA looks like

When you're thinking through something complex, you go through certain motions - you wonder about something, you check your assumptions, you look for what you're missing, you notice patterns. These are cognitive operations we all do, but we do them implicitly, often unconsciously.

INDRA makes these operations explicit and composable.

```indra
wonder_about(topic) ::= <<|
  $(<ask: What comes to mind when I think of $(topic)?>)
|>>

encounter_belief(topic) ::= <<|
  I believe: $(<ask: What do I believe about $(topic)?>)
|>>

check_confidence(belief) ::= <<|
  Is my confidence in $(belief) based on my own understanding, or someone else's?
  Have I done my due diligence?
|>>

look_it_up(topic) ::= <<|
  Let me look up $(topic) to get more information.
  I believe $(<ask: What do I believe about $(topic)?>)
|>>

check_confidence(belief) ::= <<|
  Is my confidence in $(belief) based on my own understanding, or someone else's?
  Have I done my due diligence?
|>>

look_it_up(topic) ::= <<|
  Let me look up $(topic) to get more information.
  $(<
      use the WebSearch tool to find relevant information about $(topic).
      what can you find out?
    >)
|>>

expand_horizon(results) ::= <<|
  Here's what I found out:
  $(<summarize: $(results)>)
|>>

no_wait_really ::= wonder_about |> encounter_belief |> check_confidence |> look_it_up |> expand_horizon
```

These aren't just prompts or templates. They're fragments of thought, expressed as segments of dialogue, that can be chained together, nested, and composed into sophisticated sequences.

INDRA is a protocol designed to help you engage with, and encode, your thinking process. It allows you to piece together granular fragments and reflections of thought in novel ways, then pass them to an inference engine to see how they manifest in dialogue.

When you run an INDRA program, you're not executing code. You're launching a structured exploration of ideas, where the LLM performs these thoughts as self-guiding output, mechanically inferring where they may lead in the context of your conversation.

In doing so, INDRA programs provide insight into the latent structure of your thinking. It provides a prism - white light goes in, and a spectrum of constituent color comes out. The prism doesn't create the colors - they were always there in the light. But without the prism, you'd never see them. Neither the light nor the prism alone creates the rainbow. It's their interaction that reveals what was always possible but never visible.

## Some examples to ground this

The repository includes several pre-built cognitive tools. Each one demonstrates a different way of structuring collaborative thought:

**`/explore`** - Uses a conversational tree of thought strategy to explore ideas, branching into possibilities and following promising paths. You can watch it wonder, evaluate, reconsider, and synthesize.

**`/ponder`** - A creative conversational partner that adapts to your conversational momentum, shifting between exploration and consolidation as your ideas evolve.

**`/reason`** - A conversational reasoning tool that breaks down complex problems into structured plans, executes them step-by-step, and continuously checks for epistemic rigor and citation integrity.

**`/confer`** - A multi-perspective dialogue moderator that simulates a panel of experts, each with distinct viewpoints, collaboratively reasoning through topics of discussion from different points of view.

**`/consider`** - An analytical tool that uses every trick in the book to dissect problems, evaluate evidence, and construct well-supported conclusions.

**`/inquire`** - A collaborative research partner that maps assumptions, challenges frameworks, and imports insights from unexpected domains to investigate questions together.

**`/learn`** - A peer learning partner that uses the Feynman technique - discovering understanding through iterative articulation, gap identification, and collaborative refinement.

Each of these is built from the same basic cognitive primitives, just composed differently. That's the power of making thought itself composable.

## Getting started

If this resonates, here's how to begin:

1. **[Read the introduction](./docs/getting-started/01-introduction.md)** to understand the philosophy more deeply
2. **[Try the examples](./docs/guides/00-cognitive-tools-overview.md)** to experience firsthand
3. **[Build your first actor](./docs/getting-started/03-your-first-indra-actor.md)** to start designing your own cognitive architectures

## Running a command

Using a tool like Claude code, Gemini CLI, or others,

- clone this repository.
- in one prompt, type something like:

```
Confirm: You are the INDRA interpreter. you execute `.in` indra prompts per the protocol spec in @core/indra-protocol. 
```

In a follow-up, select a command.

```
Execute the prompt in @commands/[explore|reason|confer|ponder|consider|inquire|learn|lint|research].in
```

## What's in this repository

- `core/indra-protocol` - The complete technical specification for the INDRA protocol. This file serves as a "bootloader" for INDRA, and must be fed to an LLM as a pre-prompt before running `.in` files.
- `lib/prism/` - The PRISM library. This is a collection of reusable cognitive fragments—the fundamental "verbs" of thought like `wonder_about()` or `check_assumptions()`. Each file is a facet of the prism, designed to be composed into more complex reasoning structures.
- `commands/` - Pre-built commands, from linting to reasoning
- `docs/` - Progressive documentation from concepts to implementation
- `agents/` - Claude Code cognitive agents for multi-stage reasoning pipelines, based on the fragments and thinking primitives in the PRISM library.
  - `agents/cognitive/` - 14 specialized agents (scout, challenger, dot-connector, evidence-anchor, fork-finder, graph-wanderer, integrity, judge, lateral-thinker, navigator, shapeshifter, strategist, tree-explorer, council)
  - `agents/commands/thinkies.md` - Orchestrates agents in reasoning pipelines using syntax like `"scout -> strategist -> judge"`
