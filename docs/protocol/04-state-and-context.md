# Protocol: State and Context — The Shared World

Every meaningful partnership is built on a shared understanding of the world. You and your partner remember past conversations, agree on certain facts, and are aware of each other's presence. In INDRA, this shared world is called the **conversational context**.

The context is not just a memory or a set of variables; it's the cognitive environment where the partnership lives. It's the "room" where the conversation happens. All state in INDRA is accessed with an ampersand (`&`), signaling a connection to this shared world.

---

## `&context`: Shared Understanding in the Context Window

The `&context` namespace is the heart of the shared world. It's the whiteboard where you and your INDRA actors can post information, track the evolution of ideas, and maintain a collective understanding.

You establish the initial state of this world in the `dialogue` block:

```indra
dialogue our_journey:
  start: @guide
  with:
    context:
      # This is the world our journey begins in.
      dialogue:
        latest_dialogue_entry: ""
      user:
        latest: ""
        history: []
      map:
        location: 'the starting village'
      quest:
        status: 'not yet accepted'
```

From this point on, any actor can reference this shared understanding.

```indra
actor @guide:
  perform:
    output: <<|
      Welcome to ~(&context.map.location). I see your quest is ~(&context.quest.status)~.
    |>>
    ...
```

### How Understanding Evolves: The Rhythm of Turns

In a good conversation, you don't react to something in the same instant it's said. You listen, process, and then respond. The `&context` respects this rhythm.

When an actor uses the `set:` directive, it's not changing the world in that instant. It's proposing a change that everyone else will see in the *next* moment (or turn).

```indra
perform:
  # The guide speaks based on the current state of the world.
  output: "The quest status is currently: ~(&context.quest.status)~." # -> "not yet accepted"
  then:
    # The guide proposes a change to the shared understanding.
    # This change becomes "real" only after this turn is complete.
    set: &context.quest.status: 'in progress'
    
    say:
      to: @chronicler
      what: 'the journey begins'
```

When the `@chronicler` takes its turn, it will see the world with the updated status of `'in progress'`. This turn-based approach creates a deliberate, predictable flow, preventing the chaotic feedback loops that can happen when state changes instantly.

The one exception is the `sequence` block. Within a sequence, changes *are* immediate, allowing for a chain of rapid, internal thoughts before presenting a final conclusion.

### `&user`: The Human in the Room

A partnership requires awareness of all participants. The special `&user` namespace ensures the human partner is always present and heard in the shared world.

This namespace is **read-only** for the actors; they cannot change what the user thinks or says. It is managed by the INDRA interpreter itself.

* `&user.latest`: A direct connection to the user's most recent thought or input.
* `&user.history`: The collective memory of everything the user has contributed to the conversation.

This allows actors to be truly responsive partners:

```indra
actor @listener:
  perform:
    output: <<|
      I hear you. You said, "~(&user.latest)~". Let me reflect on that.
    |>>
    ...
```

By providing these distinct namespaces, INDRA creates a cognitive environment with clear roles and a reliable flow of understanding, allowing for a partnership that is both creative and coherent.

---
**Next: [Protocol: Complete Grammar Reference](./05-complete-grammar-reference.md)**
