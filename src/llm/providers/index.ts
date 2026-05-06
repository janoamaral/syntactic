import type { LlmProvider } from '../provider'
import { ollamaProvider } from './ollamaProvider'

function buildUnavailableProvider(name: string): LlmProvider {
  return {
    id: name as LlmProvider['id'],
    async startConversation() {
      throw new Error(`${name} provider is not implemented yet. Use Ollama for now.`)
    },
    async evaluateUserTurn() {
      throw new Error(`${name} provider is not implemented yet. Use Ollama for now.`)
    },
  }
}

const providerRegistry: Record<string, LlmProvider> = {
  ollama: ollamaProvider,
  openai: buildUnavailableProvider('openai'),
  google: buildUnavailableProvider('google'),
  anthropic: buildUnavailableProvider('anthropic'),
  qwen: buildUnavailableProvider('qwen'),
}

export function getProvider(providerId: string): LlmProvider {
  return providerRegistry[providerId] ?? ollamaProvider
}
