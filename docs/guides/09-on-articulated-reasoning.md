# On Articulated Reasoning: The INDRA Style

There is a craft to working with Large Language Models. It is a departure from traditional programming, moving from a world of rigid instructions to one of guided performance. The INDRA protocol is designed for this craft.

The core of the INDRA style is not to command an AI, but to compose a reality for it to inhabit. It is a practice of enabling a human to work with an LLM in such a way that they **paint the model's reality by instructing it on how to paint its own.**

This guide explores the philosophy and the practical patterns behind this unique and effective approach.

---

## The Performer and the Stage

An INDRA file is not a script that runs; it is a specification that an LLM *embodies*. The human acts as a choreographer, designing a process of inquiry, while the LLM acts as a performer, bringing that process to life through accelerated inference.

The power of this approach lies in making the process of inference visible. Instead of a black box that delivers answers, the LLM becomes a glass prism, showing how the initial spark of a query is refracted into a full spectrum of thought. This transparency is key. Research into effective human collaboration consistently highlights the importance of psychological safety, open idea-sharing, and active listening. The INDRA style is a direct application of these principles to the human-machine interface.

## The Inner Voice and the Outer Instruction

The INDRA style achieves this transparency through a "dual-channel" voice that separates the *performance of thought* from the *instruction for inference*. This is the technical expression of "painting the model's reality by instructing it on how to paint its own."

### 1. The Template Channel (`<<|...|>>`): The Inner Voice

This channel is for the **performance of thought**. It uses a first-person, declarative voice to articulate an "inner monologue." This is where the human author composes the reality, the subjective experience, that the LLM will inhabit.

```indra
# The actor declares its internal state and intention.
# This is the reality the human paints for the model.
output: <<|
  I'm looking at this problem, and my first instinct is to check the assumptions. 
  Let me pause and do that now.
|>>
```

This is not a description of a future action. It is the performance of the action in the present moment. The tone is often curious, open, and inviting, which creates the psychological safety for a human collaborator to engage with the process.

### 2. The Direct Prompt Channel (`<...>`): The Outer Instruction

This channel is for the **instruction for inference**. It is a direct, second-person, imperative command *to the LLM itself*, instructing it on how to generate the next piece of the reality.

The magic happens when these two channels are combined through interpolation.

```indra
# The inner voice is combined with an outer instruction.
operator frame_situation_as(expertise) ::= <<|
  Hold on a sec. Let me reframe this as though I were $(expertise).
  What things do I see?
  $(<As $(expertise), take the current situation into account. Observe details that you would uniquely be able to identify. Answer: what are they?>)
|>>
```

In this operator:
1.  The text within the `<<|...|>>` paints the reality: the actor is pausing, adopting a new perspective, and asking a question. This is its performative "inner voice."
2.  The text within the `$(<...>`) is the direct instruction to the LLM, telling it *how* to generate the next part of that reality.

This is the essence of the INDRA style. The human composes fragments of reflective thought—the inner monologue—and seamlessly combines them with inferential action. The result is a process that feels natural, transparent, and deeply collaborative, turning the powerful but non-cognitive engine of an LLM into a true instrument for thought.
