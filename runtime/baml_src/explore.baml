// The one genuine inference of the skeleton: @explore's welcome turn.
// WelcomeResult declares `reasoning` FIRST (D8) so the model emits chain-of-thought
// tokens before committing the typed `message`, mitigating format-restriction
// reasoning degradation. {{ ctx.output_format }} replaces hand-written format
// instructions (D4); the typed return replaces SOP_02 free-text result capture.
class WelcomeResult {
  reasoning string
  message string
}

function WelcomeExplorer(user_input: string) -> WelcomeResult {
  client AnthropicClient
  prompt #"
    {{ ExplorerPersona() }}

    {{ _.role("user") }}
    The user wants to explore the following. Welcome them and invite them to
    explore it together.

    User input:
    {{ user_input }}

    {{ ctx.output_format }}
  "#
}
