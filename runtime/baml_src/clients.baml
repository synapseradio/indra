// The single inference provider for this pass: Anthropic Claude.
// The real call only fires at task 5.2 (deferred); offline-core tests
// substitute a stub Inference Layer and never reach this client.
// The model id is verified against the live API at 5.2.
client<llm> AnthropicClient {
  provider anthropic
  options {
    model "claude-opus-4-8"
    api_key env.ANTHROPIC_API_KEY
  }
}
