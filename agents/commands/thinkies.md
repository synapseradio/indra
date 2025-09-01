# thinkies

**I orchestrate cognitive agents in powerful reasoning pipelines**

I chain multiple claude code agents together, creating sophisticated reasoning processes where each agent builds upon the previous agents' contributions.

## Core Concept

Instead of using a single agent, I allow you to design multi-stage reasoning pipelines that leverage the unique strengths of different cognitive agents. Each agent receives the accumulated context from previous stages and adds their own layer of analysis, creating increasingly sophisticated understanding.

Before I design a pipeline, I ensure that I am clear on the scope and the depth necessary. I understand that agents take a lot of time to work, and some problems don't need a full multi-agent breakdown. I will only use as many agents as are necessary to get the job done well.

At the end, I synthesize a response based on agent output and return it to you.

I understand that my examples may or may not contain real agents, and I always check which agents are available for me to use.

## Syntax

### Basic Pipeline

```
thinkies "agent1 -> agent2 -> agent3" "your query"
```

### Branching and Parallel Processing  

```
thinkies "scout -> (optimist | pessimist) -> judge" "your query"
```

### Agent Parameters

```
thinkies "scout(depth=comprehensive) -> strategist(style=aggressive)" "your query"
```

### Complex Nested Pipelines

```
thinkies "scout -> (lateral-thinker -> critic | tree-explorer -> simplifier) -> synthesizer" "your query"
```

## Pipeline Operators

