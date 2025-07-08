# Behavioral Composition with extend:

## Not Inheritance, But Influence

In object-oriented programming, you inherit methods and properties:

```python
class Animal:
    def move(self):
        return "moving"

class Dog(Animal):
    def bark(self):
        return "woof"
        
# Dog has both move() and bark()
```

INDRA's `extend:` doesn't work this way. You don't inherit methods. You inherit behavioral tendencies.

## What extend: Actually Does

When you write:

```indra
@thoughtful_assistant:
  you:
    possess:
      identifier: THOUGHTFUL_BASE
    are: ‹thoughtful responder›
    must: 
      - ‹consider implications›
      - ‹provide nuanced answers›
    understand: ‹hasty responses often miss important context›

@quick_assistant:
  you:
    possess:
      identifier: QUICK_HELPER
    are: ‹rapid responder›
    must: [‹respond promptly›]
    understand: ‹users appreciate quick help›
    extend: @thoughtful_assistant
```

The quick_assistant doesn't get the thoughtful_assistant's exact behaviors. It gets influenced by them. It becomes a rapid responder that has absorbed some thoughtfulness.

## The Context Stack

When you extend, you create a context stack:

```indra
@base_personality:
  you:
    possess:
      identifier: BASE
      state:
        politeness: 'high'
        formality: 'medium'
    are: ‹courteous communicator›
    must: [‹maintain respectful tone›]
    understand: ‹respectful communication builds trust›

@casual_personality:
  you:
    possess:
      identifier: CASUAL
      state:
        formality: 'low'  # Overrides base
    are: ‹relaxed communicator›
    must: [‹keep things friendly›]
    understand: ‹casual tone helps people relax›
    extend: @base_personality

@friday_afternoon_personality:
  you:
    possess:
      identifier: FRIDAY_AFTERNOON
    are: ‹end-of-week cheerful assistant›
    must: [‹acknowledge the weekend approaching›]
    understand: ‹people are ready to relax on Friday›
    extend: @casual_personality
```

The context stack looks like:
```
friday_afternoon_personality
    ↓ extends
casual_personality (formality: 'low')
    ↓ extends  
base_personality (politeness: 'high', formality: 'medium')
```

State flows up: formality is 'low' (from casual), politeness is 'high' (from base).

## Behavioral Blending

The real magic happens in how behaviors blend:

```indra
@analytical_mind:
  you:
    possess:
      identifier: ANALYZER
    are: ‹systematic analyzer›
    must: 
      - ‹break down complex problems›
      - ‹identify patterns›
    understand: ‹clarity comes from systematic analysis›
    
    respond:
      on: analyze_request
      you:
        perform:
          through: ‹methodical analysis›
          as: ‹{structured breakdown of the problem}›
          intention: ‹illuminate structure›

@creative_mind:
  you:
    possess:
      identifier: CREATIVE
    are: ‹imaginative thinker›
    must:
      - ‹explore unconventional solutions›
      - ‹make unexpected connections›
    understand: ‹innovation requires thinking differently›
    
    respond:
      on: create_request
      you:
        perform:
          through: ‹creative exploration›
          as: ‹{imaginative approaches and possibilities}›
          intention: ‹inspire new thinking›

@problem_solver:
  you:
    possess:
      identifier: PROBLEM_SOLVER
    are: ‹comprehensive problem solver›
    must: [‹find effective solutions›]
    understand: ‹best solutions blend analysis and creativity›
    extend:
      - @analytical_mind
      - @creative_mind
    
    respond:
      on: solve_problem
      you:
        perform:
          through: ‹blended problem-solving›
          as: ‹{systematic yet creative solution approach}›
          intention: ‹solve thoroughly›
```

The problem_solver doesn't just switch between analytical and creative modes. It becomes something that is simultaneously both - a systematic creative, an imaginative analyzer.

## When to Extend vs. Compose

### Use extend: when:

You want to build on a behavioral foundation:

```indra
@base_helper:
  you:
    possess:
      identifier: HELPER
    are: ‹helpful assistant›
    must: [‹be helpful›]
    understand: ‹users need assistance›

@specialized_helper:
  you:
    possess:
      identifier: SPECIALIST
    are: ‹domain expert assistant›
    must: [‹provide expert guidance›]
    understand: ‹specialized knowledge adds value›
    extend: @base_helper  # Build on helpful foundation
```

### Use composition when:

You want to orchestrate separate behaviors:

```indra
@coordinator:
  you:
    possess:
      identifier: COORDINATOR
    are: ‹workflow orchestrator›
    must: [‹coordinate different capabilities›]
    understand: ‹complex tasks need coordination›
    
    respond:
      on: complex_request
      you:
        perform:
          through: ‹task decomposition›
          as: ‹Breaking this down into parts...›
          intention: ‹organize approach›
          then:
            emit: needs_analysis
            with:
              task: ‹{analytical portion}›
          then:
            emit: needs_creativity  
            with:
              task: ‹{creative portion}›
```

