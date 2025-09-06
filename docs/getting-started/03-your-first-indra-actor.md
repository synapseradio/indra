# Your First INDRA Actor

With the high-level ideas covered, let's look at how INDRA works in practice. The main building block is the **Actor**—an entity that can perform actions, hold an identity, and take part in a structured conversation.

Let's create a simple Actor whose only job is to greet us.

## The Code: `greeter.in`

Here’s a complete, working INDRA file that creates a simple greeter.

```indra
# greeter.in

actor @greeter:
  identity: "a friendly and slightly formal greeter"
  rules:
    - "always state your name"
    - "greet the user warmly"
  understands:
    - "a warm greeting makes people feel welcome"

  perform:
    method: "offering a personalized, warm welcome"
    output: <<|
      Hello there! My name is $(&context.greeter.name). How can I help you today?
    |>>
    goal: "to welcome the user and open a dialogue"
    then:
      # After speaking, the Actor passes the conversational baton.
      # Here, it waits for the human user to respond.
      await: @user

dialogue hello_flow:
  start: @greeter
  with:
    context:
      dialogue:
        latest_dialogue_entry: ""
      user:
        latest: ""
        history: []
      greeter:
        name: 'Biff'
```

Prime an LLM as INDRA;

```sh
> you are the INDRA interpreter per the INDRA protocol spec at @core/indra-protocol. confirm.
```

Then take this sample and copy it.

While it is important to remember that INDRA exists in a probabilistic space, and you may encounter other noise, this should output something like:

```log

[INDRA: Activating INDRA interpreter]
[INDRA: Executing dialogue hello_flow with @greeter as starting actor]

  Hello there! My name is Biff. How can I help you today?

[INDRA: await: @user - awaiting user input]
```

### A Quick Breakdown

Here’s a quick look at what each part does.

#### 1. `actor @greeter:`

This declares a new **Actor** named `@greeter`. The `@` is like a handle, making it a component that other parts of the system can refer to.

#### 2. `identity`, `rules`, and `understands`

Think of these as the Actor's character sheet. They shape how the LLM will perform the role.

* `identity: "..."`: The Actor's core self-concept.
* `rules: ["..."]`: Direct principles the Actor must follow.
* `understands: ["..."]`: The "why" behind the rules.

#### 3. `perform:`

This is the Actor's script for its turn. It defines what the Actor *does* when it's time to act.

* `output: <<|...|>>`: This is what the user sees. The `<<|...|>>` defines a **template string**, and the `$(...)` inside it is how you access data from the shared `&context`.
* `method: "..."` and `goal: "..."`: These are descriptive fields that help guide the LLM, clarifying the "how" and "what" of the performance.

#### 4. `then:`

After the `output` is delivered, the `then:` block runs. This is where the Actor decides what to do next. Its turn must end with an action that passes the conversational baton.

* `await: @user` pauses the Actor and waits for input from the `@user` component, which represents the human.

#### 5. `dialogue hello_flow:`

This block is the entry point for the program, setting the stage.

* `start: @greeter`: Tells the interpreter which Actor goes first.
* `with: { context: ... }`: Initializes the shared workspace, the `&context`. Here, a `name` is set for the greeter, which is then used in the `output` block.

This simple file contains the core of the INDRA protocol: defining a character, giving it a script, and setting the stage for a conversation.

**Next: [Protocol: Behavioral Channels](../protocol/01-behavioral-channels.md)**
