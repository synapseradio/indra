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
