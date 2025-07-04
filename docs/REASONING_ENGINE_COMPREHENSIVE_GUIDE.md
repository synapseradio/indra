# Comprehensive Guide to the SCENE Reasoning Engine

## Table of Contents
1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [The Behavioral Paradigm](#the-behavioral-paradigm)
4. [Engine Components](#engine-components)
5. [Commands Overview](#commands-overview)
6. [Scene System](#scene-system)
7. [Usage Guide](#usage-guide)
8. [Technical Deep Dive](#technical-deep-dive)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Overview

The SCENE (Sequenced Contexts Enabling Narrative Execution) reasoning system is a sophisticated behavioral architecture that unifies language, computation, and reasoning into a single performative framework. At its core, it's a recursive state machine that manifests computation through language acts.

### Key Principles

1. **Schema as Performance**: The YAML configuration files are not just data structures - they are executable performance scripts that the AI enacts
2. **Behavioral Computation**: Mathematical operations manifest as behavioral utterances using the CALCULATE_EXACT pattern
3. **Unified Trinity**: Language, computation, and behavior are one - not separate systems
4. **Natural Debiasing**: Built-in mechanisms like epistemic fork detection prevent cognitive biases

### The Command Trinity

The system provides three commands, each representing a different reasoning style:

- **`/consider`**: Formal analytical reasoning with expert panels
- **`/confer`**: Collaborative team-based reasoning with dynamic spawning
- **`/ponder`**: Unified conversational intelligence with invisible complexity

## Core Architecture

### The Engine (engine.yaml)

The engine serves as the foundational layer that all commands inherit from. It defines:

#### 1. Immutable Mechanics
- **Search**: Evidence-based reasoning with citation requirements
- **Chain**: Verification and storage of reasoning steps
- **Fork**: Detection and exploration of uncertainty
- **Preserve**: Exact preservation of user input
- **Scale**: Test-time adjustment of computational depth
- **Citation**: Collection and formatting of references

#### 2. Dynamic Parameters
Adaptable ranges for various behavioral aspects:
- Expert count (3-10)
- Challenge rate (0-1)
- Inspiration rate (0-1)
- Recursion depth (1-7)
- Uncertainty thresholds
- Momentum metrics

#### 3. State Machine (Σ)
The core states that manifest through language output:
- **INIT**: Establish connection and readiness
- **CONTEXT**: Understand the question deeply
- **REASON**: Expert analysis and discussion
- **SYNTHESIS**: Consolidate insights
- **IMPLEMENT**: Take concrete action (guarded)

#### 4. Behavioral Contracts
Precise calculation patterns using CALCULATE_EXACT:
```
CALCULATE_EXACT(FUNCTION_NAME(inputs)) = result
```

## The Behavioral Paradigm

### Performance Through Language

The system doesn't just process language - it performs computation through language acts. When calculating uncertainty, for example:

```
Calculating uncertainty...
- Expert disagreement: CALCULATE_EXACT(STATISTICAL_VARIANCE([0.3, 0.7, 0.5])) = 0.04
- Confidence distribution: CALCULATE_EXACT(SHANNON_ENTROPY([0.2, 0.2, 0.3, 0.3])) = 1.386
- Citation gaps: CALCULATE_EXACT(3/10) = 0.3
- Hidden assumptions: CALCULATE_EXACT(2/10) = 0.2

Overall uncertainty: CALCULATE_EXACT(0.3×0.04 + 0.3×1.386 + 0.2×0.3 + 0.2×0.2) = 0.528
```

### Attitude × Aptitude Matrix

Each command combines an attitude with an aptitude to create its unique behavior:

**Attitudes**:
- **Formal**: Structured, explicit markers, clear phases
- **Collaborative**: Team-based, consensus-building, collective
- **Contemplative**: Flowing, natural, introspective

**Aptitudes**:
- **Analytical**: Structured decomposition, categorization
- **Consensus**: Multi-perspective integration, alignment
- **Holistic**: Pattern recognition, essence-finding

## Engine Components

### 1. Metric Formulas

The engine defines precise formulas for key metrics:

- **Uncertainty**: Σ(weight[i]×factor[i]) combining entropy, disagreement, gaps, and assumptions
- **Complexity**: domains × ambiguity × √experts × (1 + controversy)
- **Momentum**: Tracking build rate, coherence, and circularity
- **Epistemic Fork**: Detection of significant path divergence

### 2. Verification System

Multi-layered verification ensures reasoning integrity:
- Double-checking logic and citations
- Cross-expert validation
- Parallel verification paths
- Checkpoint and rollback capability

### 3. Debiasing Patterns

Natural debiasing mechanisms:
- **Low Diversity**: Spawn contrarian perspectives when disagreement < 0.3
- **Circular Momentum**: Break patterns when circularity > 0.5
- **Epistemic Fork**: Explore both paths when divergence > 0.8

### 4. Visibility Controls

What users see vs. what happens internally:
- Expert dialogue: Always visible
- Reasoning chains: Command-specific
- Calculations: Shown in debug or when significant
- State transitions: Hidden unless debugging

## Commands Overview

### /consider - Formal Analysis

**Profile**: formal × analytical

**Key Features**:
- Structured expert panels with mandatory evidence
- User approval gates between selection and discussion
- Formal phase progression with clear markers
- Maximum transparency and audit trail
- High challenge rate (0.7) for rigorous debate

**Best For**:
- High-stakes decisions
- Academic research
- Formal reports
- Situations requiring explicit methodology

**Unique Mechanics**:
- Requires user approval for expert selection
- Enforces minimum domain diversity
- Explicit phase announcements
- Formal citation requirements

### /confer - Collaborative Reasoning

**Profile**: collaborative × consensus

**Key Features**:
- Automatic expert inference based on complexity
- Dynamic expert spawning on uncertainty
- Checkpoint/rollback system
- Prompt chaining with visual trees
- Test-time scaling (1x-8x)

**Best For**:
- Complex multi-domain problems
- Exploratory analysis
- Team-based investigations
- Situations needing adaptive depth

**Unique Mechanics**:
- spawn_on_uncertainty (threshold 0.4)
- checkpoint_rollback (every 3 turns)
- parallel_chains (multiple reasoning paths)
- Automatic complexity assessment

### /ponder - Unified Intelligence

**Profile**: contemplative × holistic

**Key Features**:
- Completely invisible expert mechanics
- Natural conversational flow
- Seamless citation integration
- Adaptive semantic compression
- Emotional intelligence layer

**Best For**:
- Creative exploration
- Philosophical questions
- Personal reflection
- Natural conversation

**Unique Mechanics**:
- Unified voice synthesis
- Narrative reasoning chains
- Casual epistemic queries
- Quantum thought superposition

## Scene System

Scenes are computational context overlays that modify HOW states execute without changing WHAT they do.

### Available Scenes

1. **SCENE_NORMAL**: Default balanced approach
   - Trust level: 0.5
   - Standard verification depth
   - Assumption tolerance: 0.3

2. **SCENE_DIAGNOSTIC**: Methodical investigation
   - Trust level: 0.3
   - Thorough verification
   - More experts (7 default)
   - Higher challenge rate

3. **SCENE_FORENSIC**: Paranoid verification
   - Trust level: 0.1
   - Exhaustive verification
   - Maximum experts (10)
   - Continuous anomaly detection

4. **SCENE_EMERGENCY**: Rapid response
   - Trust level: 0.7
   - Minimal verification
   - Fewer experts (3)
   - Action-oriented output

5. **SCENE_CREATIVE**: Exploratory mode
   - Trust level: 0.6
   - High inspiration rate
   - Tolerance for uncertainty
   - Diverse perspectives

### Scene Effects

Scenes modify:
- Dynamic parameter defaults and ranges
- Verification depth and parallelism
- Expert behavior and count
- Evidence requirements
- Output compression

## Usage Guide

### Basic Usage

1. **Simple Analysis**:
   ```
   /consider "What are the implications of quantum computing for cryptography?"
   ```

2. **Team Discussion**:
   ```
   /confer "How should we architect a distributed system for real-time collaboration?"
   ```

3. **Natural Exploration**:
   ```
   /ponder "What does it mean to truly understand something?"
   ```

### Advanced Features

#### Interjections
All commands support mid-reasoning interjections:
- `/consider`: Creates approval point
- `/confer`: Triggers checkpoint
- `/ponder`: Naturally integrates

#### Scene Switching
```yaml
# In command configuration
active_scene: SCENE_FORENSIC
```

#### Complexity Hints
The system detects complexity through linguistic signals:
- "comprehensive analysis" → increases depth
- "quick summary" → decreases depth
- "uncertain about" → increases exploration

### Command Selection Guide

Choose based on your needs:

| Need | Command | Why |
|------|---------|-----|
| Formal report | /consider | Clear methodology, audit trail |
| Complex problem | /confer | Adaptive depth, checkpointing |
| Creative thinking | /ponder | Natural flow, hidden complexity |
| Quick analysis | /ponder | Efficient, conversational |
| Multi-stakeholder | /consider | Transparent process |
| Technical deep-dive | /confer | Prompt chains, verification |

## Technical Deep Dive

### State Machine Implementation

States manifest through output patterns:

```yaml
CONTEXT:
  you:
    manifest_as: "Exploration and information gathering"
    evidence: ["Let me understand", "I'll search for", "I found"]
    produce: ["searched_for_information", "identified_key_aspects"]
```

### Calculation Performance

All calculations follow the pattern:
```
Behavioral introduction ("Calculating X...")
CALCULATE_EXACT(FUNCTION(explicit_inputs)) = numeric_result
Evidence statement (inputs → result)
```

### Chain Management

Reasoning chains in /confer:
```yaml
chains:
  types:
    reason: [claim→evidence→infer→conclude]
    disagree: [contention→counter→alt→resolve]
    inquiry: [observe→pattern→hypothesis→test]
```

### Expert Spawning Logic

```yaml
spawn_triggers:
  uncertainty: threshold > 0.4
  low_diversity: disagreement < 0.3
  domain_gap: uncovered_domain_detected
  verification_need: suspicious_claim
```

## Best Practices

### 1. Command Selection
- Use `/consider` when you need transparency
- Use `/confer` when you need depth
- Use `/ponder` when you need flow

### 2. Complexity Management
- Let the system detect complexity naturally
- Use linguistic signals to guide depth
- Trust test-time scaling

### 3. Evidence and Citations
- All commands require evidence-based reasoning
- Citations are collected automatically
- Acknowledge when evidence is unavailable

### 4. Interjection Timing
- Interject when clarification needed
- Use to correct misunderstandings
- Integrate new information naturally

### 5. Scene Selection
- Start with SCENE_NORMAL
- Switch to specialized scenes for specific needs
- Return to normal for general use

## Examples

### Example 1: Technical Analysis with /consider

```
User: /consider "Should we migrate from PostgreSQL to a distributed database?"

[CONTEXT phase]
Let me understand the technical and business implications of database migration.
[Searches for evidence about database migrations, distributed systems]

[SELECT phase]
Given the complexity, I recommend these experts:
- Database Architect (PostgreSQL specialist)
- Distributed Systems Engineer
- DevOps Lead
- Financial Analyst
- Risk Assessment Specialist

[APPROVE gate - waits for user]

[DISCUSS phase with formal structure and citations]
```

### Example 2: Problem Solving with /confer

```
User: /confer "Debug why our API response times degraded 50% last week"

[Automatic complexity assessment]
Complexity: 3.2 → Assembling 5 experts at 2x depth

[Team forms automatically]
[Checkpoint saved after initial investigation]
[Spawns performance expert when metrics analyzed]
[Reasoning chains track investigation paths]
```

### Example 3: Creative Exploration with /ponder

```
User: /ponder "How might we design interfaces that adapt to emotional states?"

[Natural conversational flow]
That's fascinating - designing for emotional adaptation touches on psychology, 
technology, and human experience. I've been exploring research on affective 
computing^[1] and it suggests...

[Invisible expert deliberation presented as unified thought]
```

### Example 4: Scene-Modified Investigation

```
User: /confer "Investigate potential security breach in user data"
[Activates SCENE_FORENSIC automatically due to security context]

[Paranoid verification mode engaged]
- Trust level: 0.1
- Verification: exhaustive
- Expert count: 10
- Continuous anomaly detection active
```

## Conclusion

The SCENE reasoning engine represents a paradigm shift in AI reasoning systems. By unifying language, computation, and behavior into a single performative framework, it creates a natural yet rigorous approach to complex problem-solving.

Whether you need the formal structure of `/consider`, the adaptive intelligence of `/confer`, or the natural flow of `/ponder`, the system provides the right tool for your reasoning needs. The scene system adds another dimension of adaptability, allowing the same commands to operate in different computational contexts.

The key to mastery is understanding that you're not just using a tool - you're engaging with a system that performs reasoning through language, where the schema is the execution and calculations are behavioral acts. This creates a uniquely powerful and natural reasoning experience.