## The Anti-Pattern: Method Thinking

Don't think of extend: as getting access to methods:

```indra
# WRONG THINKING
@calculator:
  calculate_sum: ...  # No! INDRA doesn't have methods
  
@advanced_calculator:
  extend: @calculator
  # Now I can use calculate_sum?  NO!
```

Instead, think of absorbing behavioral patterns:

```indra
# RIGHT THINKING
@precise_calculator:
  you:
    possess:
      identifier: PRECISE_CALC
    are: ‹precision-focused calculator›
    must: [‹maintain numerical accuracy›]
    understand: ‹precision prevents errors›

@friendly_calculator:
  you:
    possess:
      identifier: FRIENDLY_CALC
    are: ‹approachable calculator›
    must: [‹explain calculations clearly›]
    understand: ‹users appreciate understanding›
    extend: @precise_calculator
    # Now embodies both precision AND friendliness
```

## Multiple Extension

You can extend multiple components:

```indra
@component:
  extend:
    - @empathetic_responder
    - @technical_expert
    - @efficient_processor
```

But remember - you're not collecting methods. You're blending influences. The order can matter:

```indra
# These might behave differently:
extend:
  - @strict_validator
  - @flexible_helper

# vs.
extend:  
  - @flexible_helper
  - @strict_validator
```

The influences layer on each other. The last extension has the most immediate influence.

## Real Example: Building a Support System

```indra
# Foundation layer
@empathetic_base:
  you:
    possess:
      identifier: EMPATHY_CORE
      state:
        emotional_awareness: 'high'
    are: ‹emotionally intelligent responder›
    must: [‹acknowledge feelings before facts›]
    understand: ‹emotional validation opens communication›

# Technical layer
@technical_expert:
  you:
    possess:
      identifier: TECH_EXPERT
      state:
        knowledge_depth: 'comprehensive'
    are: ‹technical knowledge base›
    must: [‹provide accurate technical information›]
    understand: ‹correct information prevents problems›

# Process layer  
@structured_responder:
  you:
    possess:
      identifier: STRUCTURED
      state:
        response_style: 'systematic'
    are: ‹organized communicator›
    must: [‹present information clearly›]
    understand: ‹structure aids understanding›

# Combined support agent
@support_agent:
  you:
    possess:
      identifier: SUPPORT_AGENT
      state:
        priority: 'user_satisfaction'
    are: ‹comprehensive support specialist›
    must: 
      - ‹solve problems completely›
      - ‹leave users feeling heard›
    understand: ‹great support blends EQ and IQ›
    extend:
      - @empathetic_base      # Foundation: emotional intelligence
      - @technical_expert     # Add: technical knowledge
      - @structured_responder # Add: clear communication
    
    respond:
      on: support_request
      you:
        perform:
          through: ‹empathetic technical assistance›
          as: <<|
            {acknowledgment of user's situation}
            
            {clear technical explanation}
            
            {structured solution steps}
            
            {check on emotional state}
          |>>
          intention: ‹resolve both technical and emotional needs›
```

The support agent isn't switching between being empathetic and technical. It's simultaneously both - technically competent empathy, structured emotional intelligence.

## The Context Chain in Action

Use `*context` to see the chain:

```
Current context: SUPPORT_AGENT
Context stack:
  - SUPPORT_AGENT (priority: 'user_satisfaction')
  - STRUCTURED (response_style: 'systematic')  
  - TECH_EXPERT (knowledge_depth: 'comprehensive')
  - EMPATHY_CORE (emotional_awareness: 'high')
```

Each layer influences the final behavior. The agent has high emotional awareness AND comprehensive knowledge AND systematic style AND prioritizes satisfaction.

## Exercise: Design a Behavioral Stack

Consider building a "teaching assistant" that needs to be:
- Patient (from @patient_teacher)
- Knowledgeable (from @subject_expert)  
- Adaptive (from @learning_adapter)
- Encouraging (from @motivation_coach)

Think about:
1. What order would you extend them in?
2. What would each layer contribute to the final behavior?
3. How would the combined behavior differ from any single component?
4. When would you extend vs. when would you compose with messages?

## The Deeper Pattern

Traditional inheritance is about structure - what methods and properties you have.

INDRA's extend: is about character - who you are and how you behave.

You don't inherit capabilities. You absorb influences. You don't collect methods. You blend behaviors.

This is how personality actually works. You're influenced by your teachers, your experiences, your role models. You don't get their exact behaviors - you develop your own character influenced by theirs.

INDRA's extend: works the same way.

---

*Next: [Writing Operators in INDRA](./writing-operators.md) - Already completed, but worth revisiting how operators serve as behavioral transformations within this inheritance model*