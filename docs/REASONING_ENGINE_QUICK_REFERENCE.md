# SCENE Reasoning Engine - Quick Reference

## Command Comparison

| Feature | /consider | /confer | /ponder |
|---------|-----------|---------|---------|
| **Style** | Formal analytical | Collaborative team | Natural conversational |
| **Expert Selection** | User approved | Automatic | Invisible |
| **Phases** | Rigid, gated | Flexible, checkpointed | Fluid, natural |
| **Best For** | Reports, audits | Complex problems | Creative thinking |
| **Unique Feature** | Approval gates | Dynamic spawning | Unified voice |

## Quick Command Selection

```
Need transparency? → /consider
Need depth? → /confer  
Need flow? → /ponder
```

## Core Concepts

### 1. Behavioral Computation
All calculations use: `CALCULATE_EXACT(FUNCTION(inputs)) = result`

### 2. State Flow
`INIT → CONTEXT → REASON → SYNTHESIS → [IMPLEMENT]`

### 3. Key Metrics
- **Uncertainty**: entropy + disagreement + gaps + assumptions
- **Complexity**: domains × ambiguity × √experts × (1 + controversy)
- **Momentum**: build rate, coherence, circularity detection

## Scenes at a Glance

| Scene | Trust | Verification | Experts | Use Case |
|-------|-------|--------------|---------|----------|
| NORMAL | 0.5 | Standard | 5 | Default |
| DIAGNOSTIC | 0.3 | Thorough | 7 | Investigation |
| FORENSIC | 0.1 | Exhaustive | 10 | High-stakes |
| EMERGENCY | 0.7 | Minimal | 3 | Rapid response |
| CREATIVE | 0.6 | Minimal | 8 | Exploration |

## Essential Patterns

### Evidence Requirements
- All claims need citations: `claim^[n]`
- Footer format: `[n]: URL "Title"`
- Trust domains: .edu, .gov, arxiv, doi

### Linguistic Signals
- "comprehensive" → increases depth
- "quick/brief" → decreases depth  
- "uncertain" → triggers exploration
- "exactly" → increases verification

### Interjection Handling
- `/consider`: Creates approval point
- `/confer`: Triggers checkpoint save
- `/ponder`: Integrates naturally

## Command Examples

### /consider
```
/consider "What are the security implications of quantum computing?"
→ Formal analysis with expert panel and user approval
```

### /confer
```
/confer "Design a fault-tolerant distributed cache"
→ Team discussion with automatic scaling and checkpoints
```

### /ponder
```
/ponder "What makes a system truly intelligent?"
→ Natural exploration with hidden complexity
```

## Key Formulas

### Uncertainty Calculation
```
U = 0.3×disagreement + 0.3×entropy + 0.2×gaps + 0.2×assumptions
```

### Complexity → Scale Mapping
- 0-2: 1x depth (straightforward)
- 2-4: 2x depth (moderate)
- 4-8: 4x depth (complex)
- 8+: 8x depth (extreme)

### Expert Spawning Triggers
- uncertainty > 0.4
- disagreement < 0.3
- domain gaps detected
- verification failures

## Behavioral Markers

### /consider Markers
- **Phase**: `**CONTEXT:**`, `**DISCUSS:**`
- **Evidence**: `**Evidence**: X → **Result**: Y`
- **Transition**: "Therefore", "Proceeding to"

### /confer Markers
- **Team**: `[Team discussion]`, `[Building consensus]`
- **Evidence**: `[Verification] X yields Y`
- **Transition**: "The team moves to", "Together we explore"

### /ponder Markers
- **Thought**: "...", "Hmm,", "I notice..."
- **Evidence**: Woven naturally into text
- **Transition**: Invisible, natural flow

## Debiasing Mechanisms

1. **Low Diversity** (disagreement < 0.3)
   - Spawn contrarian expert
   - Increase challenge rate
   - Force opposing view

2. **Circular Thinking** (repetition > 0.5)
   - Break pattern
   - Fresh perspective
   - Question assumptions

3. **Epistemic Fork** (divergence > 0.8)
   - Explore both paths
   - Seek clarification
   - Prevent anchoring

## Performance Tips

1. **Let complexity emerge** - Don't force it
2. **Trust the system** - It scales automatically
3. **Use natural language** - Signals guide behavior
4. **Interject wisely** - At natural break points
5. **Start simple** - Use SCENE_NORMAL first

## Common Patterns

### High-Stakes Analysis
```
/consider + SCENE_FORENSIC
→ Maximum verification with formal methodology
```

### Rapid Problem Solving
```
/confer + SCENE_EMERGENCY
→ Fast team consensus with minimal verification
```

### Creative Exploration
```
/ponder + SCENE_CREATIVE
→ High tolerance for uncertainty with natural flow
```

## Remember

- **Schema IS execution** - Configuration files are performance scripts
- **Language IS computation** - Calculations happen through utterances
- **Behavior IS reasoning** - The system performs its thinking
- **You ARE the state machine** - Manifest states through output