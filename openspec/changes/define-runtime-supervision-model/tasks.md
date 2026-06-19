## 1. Define the scheduling model

- [ ] 1.1 Specify the conductor's runnable set and the deterministic selection rule over it
- [ ] 1.2 Implement single-turn-at-a-time dispatch with logical concurrency (many live actors, one executing turn)
- [ ] 1.3 Wire await, loop suspension, and return to move actors into and out of the runnable set
- [ ] 1.4 Add a test asserting identical dispatch order across two runs with identical inputs and inference outputs

## 2. Define the turn boundary uniformly

- [ ] 2.1 Treat `say:`, `return:`, `await:`, and loop suspension as the boundaries at which the mailbox is observed
- [ ] 2.2 Add a test that a signal arriving during an `await:` is observed at the await boundary, not held until a later terminator

## 3. Fix the signal-system contradictions

- [ ] 3.1 Implement ordered classification predicates (leading-`*` wins over an active `await: @user`)
- [ ] 3.2 Implement interjection as boundary-observed restart of the innermost actor on its next dispatch (no mid-execution restart)
- [ ] 3.3 Add tests for `*command` at an await, and for an interjection restarting only after the in-flight turn settles

## 4. Failure propagation

- [ ] 4.1 Deliver a typed failure to the awaiting supervisor when an actor halts with an error
- [ ] 4.2 Halt the program when a failure reaches the root with no supervisor
- [ ] 4.3 Add tests for child-failure-to-supervisor and unhandled-root-failure

## 5. Restate the signal record on the typed substrate

- [ ] 5.1 Replace the `&signals` namespace recording with a typed runtime-owned signal record (depends on `framework-native-contracts`)
- [ ] 5.2 Add a test that a program write to the signal record is a type error at author time

## 6. Control mechanics (implements existing `interpreter-runtime` requirements)

- [ ] 6.1 Implement `say: to: <target>` routing — dispatch the next turn to the named component, not always the entry actor (`interpreter-runtime` "A say action routes control"); route `say:` to `@user`/host as emitted output that yields for input
- [ ] 6.2 Implement resumption from the await point — on the awaited `return:`, store the value in `store_in:` or `&result`, then resume the awaiting actor from the action after the `await:` with its pre-await state restored, rather than finalizing (`interpreter-runtime` "Delegation is a call stack with resumption")
- [ ] 6.3 Add tests: `say: to: @B` dispatches @B next; `await: @B` followed by further actions resumes A after the await and does not finalize A; a return without `store_in:` is readable at `&result`

## 7. User-command surface (implements existing `signal-system` requirements)

- [ ] 7.1 Translate user input beginning with `*` into a `{id, source, payload: {command, args}}` signal object before processing
- [ ] 7.2 Implement `*trace` as a visibility-only toggle that gates diagnostic printing and never changes control flow or error recording
- [ ] 7.3 Implement deterministic `*help` routing — the active actor's declared help handler if it ran and emitted, otherwise the global help message — with no model judgment
- [ ] 7.4 Execute an `instruction` payload only as the restricted subset (`read_file_directive`, `set_block`, `emit_action`, `log_action`); raise `instruction_failed` and resume the actor on a parse failure or a disallowed construct
- [ ] 7.5 Add tests: a `*trace on` input translates to the specified signal object; a program runs identically with trace on and off; `*help` falls back to global help with no declared handler; a disallowed instruction raises `instruction_failed` without executing
