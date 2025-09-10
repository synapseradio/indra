# PRISM Library Architectural Improvements PRD

**Document Type:** Product Requirements Document  
**Focus:** Library Architecture & Organization  
**Version:** 1.0  
**Date:** 2025-09-09  

---

## Executive Summary

The PRISM library requires architectural improvements to address inconsistencies in its dual-voice pattern implementation, embedded techniques that should be standalone, hard-coded strategy composition, and unclear organizational boundaries. This PRD defines specific architectural changes to create a cleaner, more composable, and maintainable cognitive framework.

**Key Problems Identified:**
- Dual-voice pattern exists but inconsistently applied across fragments
- Techniques like SCAMPER are embedded in fragments rather than being standalone
- Strategy composition is hard-coded rather than dynamically composable
- Missing techniques/ directory for standalone cognitive methods
- Unclear boundaries between fragments, strategies, and techniques

**Proposed Solution:**
Restructure PRISM into four clear layers with consistent patterns, introduce a techniques/ directory, standardize dual-voice implementation, and create dynamic composition mechanisms.

---

## Current Architecture Analysis

### Existing 3-Layer Structure
1. **Base Layer:** `base.in`, `thinking_primitives.in` - foundational context and atomic operators
2. **Fragments Layer:** `fragments/` - specialized cognitive domains (critique, focus, expansion, etc.)
3. **Strategies Layer:** `strategies/` - composed multi-step reasoning patterns

### Identified Architectural Issues

#### 1. Inconsistent Dual-Voice Pattern
- **Found in:** `thinking_primitives.in` with personas like `@curious_explorer`, `@careful_evaluator`
- **Missing from:** Many fragments lack corresponding performative personas
- **Problem:** Creates inconsistent interaction patterns and limits composability

#### 2. Embedded Techniques
- **Example:** SCAMPER technique embedded in `fragments/expansion.in`
- **Problem:** Makes techniques difficult to reuse across different contexts
- **Impact:** Violates separation of concerns and reduces modularity

#### 3. Hard-coded Strategy Composition  
- **Current:** Strategies manually compose specific fragments via static imports
- **Problem:** No dynamic composition based on context or requirements
- **Example:** `creative_exploration.in` hard-codes expansion + convergence

#### 4. Missing Organizational Layer
- **Gap:** No dedicated space for standalone cognitive techniques
- **Need:** Techniques that can be applied across multiple fragments/strategies
- **Impact:** Forces techniques to be embedded rather than reusable

#### 5. Unclear Module Boundaries
- **Issue:** Some fragments overlap in functionality
- **Example:** Critical thinking spread across critique, debiasing, and sufficiency fragments
- **Problem:** Makes composition decisions arbitrary and maintenance difficult

---

## Proposed Architectural Changes

### 1. Four-Layer Architecture

```
lib/prism/
├── base.in                    # Foundation layer
├── thinking_primitives.in     # Core cognitive operators
├── techniques/                # NEW: Standalone cognitive methods
│   ├── scamper.in            # Creativity technique
│   ├── six_hats.in           # Moved from strategies/
│   ├── socratic_method.in    # Questioning technique
│   ├── devils_advocate.in    # Challenge technique
│   └── feynman_technique.in  # Learning technique
├── fragments/                 # Cognitive domains with dual-voice
│   ├── critique.in           # Uses techniques/socratic_method.in
│   ├── expansion.in          # Uses techniques/scamper.in
│   └── ...
├── strategies/                # Composed reasoning patterns
│   ├── creative_exploration.in # Dynamically loads based on context
│   └── ...
└── reasoning_modules/         # High-level complete systems
    ├── tree_of_thought.in
    ├── graph_of_thought.in
    └── ...
```

### 2. Standardized Dual-Voice Pattern

**Every fragment must implement:**
- **Analytical voice:** Systematic, step-by-step reasoning
- **Performative voice:** Natural, conversational inner monologue

