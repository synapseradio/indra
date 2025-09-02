# PRISM Fragment Domain Ownership Map

## Core Foundation
**File:** `thinking_primitives.in`
**Owns:** Basic cognitive operations
- Wonder and curiosity generation
- Natural thought branching
- Option weighing
- Hunch following
- Pattern connection
- Basic synthesis

**Personas:**
- @curious_explorer - basic curiosity
- @careful_evaluator - basic evaluation
- @pattern_seeker - finding connections
- @synthesizer - weaving threads

---

## Critical Thinking Domain
**File:** `fragments/critique.in`
**Owns:** Evidence evaluation and logical reasoning
- Evidence strength assessment
- Logical fallacy detection
- Inference chain validation
- Alternative hypothesis generation
- Argument structure analysis

**Personas:**
- @intellectual_humility - evidence-based reasoning
- @intellectual_courage - challenging assumptions

---

## Debiasing Domain
**File:** `fragments/debiasing.in`
**Owns:** Cognitive bias mitigation
- System 1/2 thinking balance
- Confirmation bias detection
- Anchoring bias awareness
- Availability heuristic checks
- Slow reasoning techniques

**Personas:**
- @metacognitive_observer - bias awareness
- @perspective_shifter - viewpoint flexibility

---

## Comparison Domain
**File:** `fragments/compare.in`
**Owns:** Comparative analysis
- Multi-criteria comparison
- Trade-off analysis
- Similarity/difference mapping
- Weighted evaluation

**Personas:**
- @comparison_analyst - systematic comparison

---

## Focus Domain
**File:** `fragments/focus.in`
**Owns:** Strategic prioritization (WHAT to focus on)
- Leverage point identification
- Impact/effort analysis
- Question sharpening
- Essential vs non-essential

**Personas:**
- @strategic_prioritizer - finding leverage

---

## Attention Domain
**File:** `fragments/attention.in`
**Owns:** Cognitive load management (HOW to maintain focus)
- Mindful noticing
- Distraction handling
- Present-moment awareness
- Cognitive resource allocation

**Personas:**
- @mindful_observer - present awareness
- @cognitive_load_manager - resource optimization

---

## Temporal Domain
**File:** `fragments/temporal.in`
**Owns:** Mental time travel
- Future scenario exploration
- Past pattern analysis
- Causal chain tracing
- Temporal perspective shifts

**Personas:**
- @temporal_navigator - time perspective shifts
- @causal_archaeologist - historical pattern finding

---

## Expansion Domain
**File:** `fragments/expansion.in`
**Owns:** Creative exploration
- SCAMPER techniques
- Analogical thinking
- Cross-domain transfer
- Lateral connections

**Personas:**
- @lateral_thinker - unconventional connections

---

## Specificity Domain
**File:** `fragments/specificity.in`
**Owns:** Abstraction navigation
- Abstraction ladder movement
- Concrete/abstract transitions
- Pre-mortem analysis
- Five whys technique

**Personas:**
- (Currently operator-focused, no personas)

---

## Sufficiency Domain
**File:** `fragments/sufficiency.in`
**Owns:** Information adequacy
- Knowledge gap identification
- Sufficiency assessment
- Missing information detection
- Inquiry generation

**Personas:**
- @intellectual_scout - knowledge boundary mapping

---

## Divergence Domain
**File:** `fragments/divergence.in`
**Owns:** Fork detection
- Critical decision points
- Path divergence identification
- Implication articulation
- Choice consequence mapping

**Personas:**
- @epistemic_guardian - fork awareness

---

## Convergence Domain
**File:** `fragments/convergence.in`
**Owns:** Insight synthesis
- Theme identification
- Principle distillation
- Pattern convergence
- Unified understanding

**Personas:**
- @insight_distiller - pattern convergence

---

## Reframing Domain
**File:** `fragments/reframing.in`
**Owns:** Six Thinking Hats
- White hat: facts/data
- Red hat: emotions
- Black hat: critical assessment
- Yellow hat: benefits
- Green hat: creativity
- Blue hat: meta-thinking

**Personas:**
- Six hat personas for each perspective

---

## Inquiry Domain
**File:** `commands/inquire.in`
**Owns:** Question exploration
- Assumption mapping
- Contrarian perspectives
- Question deepening
- Multi-angle investigation

**Personas:**
- @assumption_cartographer - assumption mapping
- @contrarian_voice - alternative views

---

## Rules for Domain Separation

1. **No Overlapping Personas**: Each persona appears in exactly one file
2. **Clear Boundaries**: Each domain has distinct cognitive responsibilities
3. **Dependency Direction**: Fragments depend on thinking_primitives, not vice versa
4. **On-Demand Loading**: Specialized fragments loaded only when needed
5. **Operator Uniqueness**: No duplicate operators across fragments