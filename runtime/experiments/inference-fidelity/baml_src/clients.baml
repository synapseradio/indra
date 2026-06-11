// The two contestant families and the one judge.
//
// Family one is Anthropic, matching the runtime's own client. Family two is
// DeepSeek, called directly through its OpenAI-compatible endpoint. The judge
// is a Gemini model reached through OpenRouter, deliberately from neither
// contestant family, so the rating has no home-team bias.

// Haiku rather than Opus: the experiment compares port styles across
// families, not flagship quality, and the fast tiers are the realistic
// per-`<...>` workhorses anyway.
client<llm> ClaudeContestant {
  provider anthropic
  options {
    model "claude-haiku-4-5-20251001"
    api_key env.ANTHROPIC_API_KEY
  }
}

client<llm> DeepSeekContestant {
  provider openai-generic
  options {
    base_url "https://api.deepseek.com"
    model "deepseek-chat"
    api_key env.DEEPSEEK_API_KEY
  }
}

client<llm> GeminiJudge {
  provider openai-generic
  options {
    base_url "https://openrouter.ai/api/v1"
    model "google/gemini-3.5-flash"
    api_key env.OPENROUTER_API_KEY
  }
}