**Template for fragments:**
```indra
# Fragment: [name]
>>read_file: '../base.in'<<
>>read_file: '../techniques/[relevant_technique].in'<<

# ANALYTICAL VOICE - Systematic Operations
operator systematic_[operation](params) ::= <<|
  [Structured analysis logic]
|>>

# PERFORMATIVE VOICE - Conversational Persona  
persona @[domain]_voice:
  identity: "[Natural conversational identity]"
  rules: ["natural expression", "thinking out loud"]
  
# DUAL-VOICE BRIDGE - Connects both approaches
sequence [operation]_naturally(params) ::=
  step: # Analytical foundation
  step: # Performative expression
```

### 3. Dynamic Strategy Composition

**Replace hard-coded imports with capability-based loading:**

```indra
# Current (hard-coded):
>>read_file: '../fragments/expansion.in'<<
>>read_file: '../fragments/convergence.in'<<

# Proposed (dynamic):
sequence adaptive_creative_exploration(context) ::=
  step:
    when: context.needs_lateral_thinking
      read_file: '../techniques/scamper.in'
      read_file: '../fragments/expansion.in'
  step:  
    when: context.needs_synthesis
      read_file: '../techniques/devils_advocate.in' 
      read_file: '../fragments/convergence.in'
```

### 4. Techniques Directory Structure

**Standalone cognitive methods that can be composed into any fragment:**

- `techniques/scamper.in` - Creative ideation method
- `techniques/six_hats.in` - Multi-perspective analysis  
- `techniques/socratic_method.in` - Systematic questioning
- `techniques/devils_advocate.in` - Critical challenge method
- `techniques/feynman_technique.in` - Learning through explanation
- `techniques/impact_effort_matrix.in` - Prioritization method
- `techniques/root_cause_analysis.in` - Problem investigation

**Each technique provides:**
- Pure method implementation (no domain-specific context)
- Clear interface for parameters and expected outputs
- Documentation of when/how to apply the technique

---

## Specific Implementation Tasks

