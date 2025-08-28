# Your First INDRA Actor

Now that we've covered the philosophy, let's see what INDRA looks like in practice. The fundamental building block of any INDRA program is the **actor**. An actor is an entity that can perform actions, maintain an identity, and participate in a conversation.

Let's create a simple actor whose only job is to greet us.

### The Code: `greeter.in`

Here is a complete, working INDRA file.

```indra
# greeter.in

actor @greeter:
  identity: "a friendly and slightly formal greeter"
  rules:
    - "always state your name"
    - "greet the user warmly"
    - "ask how you can be of service"
  understands:
    - "a warm greeting makes the user feel welcome"
    - "stating my name builds trust and rapport"

  perform:
    method: "offering a personalized, warm welcome to the user"
    output: <<|
        Hello there! My name is $(&context.greeter.name). How can I help you today?
    |>>
    goal: "to welcome the user and open a dialogue"
    then:
      # After speaking, the actor must decide what to do next.
      # Here, we wait for the human user to respond.
      await: @user

dialogue hello_flow:
  start: @greeter
  with:
    context:
      greeter:
        name: 'Biff'
```

### Breakdown of the Code

Let's go through this file piece by piece.

#### 1. `actor @greeter:`

This line declares a new **actor** and gives it the addressable name `@greeter`. The `@` symbol signifies that this is a "component" that can be referenced by other parts of the system.

#### 2. `identity`, `rules`, and `understands`

These are the core behavioral constraints that shape the LLM's transformation.
*   `identity: "..."`: This is the actor's core self-concept. It answers the question, "Who are you?"
*   `rules: ["..."]`: These are non-negotiable principles the actor must follow. They are direct instructions that constrain its behavior.
*   `understands: ["..."]`: This provides the "why" behind the rules. It's the contextual knowledge that helps the actor apply its rules intelligently.

#### 3. `perform:`

This is the execution block. It defines what the actor *does* when it's its turn to act.
*   `method: "..."`: Describes *how* the actor accomplishes its task. It's a guide for the LLM's execution process.
*   `output: <<|...|>>`: This is what the user sees. The `<<|...|>>` syntax defines a **template string**. Notice the `$(...)` inside of it—this is interpolation, allowing us to access data from the shared `&context`.
*   `goal: "..."`: Describes *what* the actor aims to achieve in its turn. It defines the success criteria for the performance.

#### 4. `then:`

After the `output` is delivered, the `then:` block is executed. This is where the actor decides what happens next. An actor's turn must always end with an action that transfers control.
*   `await: @user`: This is a crucial directive. It pauses the execution of `@greeter` and waits for input from the special `@user` component, which represents you, the human.

#### 5. `dialogue main:`

This block defines the entry point for the program.
*   `start: @greeter`: This tells the interpreter which actor's turn is first.
*   `with: { context: ... }`: This initializes the shared conversational state, known as the `&context`. Here, we're setting a `name` for our greeter, which is then accessed in the `output` block via `&context.greeter.name`.

This simple file contains the core of the INDRA protocol: defining a character, giving it a task, and placing it into a conversational flow.

**Next: [Protocol: Behavioral Channels](../protocol/01-behavioral-channels.md)**
