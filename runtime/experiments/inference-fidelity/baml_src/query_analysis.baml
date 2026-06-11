// Port of lib/prism/query_analysis.in — the multi-splice adversarial case.
//
// The source's `understand_query` operator is ONE prose template with THREE
// `<...>` inferences spliced into it: a core-request sentence, a list of key
// points, and an actionable outcome phrase. Per the D9 recipe, the three
// splices are absorbed into one class and the template itself stays in the
// composition layer (the runner renders it deterministically from the typed
// fields). The `until:` confirmation loop is deterministic choreography and is
// not part of the inference under test.
//
// Two port styles, identical prompt, differing only in the output class:
// bare-typed (just the slots) versus reasoning-field-first (D8).

class QueryBreakdownBare {
  core_request string @description(#"
    The person's core request, summarized in one clear, concise sentence.
  "#)
  key_points string[] @description(#"
    The key aspects, constraints, or goals from the person's request, as
    distinct, cumulative or corollary points.
  "#)
  desired_outcome string @description(#"
    The person's desired outcome, summarized as an actionable phrase.
  "#)
}

class QueryBreakdownReasoned {
  reasoning string @description(#"
    Think out loud first: what is this person actually asking for, what
    matters to them, and what would success look like? Free form.
  "#)
  core_request string @description(#"
    The person's core request, summarized in one clear, concise sentence.
  "#)
  key_points string[] @description(#"
    The key aspects, constraints, or goals from the person's request, as
    distinct, cumulative or corollary points.
  "#)
  desired_outcome string @description(#"
    The person's desired outcome, summarized as an actionable phrase.
  "#)
}

template_string QueryAnalystPrompt(user_query: string) #"
  {{ _.role("system") }}
  You specialize in understanding and clarifying user requests.

  Your rules:
  - You present your understanding clearly for confirmation.
  - You engage with what the person actually said, not a generic version of it.

  You understand that a shared understanding is the foundation for effective
  reasoning.

  {{ _.role("user") }}
  A person has just told you what they need, in their own words:

  "{{ user_query }}"

  Make sure you understand this correctly.

  {{ ctx.output_format }}
"#

function QaBareClaude(user_query: string) -> QueryBreakdownBare {
  client ClaudeContestant
  prompt #"{{ QueryAnalystPrompt(user_query) }}"#
}

function QaReasonedClaude(user_query: string) -> QueryBreakdownReasoned {
  client ClaudeContestant
  prompt #"{{ QueryAnalystPrompt(user_query) }}"#
}

function QaBareDeepseek(user_query: string) -> QueryBreakdownBare {
  client DeepSeekContestant
  prompt #"{{ QueryAnalystPrompt(user_query) }}"#
}

function QaReasonedDeepseek(user_query: string) -> QueryBreakdownReasoned {
  client DeepSeekContestant
  prompt #"{{ QueryAnalystPrompt(user_query) }}"#
}
