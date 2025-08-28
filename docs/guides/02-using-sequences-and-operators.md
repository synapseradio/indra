# Guide: Reusability with Sequences & Operators

As your INDRA programs grow, you'll find yourself repeating patterns of actions or transformations. INDRA provides two powerful constructs for creating reusable logic: **Operators** and **Sequences**. Understanding when to use each is key to writing clean, maintainable `.in` files.

---

### Operators: Reusable Transformations

An **operator** is a reusable, parameterized **transformation**. Its primary purpose is to take some input, process it, and return a new value. Operators are best for logic that creates, expresses, or modifies simple ideas or high level, natural language operations.

They are defined using the `::=` syntax.

#### Example: An Operator to Format a Title

Imagine you frequently need to create a formatted title string. Instead of writing the template repeatedly, you can define an operator.

```indra
# --- Operator Definition ---
format_title(text, level) ::= <<|
  $(level == 1 ? '#' : '##') $(text)
  ---
|>>

# --- Invocation ---
actor @documenter:
  perform:
    output: <<|
      $(format_title(text: 'Main Section', level: 1))
      Here is the main content.

      $(format_title(text: 'Subsection', level: 2))
      Here is the subsection content.
    |>>
    then:
      await: @user
```

* **Definition:** `format_title(text, level) ::= ...` defines an operator that takes two parameters, `text` and `level`.
* **Invocation:** `$(format_title(text: '...', level: ...))` calls the operator. The call is wrapped in an interpolation `$(...)` because we want to insert the *result* of the operator into our output string.
* **Key Idea:** Operators are like functions that return values. They are perfect for encapsulating logic related to data manipulation, formatting, and generation.

---

### Sequences: Reusable Action Blocks

A **sequence** is a reusable, parameterized block of **actions**. Its primary purpose is to execute a series of steps, such as `set`, `await`, or `output`. Sequences are best for logic that involves performing a multi-step process.

They are defined using the `sequence ... ::= ...` syntax.

#### Example: A Sequence to Greet and Update a Counter

Let's encapsulate the common pattern of greeting a user and incrementing a turn counter into a sequence.

```indra
# --- Sequence Definition ---
sequence greet_and_update(actor_name) ::=
  step:
    output: <<|
      Hello from $(actor_name)! This is turn $(&context.turn_count).
    |>>
  step:
    set: &context.turn_count: &context.turn_count + 1

# --- Invocation ---
actor @greeter_a:
  perform:
    then:
      # Invoke the sequence of actions
      sequence: greet_and_update(actor_name: 'Greeter A')
      
      say:
        to: @greeter_b
        what: 'continue'
```

* **Definition:** `sequence greet_and_update(...) ::= ...` defines a sequence of actions.
* **`step:`**: Each `step` block within the sequence is executed in order.
* **State Scope:** A crucial feature of sequences is that `set:` operations are visible to subsequent steps *within the same sequence execution*. This allows you to chain actions that depend on each other.
* **Invocation:** `sequence: greet_and_update(...)` executes the defined steps. Notice it's not wrapped in `$(...)`, because it doesn't return a value; it *performs actions*.

---

### When to Use Which?

* Use an **Operator** when you need to create, format, or transform a piece of data that you will then use (e.g., assign it to a variable or include it in an output). Think of them as **value-producers**.
* Use a **Sequence** when you need to perform a series of actions that change the state of the application or produce multiple outputs. Think of them as **action-performers**.

By effectively using operators and sequences, you can build complex INDRA applications from simple, reusable, and understandable parts.

**Previous: [Guide: Writing Reasoning Tools](./01-writing-reasoning-tools.md)**
