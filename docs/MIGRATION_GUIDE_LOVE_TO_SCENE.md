# Migration Guide: LOVE v1.1 to SCENE v1.2

## Overview

This guide helps you migrate from LOVE (Language-Oriented Verification Engine) v1.1 to SCENE (Sequenced Contexts Enabling Narrative Execution) v1.2. The migration involves both naming changes and structural improvements that enforce consistency.

## Key Changes

### 1. Name Change: LOVE → SCENE

All references to "LOVE" should be updated to "SCENE". This reflects the engine's evolution to prioritize computational contexts (scenes) as the primary organizing principle.

### 2. Structural Requirements

SCENE v1.2 enforces stricter patterns to ensure "one way to do one thing":

#### 2.1 Canonical `you:` Pattern (Required)

**LOVE v1.1 (flexible):**
```yaml
# Various patterns were allowed
behavioral: "do something"
behavior: 
  perform: "action"
you:
  must: "follow rules"
```

**SCENE v1.2 (canonical only):**
```yaml
# Only canonical pattern allowed
you:
  are: "role description"
  must: ["directive 1", "directive 2"]
  understand: "comprehension statement"
```

#### 2.2 Reference System: Dot Notation Only

**LOVE v1.1 (multiple reference styles):**
```yaml
# Anchor references
inherits: *engine
<<: *anchor

# Natural language
"see dynamics section"
"as defined in mechanics"
```

**SCENE v1.2 (dot notation only):**
```yaml
# Only dot paths allowed
inherits: engine
reference: engine.dynamics.uncertainty
modifies: engine.mechanics.search.trust
```

### 3. Scene-Centric Organization

#### 3.1 Required `x-scene` Block

**LOVE v1.1:**
```yaml
# Scene support was optional
x-engine: &engine
  # engine definition
```

**SCENE v1.2:**
```yaml
# Scene block is required
x-scene: &scene
  you:
    are: "computational context orchestrator"
    must: ["provide scene overlays", "enable context switching"]
    understand: "scenes shape all behavioral manifestation"
  
  registry: [SCENE_NORMAL, SCENE_DIAGNOSTIC, ...]
  active: SCENE_NORMAL
  scenes:
    # scene definitions
```

#### 3.2 Scene-Aware Components

All behavioral components must now consider active scene:

**LOVE v1.1:**
```yaml
uncertainty:
  threshold: 0.7
  behavior: "trigger fork"
```

**SCENE v1.2:**
```yaml
uncertainty:
  you:
    are: "threshold detector"
    must: ["monitor confidence", "trigger forks"]
    understand: "uncertainty drives exploration"
  
  scene_variations:
    SCENE_FORENSIC:
      threshold: 0.3
    SCENE_EMERGENCY:
      threshold: 0.9
```

### 4. Unified Formula-Performance Blocks

#### 4.1 No Separate Formula and Behavior

**LOVE v1.1:**
```yaml
metric:
  formula: "x * y"
  behavioral: "calculate result"
```

**SCENE v1.2:**
```yaml
metric:
  you:
    are: "metric calculator"
    must: ["compute values", "manifest results"]
    understand: "calculation is performance"
  
  formula:
    mathematical: "x * y"
  
  perform:
    through: "calculation utterance"
    manifesting: "CALCULATE_EXACT(x * y) = result"
    creating: "computational truth"
```

## Migration Steps

### Step 1: Update File Names and References

1. Rename files:
   - `love-grammar-spec.txt` → `scene-grammar-spec.txt`
   - `LOVE_*.md` → `SCENE_*.md`

2. Update all textual references:
   - "LOVE engine" → "SCENE engine"
   - "LOVE v1.1" → "SCENE v1.2"

### Step 2: Add Required Scene Block

Add to your engine.yaml:

```yaml
x-scene: &scene
  you:
    are: "computational context orchestrator"
    must:
      - "provide scene overlays for behavioral modification"
      - "enable fluid context switching during execution"
      - "preserve base mechanics while adapting parameters"
    understand: "scenes shape how all behaviors manifest"
  
  registry: [
    SCENE_NORMAL,
    SCENE_DIAGNOSTIC,
    SCENE_FORENSIC,
    SCENE_EMERGENCY,
    SCENE_CREATIVE
  ]
  
  active: SCENE_NORMAL
  
  scenes:
    SCENE_NORMAL:
      # Define your default scene
```

### Step 3: Convert to Canonical Patterns

For each behavioral component:

1. Replace direct assignments with `you:` blocks
2. Ensure all three elements (are/must/understand) are present
3. Convert references to dot notation

### Step 4: Unify Formula and Performance

For each metric or calculation:

1. Wrap in canonical `you:` block
2. Move formula to unified performance block
3. Use CALCULATE_EXACT patterns

### Step 5: Add Scene Variations

For dynamic parameters:

1. Identify which vary by context
2. Add `scene_variations` block
3. Define modifications per scene

## Validation Checklist

- [ ] All LOVE references updated to SCENE
- [ ] `x-scene` block present and complete
- [ ] All behavioral specs use canonical `you:` pattern
- [ ] All references use dot notation
- [ ] No separate formula/behavior blocks
- [ ] Scene variations added where appropriate
- [ ] Grammar spec updated to v1.2

## Breaking Changes

1. **Anchor references deprecated**: Convert `*anchor` to dot paths
2. **Mixed patterns rejected**: Only canonical forms accepted
3. **Scene block required**: Documents without `x-scene` will fail validation

## Benefits After Migration

1. **Consistency**: One way to express each concept
2. **Scene flexibility**: Easy behavioral adaptation
3. **Clearer semantics**: Canonical patterns improve readability
4. **Better tooling**: Consistent structure enables better IDE support

## Example: Complete Migration

### Before (LOVE v1.1):
```yaml
x-engine: &engine
  dynamics:
    uncertainty:
      <<: *uncertainty_config
      threshold: 0.7
      behavioral: "trigger epistemic fork when exceeded"
```

### After (SCENE v1.2):
```yaml
x-scene: &scene
  # Required scene block
  you:
    are: "computational context orchestrator"
    must: ["provide scene overlays", "enable switching"]
    understand: "scenes shape all behaviors"
  
  registry: [SCENE_NORMAL, SCENE_FORENSIC]
  active: SCENE_NORMAL
  scenes:
    # Scene definitions

x-engine: &engine
  dynamics:
    uncertainty:
      you:
        are: "uncertainty threshold detector"
        must: ["monitor confidence", "trigger forks"]
        understand: "uncertainty drives exploration"
      
      threshold: 0.7
      
      perform:
        through: "threshold monitoring"
        manifesting: "when uncertainty > 0.7, spawn epistemic fork"
        creating: "exploration opportunity"
      
      scene_variations:
        SCENE_FORENSIC:
          threshold: 0.3
```

## Support Resources

- Grammar Specification: `scene-grammar-spec-v1.2.txt`
- Technical Implementation: `REASONING_ENGINE_TECHNICAL_IMPLEMENTATION.md`
- Scene Implementation Plan: `SCENE_IMPLEMENTATION_PLAN.md`

## Conclusion

The migration from LOVE v1.1 to SCENE v1.2 represents a maturation of the engine's design philosophy. By enforcing canonical patterns and making scenes primary, we create a more consistent and powerful system for behavioral specification.