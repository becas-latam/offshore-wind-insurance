const API_URL = "http://localhost:5050"

export interface RAGSource {
  file: string
  wind_farms: string[]
  date: string | null
  score: number
}

export interface RAGResponse {
  answer: string
  sources: RAGSource[]
  model: string
  chunks_retrieved: number
}

export interface ConversationMessage {
  role: "user" | "assistant"
  content: string
}

export const AVAILABLE_MODELS = [
  { id: "gpt-5-mini", label: "GPT-5 Mini", description: "Fast & cost-efficient" },
  { id: "gpt-5.2", label: "GPT-5.2", description: "Best reasoning" },
] as const

export interface AskParams {
  question: string
  wind_farms?: string[]
  insurance_lines?: string[]
  project_phase?: string
  language?: string
  top_k?: number
  conversation_history?: ConversationMessage[]
  model?: string
  topic_context?: string
}

export async function askQuestion(params: AskParams): Promise<RAGResponse> {
  const response = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to get answer")
  }

  return response.json()
}

export async function updateTopicContext(
  question: string,
  answer: string,
  currentContext: string,
): Promise<string> {
  const response = await fetch(`${API_URL}/api/topics/context-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      answer,
      current_context: currentContext,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to update context")
  }

  const data = await response.json()
  return data.updated_context
}

export async function checkHealth(): Promise<{ status: string; collection: { points_count: number } }> {
  const response = await fetch(`${API_URL}/api/health`)
  return response.json()
}
