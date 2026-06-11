// The blind judge. It sees only the person's original words and one rendered
// output — never the model name, the port style, or the other contestants.
// Conditions are distinguishable to the harness alone, through anonymous ids
// assigned after a seeded shuffle.

class SynthesisRating {
  reasoning string @description(#"
    Brief notes on what the response does well and where it falls short,
    written before committing to scores.
  "#)
  fidelity int @description(#"
    1-7: does the response engage the person's actual words, constraints, and
    feelings, or a generic version of their situation?
  "#)
  naturalness int @description(#"
    1-7: does it read as one coherent piece of human thinking, with each part
    building on the last — or as disconnected fragments filled into slots?
  "#)
  completeness int @description(#"
    1-7: is everything the person raised accounted for, with nothing
    important dropped or invented?
  "#)
  overall int @description(#"
    1-7: overall synthesis quality, all things considered.
  "#)
}

function RateSynthesis(persons_words: string, response: string) -> SynthesisRating {
  client GeminiJudge
  prompt #"
    {{ _.role("system") }}
    You rate the quality of written responses. You are exacting but fair: a 7
    is rare and earned, a 4 is honest middling work, and you never inflate.

    {{ _.role("user") }}
    A person said, in their own words:

    "{{ persons_words }}"

    A response was written to carry their request forward:

    ---
    {{ response }}
    ---

    Rate the response.

    {{ ctx.output_format }}
  "#
}