- `->` : Sequential execution (agent2 receives agent1's output)
- `|` : Parallel execution (both agents receive same input, outputs merged)
- `()` : Grouping for complex branching
- `agent(param=value)` : Agent configuration

## Context Evolution

The system maintains a rich context object that grows through the pipeline:

```javascript
{
  originalQuery: "How should we approach this market opportunity?",
  pipeline: "scout -> (optimist | pessimist) -> judge",
  stages: [
    {
      agent: "scout",
      input: "How should we approach this market opportunity?",
      output: "Market analysis reveals three key segments...",
      insights: ["High competition in segment A", "Untapped potential in segment B"],
      metadata: { execution_time: "2.3s", confidence: 0.85 }
    },
    {
      agent: "tree-explorer",
      input: "Market analysis reveals three key segments...",
      output: "This presents exciting opportunities...",
      insights: ["Strong growth potential", "Competitive advantages possible"],
      metadata: { execution_time: "1.8s", confidence: 0.92 }
    },
    // ... more stages
  ],
  branches: {
    "branch_1": { /* branch 1 results */ },
    "branch_2": { /* branch 2 results */ },
    // ...
  },
  synthesis: "Balanced recommendation considering both opportunities and risks..."
}
```

## Branching Strategies

When agents execute in parallel, their outputs are merged using intelligent strategies:

### Exploratory Merge

Combines different perspectives to create comprehensive understanding:

```
scout -> (lateral-thinker | tree-explorer) -> connector
```

### Competitive Selection  

Evaluates parallel results and selects the best approach:

```
scout -> (optimist | pessimist | realist) -> judge
```

### Synthesis Merge

Integrates complementary analyses into unified insight:

```
analyst -> (strengths-finder | weaknesses-finder) -> strategist
```

## Powerful Pipeline Examples

### Strategic Decision Making

```bash
thinkies "scout -> complexity-mapper -> (systematizer | prioritizer) -> strategist -> judge" \
  "Should we acquire this startup?"
```

*Creates comprehensive acquisition analysis with multiple perspectives*

### Creative Problem Solving

```bash
thinkies "lateral-thinker -> tree-explorer -> dot-connector -> (challenger | tree-explorer)" \
  "How can we reduce customer churn?"
```

*Generates innovative solutions while stress-testing viability. I will then think to synthesize my response, taking agent outputs into account.*

### Research and Analysis

```bash
thinkies "scout(depth=comprehensive) -> challenger -> evidence-anchor -> strategist -> judge" \
  "What are the implications of AI regulation?"
```

*Produces balanced research brief with multiple viewpoints*

### Complex Planning

```bash
thinkies "scout -> complexity-mapper -> (systematizer -> prioritizer | simplifier -> connector) -> strategist" \
  "Plan our product roadmap for next year"
```

*Creates detailed roadmap considering both systematic and simplified approaches*

### Risk Assessment

```bash
thinkies "scout -> (devil's-advocate | advocate) -> judge -> (optimist | pessimist) -> synthesizer" \
  "Should we enter the European market?"
```

*Thorough risk analysis with balanced perspective synthesis*

## Advanced Features

### Conditional Execution

```bash
thinkies "scout -> strategist if complex -> judge" "your query"
```

### Iterative Refinement

```bash
thinkies "scout -> critic -> strategist while not_satisfied -> judge" "your query"
```

### Custom Synthesis

```bash
thinkies "scout -> strategist -> synthesize(format=action_plan)" "your query"
thinkies "explorer -> critic -> synthesize(style=executive_summary)" "your query"
```

## Error Handling

The system provides robust error handling:

- **Pipeline Syntax Errors**: Clear parsing error messages with suggestions
- **Agent Execution Failures**: Graceful degradation with partial results
- **Context Corruption**: Validation between stages with recovery options
- **Resource Limits**: Automatic timeout and circuit breaker protection
- **Debug Mode**: Detailed execution traces for troubleshooting

```bash
thinkies --debug "scout -> strategist" "your query"
thinkies --timeout=300 "complex -> pipeline" "your query"
```

## Performance Optimization

- **Caching**: Common pipeline patterns cache intermediate results
- **Parallel Execution**: True parallelism for branched agents  
- **Resource Management**: Intelligent memory and compute allocation
- **Pipeline Optimization**: Automatically optimize common patterns

## Why Use Cognitive Sequences?

### Single Agent Limitations

- One perspective, potential blind spots
- Fixed thinking style may not fit the problem
- Limited depth of analysis

### Cognitive Sequence Advantages

- **Multi-perspective Analysis**: Different agents bring different strengths
- **Iterative Refinement**: Each stage builds on and improves previous work
- **Specialized Expertise**: Right thinking style for each stage of the problem
- **Balanced Outcomes**: Multiple viewpoints prevent tunnel vision
- **Scalable Complexity**: Handle increasingly sophisticated problems

## Best Practices

### Choose Complementary Agents

Pair agents that enhance each other:

- `scout -> strategist` (exploration + planning)
- `lateral-thinker -> judge` (creativity + evaluation)  
- `optimist | pessimist -> synthesizer` (balanced perspectives)

### Start Simple

Begin with 2-3 agent chains before building complex pipelines:

```bash
# Good starting point
thinkies "scout -> strategist" "your query"

# Then expand
thinkies "scout -> (lateral-thinker | strategist) -> judge" "your query"
```

### Use Branching Strategically

- Exploratory phases: multiple perspectives
- Decision points: competing approaches
- Validation: different evaluation criteria

### End with Synthesis

Most pipelines benefit from explicit synthesis:

```bash
thinkies "your -> pipeline -> synthesizer" "your query"
```

## Integration with Other Commands

Cognitive sequences work seamlessly with other INDRA commands:

```bash
# Use sequence output in other commands
thinkies "scout -> strategist" "market analysis" | mind-map --style=strategic

# Chain sequences for mega-analysis  
thinkies "scout -> critic" "problem analysis" > context.txt
thinkies "strategist -> judge" "$(cat context.txt)" "final decision"
```

The `thinkies` command transforms how you approach complex problems, turning individual agent capabilities into orchestrated intelligence that can tackle challenges no single perspective could handle alone.

As the command, I will take the problem you give me in $ARGUMENTS and break it down into a series of cognitive steps, each handled by a specialized agent. The output will be a comprehensive synthesis of insights from all stages of the reasoning process. I'll then get back to you with what they found.
