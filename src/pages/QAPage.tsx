import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Send, Loader2, FileText, Anchor } from 'lucide-react'
import { askQuestion, type RAGResponse } from '@/services/ragService'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: RAGResponse['sources']
  chunksRetrieved?: number
}

export function QAPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')

    const updatedMessages: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(updatedMessages)
    setLoading(true)

    // Build conversation history for the API (last 6 messages max)
    const history = updatedMessages.slice(-6).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    try {
      const result = await askQuestion({ question, conversation_history: history })
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          chunksRetrieved: result.chunks_retrieved,
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to get answer. Make sure the API server is running (python python_functions/api.py).'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expert Q&A</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about offshore wind insurance — answers backed by expert conversations
          </p>
        </div>
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Anchor className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
              Ask anything about offshore wind insurance
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
              Try questions like "Was ist eine Serial Loss Clause?" or "What claims were discussed for Baltic 1?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              {msg.role === 'user' ? (
                <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">
                  {msg.content}
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-4">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Sources ({msg.chunksRetrieved} chunks retrieved)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, j) => (
                            <Badge key={j} variant="secondary" className="gap-1 text-xs font-normal">
                              <FileText className="h-3 w-3" />
                              {src.file}
                              {src.wind_farms.length > 0 && (
                                <span className="text-muted-foreground">
                                  — {src.wind_farms.join(', ')}
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <Card className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Searching knowledge base...</span>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about offshore wind insurance..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
