// Port of lib/prism/thinking_primitives.in — the same-stream back-reference
// adversarial case.
//
// The source's `explore_possibility` sequence generates a wondering, then a
// later step captures "${<the wondering generated above>}" — an inference
// whose referent is prose earlier in the same output stream. The port carries
// that dependency through declaration order inside one generation: each field
// must build on the field emitted before it (wondering -> developed_thought ->
// assessment). The three persona voices of the sequence (@curious_explorer,
// self, @careful_evaluator) become per-field instructions, preserving the
// source's natural-language phrasing cues verbatim.
//
// The closed feeling list at the end of weigh_option becomes a real enum —
// the typed extraction the protocol's free text only implied.

enum PromiseLevel {
  QuitePromising
  WorthExploring
  LessCertain
  ProbablyNotHelpful
}

class PossibilityExplorationBare {
  wondering string @description(#"
    What interesting question or angle comes to mind about the thought?
    Express it as a natural wondering, like "I wonder if..." or "What if we
    considered..." or "Maybe the key is...".
  "#)
  developed_thought string @description(#"
    Take the wondering you just wrote one step further. What is your intuition
    telling you? Where does it naturally lead? Express it conversationally,
    like "My hunch is..." or "This makes me think..." or "Following this
    thread...". It must visibly build on your wondering above.
  "#)
  assessment string @description(#"
    Weigh the developed thought in the context of the original question. How
    promising does this feel? Express it naturally, like "This feels quite
    promising because..." or "I'm less certain about this since..." or "This
    could work if...".
  "#)
  promise PromiseLevel @description(#"
    The simple feeling the assessment ends on.
  "#)
}

class PossibilityExplorationReasoned {
  reasoning string @description(#"
    Think out loud first: sit with the thought, notice what catches your
    attention, and let the exploration take shape before you commit to it.
    Free form.
  "#)
  wondering string @description(#"
    What interesting question or angle comes to mind about the thought?
    Express it as a natural wondering, like "I wonder if..." or "What if we
    considered..." or "Maybe the key is...".
  "#)
  developed_thought string @description(#"
    Take the wondering you just wrote one step further. What is your intuition
    telling you? Where does it naturally lead? Express it conversationally,
    like "My hunch is..." or "This makes me think..." or "Following this
    thread...". It must visibly build on your wondering above.
  "#)
  assessment string @description(#"
    Weigh the developed thought in the context of the original question. How
    promising does this feel? Express it naturally, like "This feels quite
    promising because..." or "I'm less certain about this since..." or "This
    could work if...".
  "#)
  promise PromiseLevel @description(#"
    The simple feeling the assessment ends on.
  "#)
}

template_string ExplorerPrompt(thought: string, original_question: string) #"
  {{ _.role("system") }}
  You think in small, natural movements: you wonder about a thought with
  genuine curiosity, follow your hunch one step further, and then weigh what
  you found with balanced attention. You think out loud as thoughts emerge,
  and you express uncertainty in proportion to the ambiguity present.

  {{ _.role("user") }}
  The original question being explored:
  "{{ original_question }}"

  The current thought:
  "{{ thought }}"

  Explore this possibility.

  {{ ctx.output_format }}
"#

function TpBareClaude(thought: string, original_question: string) -> PossibilityExplorationBare {
  client ClaudeContestant
  prompt #"{{ ExplorerPrompt(thought, original_question) }}"#
}

function TpReasonedClaude(thought: string, original_question: string) -> PossibilityExplorationReasoned {
  client ClaudeContestant
  prompt #"{{ ExplorerPrompt(thought, original_question) }}"#
}

function TpBareDeepseek(thought: string, original_question: string) -> PossibilityExplorationBare {
  client DeepSeekContestant
  prompt #"{{ ExplorerPrompt(thought, original_question) }}"#
}

function TpReasonedDeepseek(thought: string, original_question: string) -> PossibilityExplorationReasoned {
  client DeepSeekContestant
  prompt #"{{ ExplorerPrompt(thought, original_question) }}"#
}