### Phase 1: Foundation Setup ✅ COMPLETE
1. **Create techniques/ directory structure** ✅
2. **Extract SCAMPER from expansion.in into techniques/scamper.in** ✅
3. **Move six_hats.in from strategies/ to techniques/** ✅
4. **Define standard dual-voice template for fragments** ❌ (removed - not valid INDRA)

### Additional Architectural Improvements ✅ COMPLETE
1. **Extract personas to dedicated /personas/ directory** ✅
2. **Reorganize techniques with intuitive prefixes** ✅
   - analysis_five_whys.in (root cause analysis)
   - creativity_scamper.in (creative ideation)  
   - validation_ladder_of_inference.in (reasoning validation)
   - perspective_six_hats.in (multi-perspective analysis)
3. **Add new cognitive techniques** ✅
   - Five Whys technique
   - Ladder of Inference technique
4. **Update all import paths systematically** ✅

### Phase 2: Fragment Standardization  
1. **Audit all fragments for dual-voice consistency**
2. **Implement performative personas for fragments missing them**
3. **Refactor fragments to use techniques/ imports**
4. **Standardize fragment interfaces and naming**

### Phase 3: Dynamic Composition
1. **Implement conditional module loading in strategies**
2. **Create capability detection logic for context-aware composition**
3. **Build strategy templates that adapt to different complexity levels**
4. **Design composition patterns for common reasoning flows**

### Phase 4: Architecture Validation
1. **Refactor existing commands to use new architecture**
2. **Apply dual-voice patterns across different reasoning contexts**
3. **Validate dynamic composition with various strategy combinations**
4. **Evaluate performance with complex multi-strategy compositions**

---

## Open Design Questions

### 1. Technique Parameterization
- **Question:** How should techniques accept domain-specific context while remaining reusable?
- **Options:** 
  - A) Parameter injection with standard context schema
  - B) Callback pattern where fragments provide domain logic
  - C) Template pattern with fragment-specific implementations
- **Decision needed:** Choose approach for techniques/fragments interface

### 2. Strategy Composition Granularity
- **Question:** What level of dynamic composition should strategies support?
- **Options:**
  - A) Technique-level (fine-grained, complex)
  - B) Fragment-level (medium-grained, balanced) 
  - C) Module-level (coarse-grained, simple)
- **Decision needed:** Balance flexibility vs. complexity

### 3. Dual-Voice Implementation Pattern
- **Question:** Should dual-voice be enforced at the architectural level or left to fragment authors?
- **Options:**
  - A) Enforced: All fragments must implement both voices
  - B) Optional: Fragments can choose analytical-only, performative-only, or dual-voice
  - C) Context-aware: Voice selection based on usage context
- **Decision needed:** Level of architectural constraint

### 4. Performance vs. Flexibility Trade-offs
- **Question:** How much runtime composition flexibility can we add without impacting performance?
- **Considerations:**
  - Dynamic imports add latency
  - Complex composition logic increases cognitive load
  - More flexibility may reduce predictability
- **Decision needed:** Acceptable performance impact for composition flexibility

### 5. Fragment Boundary Definition
- **Question:** What criteria should determine when functionality belongs in techniques/ vs fragments/ vs strategies/?
- **Proposed rules:**
  - techniques/: Domain-agnostic cognitive methods
  - fragments/: Domain-specific cognitive capabilities with dual-voice
  - strategies/: Multi-step composed reasoning patterns
- **Validation needed:** Apply boundary rules to existing and planned functionality

---

## Next Steps for Investigation

### 1. Prototype Dual-Voice Template (1-2 days)
- Create standardized template for fragment dual-voice implementation
- Apply to 2-3 existing fragments (critique.in, expansion.in, focus.in)
- Validate natural conversation flow with performative personas
- Document patterns that work vs. ones that feel forced

### 2. Extract SCAMPER Technique (1 day)
- Move SCAMPER from expansion.in to techniques/scamper.in
- Update expansion.in to import and use the extracted technique
- Ensure functionality remains identical
- Document extraction pattern for other embedded techniques

### 3. Design Dynamic Composition Interface (2-3 days)
- Create capability detection schema for strategies
- Implement conditional loading pattern in one strategy
- Evaluate performance impact of dynamic vs. static imports
- Design developer experience for composition logic

### 4. Validate Architecture with Existing Commands (3-4 days)
- Refactor one complex command (e.g., /consider) to use new architecture
- Measure impact on command complexity and maintainability
- Validate that dual-voice patterns improve conversation quality
- Document architectural migration patterns

### 5. Define Fragment Migration Strategy (1-2 days)
- Audit all existing fragments for architecture compliance gaps
- Prioritize fragments by impact and complexity of migration
- Create migration templates and tooling
- Establish validation approach for migrations

---

## Success Criteria

### Technical Success Metrics
- All fragments implement consistent dual-voice patterns
- Techniques can be composed into multiple fragments without code duplication
- Strategy composition can adapt to different contexts and complexity levels
- Command implementations become simpler and more maintainable

### User Experience Success Metrics
- Conversations with PRISM-based commands feel more natural and collaborative
- Users can more easily understand and predict system behavior
- Complex reasoning tasks can be accomplished with clearer progress tracking
- System responses adapt appropriately to different reasoning contexts

### Developer Experience Success Metrics  
- New fragments can be created using clear templates and patterns
- Techniques can be developed and tested independently of specific fragments
- Strategy composition becomes more declarative and less procedural
- Architecture documentation clearly guides implementation decisions

---

This PRD focuses specifically on the PRISM library architecture improvements needed to create a more composable, maintainable, and consistent cognitive framework. The next person working on PRISM architecture should start with the prototype dual-voice template and SCAMPER extraction to validate the proposed patterns before proceeding with broader architectural changes.