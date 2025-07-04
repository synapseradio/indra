# Context Analysis Findings

## SCENE System Analysis

### Architecture Overview
- SCENE (Sequenced Contexts Enabling Narrative Execution) is a behavioral DSL system
- Commands inherit from a unified engine (`engine.yaml`) with specialized overlays
- The system uses a recursive state machine that manifests through language output
- Key commands found: consider, confer, ponder, reason, requirements

### SCENE Context System
- 5 predefined contexts: NORMAL, DIAGNOSTIC, FORENSIC, EMERGENCY, CREATIVE
- Each context modifies behavioral parameters without changing core functionality
- Contexts affect trust levels, verification depth, and computational stance
- Dynamic switching between contexts is supported

### Command Structure
- Commands are defined in YAML with canonical `you:` blocks (are/must/understand)
- State flow: INIT → CONTEXT → REASON → SYNTHESIS → IMPLEMENT
- Each state has behavioral contracts and output requirements
- Commands can override engine parameters and specify preferred scenes

## Existing Testing Patterns

### Test Suite Discovery
- Found 10 comprehensive test suites in `/test_suites/`
- Tests use binary criteria (Pass/Fail) for evaluation
- Each test suite includes:
  - Scenario overview with complexity triggers
  - User prompts and expected interjections
  - State manifestation criteria
  - Calculation performance criteria
  - Visibility compliance criteria

### Test Structure Pattern
```
- Scenario setup (domain, ambiguity, uncertainty)
- Initial prompt
- Expected interjections
- Binary criteria in 3 categories:
  1. State Manifestation (behavioral outputs)
  2. Calculation Performance (computational accuracy)
  3. Visibility Compliance (transparency requirements)
```

### Key Testing Concepts Identified
1. **Behavioral Validation**: Tests verify what commands produce, not just correctness
2. **State Transitions**: Ensuring proper flow through state machine
3. **Context Sensitivity**: Different behaviors under different SCENE contexts
4. **Expert Spawning**: Validation of dynamic expert generation
5. **Uncertainty Handling**: Proper fork detection and management

## Framework Requirements Insights

### Technical Constraints
- Must parse YAML command specifications
- Need to simulate different SCENE contexts
- Should capture and validate behavioral outputs
- Must support state machine execution tracking

### Test Generation Opportunities
- YAML specifications contain testable contracts
- State output contracts define expected evidence
- Behavioral anchors provide calculation patterns
- Scene modifications create test variations

### Integration Points
- Commands are in `/reason/command-overlays/`
- Engine specification in `/reason/command-overlays/engine.yaml`
- Test results stored in `/test_results/`
- No existing automated framework detected

## Recommended Approach

Based on the analysis:
1. **Behavioral Testing Focus**: Framework should validate language outputs, not internal state
2. **YAML-Driven Generation**: Leverage existing specifications for test creation
3. **Scene Variation Testing**: Each command tested under multiple contexts
4. **State Evidence Validation**: Verify required outputs for each state
5. **Calculation Performance**: Validate CALCULATE_EXACT patterns
6. **Expert Dialogue Verification**: Ensure proper expert spawning and interaction