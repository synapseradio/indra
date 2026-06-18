## 1. The load-time gate

- [ ] 1.1 Implement the single ordered pre-spawn pass, each check a stop condition, halting without spawning on the first violation
- [ ] 1.2 Make the pass extensible so a dependent capability can add checks within the same pass
- [ ] 1.3 Add a test that a valid program proceeds to spawning and an invalid one halts before turn one

## 2. Structural and totality checks

- [ ] 2.1 Validate the turn-logic structure is well-formed
- [ ] 2.2 Implement structural branch totality (guardless `otherwise:` last, no guardless branch before the end), naming the actor and block
- [ ] 2.3 Add totality tests for the missing-otherwise, well-formed, and guardless-before-end cases

## 3. Reference and initial-state checks

- [ ] 3.1 Resolve every `await:` target, the entry reference, and `become:` targets against the program; reject dangling references
- [ ] 3.2 Include the `framework-native-contracts` initial-state completeness check as a gate step
- [ ] 3.3 Add tests for a dangling await target and an uninitialized read

## 4. Typed rejections

- [ ] 4.1 Make every rejection a tagged error naming the check and the offending location
- [ ] 4.2 Add a test that a rejection reaches the halted state as a tagged error
