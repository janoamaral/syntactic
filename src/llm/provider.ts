import type {
  AppSettings,
  ConversationContext,
  ConversationTurn,
  FeedbackAnalysis,
  ProviderType,
} from '../types/domain'

export interface LlmEvaluationResult {
  assistantReply: string
  analysis: FeedbackAnalysis
}

export interface LlmProvider {
  readonly id: ProviderType
  startConversation(context: ConversationContext, settings: AppSettings): Promise<string>
  evaluateUserTurn(args: {
    context: ConversationContext
    settings: AppSettings
    turns: ConversationTurn[]
    userMessage: string
  }): Promise<LlmEvaluationResult>
}
