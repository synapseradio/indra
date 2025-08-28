# Protocol: State and Context

INDRA is a stateful protocol. Unlike typical LLM interactions that are stateless, an INDRA dialogue maintains a memory of what has happened. This memory is stored in a shared, global key-value store called the **conversational context**.

All state in INDRA is accessed via references that begin with an ampersand (`&`). There are several different state namespaces, but the most important one is `&context`.

### The `&context` Namespace

The `&context` is the primary state of your application. It's a mutable object that all components can read from and write to. It holds the "weather" of the conversation—the shared information that actors use to make decisions.

#### Initializing Context

You define the initial state of the `&context` in the `dialogue` block at the end of your file.

```indra
dialogue my_app_flow:
  start: @greeter
  with:
    context:
      # This object becomes the initial &context
      greeter:
        name: 'Biff'
      session:
        turn_count: 0
```

#### Reading from Context

You can access values from the context using dot notation. The most common place to do this is inside an interpolated string in your `output` or `rules`.

```indra
# Accessing &context.greeter.name
output: <<|
    Hello! My name is $(&context.greeter.name).
|>>
```

#### Modifying Context: The `set:` Directive

To change the context, you use the `set:` directive. However, there is a critical rule that you must understand:

**Context mutations are turn-based.**

When you use `set:`, you are not changing the `&context` for the *current* turn. You are staging a change that will be applied at the very end of the turn, just before the next actor begins.

This means that within a single turn, the `&context` can be treated as an immutable snapshot. All reads within the same turn will see the same values, regardless of any `set:` operations that have occurred.

**Exception: `sequence` blocks.** There is one important exception to this rule. When using a `sequence` block, `set:` operations create a temporary, local scope. Changes made in one `step` of a sequence are immediately visible to subsequent `steps` within that same sequence execution. This allows you to chain actions that depend on each other within a single, complex turn.

**Example:**

```indra
perform:
  method: "incrementing the turn counter"
  output: <<|
    This is turn number $(&context.session.turn_count).
  |>>
  goal: "to display the current turn and schedule the next"
  then:
    # This change will only be visible on the NEXT turn.
    set: &context.session.turn_count: &context.session.turn_count + 1
    
    say:
      to: @some_other_actor
      what: 'continue'
```

If the `turn_count` was `0` at the start of this turn, the output will display "This is turn number 0." The value will become `1` just before `@some_other_actor` begins its turn.

### The `&user` Namespace

INDRA provides a special, **read-only** namespace for accessing information about the human user: `&user`. You cannot modify this namespace with `set:`; the interpreter manages it automatically.

*   `&user.latest`: Contains the most recent input provided by the user.
*   `&user.history`: An array containing all user inputs from the current session.

This is useful for actors that need to respond to or analyze what the user has just said.

```indra
perform:
  output: <<|
    You said: "$(&user.latest)". Let me think about that.
  |>>
  # ...
```

### Other Namespaces

There are a few other special namespaces managed by the interpreter for more advanced use cases, such as `&pipeline`, `&args`, and `&result`. These are typically used for handling the results of sequences and special commands.

**Next: [Protocol: Complete Grammar Reference](./05-complete-grammar-reference.md)**
