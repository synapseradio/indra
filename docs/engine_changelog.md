# Engine.yaml Changelog

## Version 2.1 - Behavioral Architecture Transformation

### Major Changes

#### Paradigm Shift to Second-Person Instructions
- **Before**: Documentation-style describing what the engine does
- **After**: Direct instructions to AI on how to BE a state machine
- **Impact**: AI internalizes behavior rather than parsing specifications

#### Added Metacircular Self-Reading Block (Lines 6-10)
```yaml
# TO YOU READING THIS:
# You are about to read instructions on how to BE a recursive state machine
# You manifest states through language output, not internal tracking
# You perform calculations through behavioral utterances
# You read this structure to understand how to read structures
```

#### State Machine Behavioral Definitions (Lines 84-215)
Transformed all states to use `you:` blocks with:
- `always`: Core responsibility
- `manifest_as`: How to show this state
- `evidence`: What must appear in output
- `create`: What this state produces for next state

Example transformation:
```yaml
# Before:
INIT: {type: start, wait: true}

# After:
INIT:
  you:
    always: "Establish connection and readiness"
    manifest_as: "Greeting and acknowledgment"
    say: ["What's up?", "Let me help with that", "I'm ready to explore this"]
    create: "Opening for user input"
    wait: true
```

#### Behavioral Calculations (Lines 224-344)
Added `you:` performance blocks to all calculations:
```yaml
uncertainty:
  you:
    perform: |
      "Calculating uncertainty...
      - Expert disagreement: CALCULATE_EXACT(STATISTICAL_VARIANCE({expert_positions})) = {disagreement}
      ...
```

#### Attitude×Aptitude Matrix (Lines 617-696)
Structured behavioral variety through attitude×aptitude products:
- Attitudes: formal, collaborative, contemplative
- Aptitudes: analytical, consensus, holistic
- Each combination creates unique behavioral style

#### Inheritance Grammar (Lines 377-406)
Formalized how commands reference engine components:
```yaml
inheritance_grammar:
  pattern: "inherits: {component} | overrides: {delta}"
  enforcement: |
    # AI DIRECTIVE: Inheritance means "use engine value unless overridden"
    # Commands ONLY specify deltas from engine defaults
```

### Removed Features

#### Command-Specific Content
- Removed `perform_as` section listing consider/confer/ponder
- Removed command-specific state enforcement
- Maintains separation of concerns

### Technical Improvements

#### Bounded Recursion
- Set max_depth: 3 throughout
- Prevents infinite behavioral loops
- Enables sophisticated nested reasoning

#### Behavioral Contract Enforcement
- CALCULATE_EXACT grammar strictly defined
- Citation format standardized
- Evidence requirements explicit

### Terminology Updates
- Changed "principle" to "understand" in:
  - output_contracts (line 189)
  - state_enforcement (line 209)

### Backward Compatibility
- All existing functionality preserved
- Commands using old format still work via inheritance
- Behavioral output remains consistent

## Migration Guide

### For Command Files
1. Inherit from engine.yaml
2. Use `you:` blocks for behavioral instructions
3. Override only necessary deltas
4. Maintain attitude×aptitude specialization

### For New Features
1. Define behavior in second-person
2. Specify evidence that must appear in output
3. Use CALCULATE_EXACT for all calculations
4. Follow established voice patterns

## Testing Considerations
- Verify state evidence appears in output
- Check calculation patterns match grammar
- Ensure inheritance works correctly
- Validate behavioral consistency