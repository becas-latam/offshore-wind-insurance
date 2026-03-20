import { useState, useEffect, useRef, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Send,
  Loader2,
  FileText,
  Anchor,
  ChevronDown,
  Plus,
  Trash2,
  PenLine,
  Info,
  Globe,
  Save,
  BookmarkPlus,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  askQuestion,
  researchWeb,
  saveResearchToKB,
  updateTopicContext as updateContextAPI,
  AVAILABLE_MODELS,
  type RAGResponse,
  type WebSource,
} from '@/services/ragService'
import {
  createTopic,
  getTopics,
  updateTopicContext,
  deleteTopic,
  renameTopic,
  addMessage,
  type Topic,
  type TopicMessage,
} from '@/services/topicService'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: RAGResponse['sources']
  chunksRetrieved?: number
  model?: string
  // Web research
  type?: 'kb' | 'web'
  webSources?: WebSource[]
  searchTime?: number
  webSaved?: boolean
}

export function QAPage() {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id)
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicContext, setNewTopicContext] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [researching, setResearching] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) ?? AVAILABLE_MODELS[0]

  // Load topics
  useEffect(() => {
    if (!user) return
    loadTopics()
  }, [user])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadTopics() {
    if (!user) return
    const t = await getTopics(user.uid)
    setTopics(t)
  }

  async function handleCreateTopic(e: FormEvent) {
    e.preventDefault()
    if (!user || !newTopicName.trim()) return

    const id = await createTopic(user.uid, newTopicName.trim(), newTopicContext.trim())
    setNewTopicName('')
    setNewTopicContext('')
    setShowNewTopic(false)
    await loadTopics()

    // Switch to the new topic
    const t = await getTopics(user.uid)
    const created = t.find(topic => topic.id === id)
    if (created) selectTopic(created)
  }

  function selectTopic(topic: Topic) {
    setActiveTopic(topic)
    // Convert stored messages to display messages
    const displayMsgs: DisplayMessage[] = (topic.messages || []).map((m: TopicMessage) => ({
      role: m.role,
      content: m.content,
      sources: m.sources,
      model: m.model,
    }))
    setMessages(displayMsgs)
  }

  async function handleDeleteTopic(topicId: string) {
    if (!user) return
    await deleteTopic(user.uid, topicId)
    if (activeTopic?.id === topicId) {
      setActiveTopic(null)
      setMessages([])
    }
    await loadTopics()
  }

  async function handleRenameTopic(topicId: string) {
    if (!user) return
    const name = prompt('New topic name:')
    if (!name) return
    await renameTopic(user.uid, topicId, name)
    await loadTopics()
    if (activeTopic?.id === topicId) {
      setActiveTopic(prev => prev ? { ...prev, name } : null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || !user || !activeTopic) return

    const question = input.trim()
    setInput('')

    const userMsg: DisplayMessage = { role: 'user', content: question }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    // Save user message to Firestore (don't await — fire and forget)
    addMessage(user.uid, activeTopic.id, { role: 'user', content: question })

    // Build conversation history (only last 4 messages to keep search fast)
    const history = updatedMessages.slice(-4).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    try {
      const result = await askQuestion({
        question,
        conversation_history: history,
        model: selectedModel,
        topic_context: activeTopic.context || '',
      })

      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        chunksRetrieved: result.chunks_retrieved,
        model: result.model,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Save assistant message + update context in background (don't block UI)
      const topicId = activeTopic.id
      const ctx = activeTopic.context || ''

      addMessage(user.uid, topicId, {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        model: result.model,
      })

      updateContextAPI(question, result.answer, ctx)
        .then(updatedContext => {
          updateTopicContext(user.uid, topicId, updatedContext)
          setActiveTopic(prev => prev?.id === topicId ? { ...prev, context: updatedContext } : prev)
        })
        .catch(() => { /* context update is non-critical */ })

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to get answer. Make sure the API server is running.'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleWebResearch(question: string) {
    if (!user || !activeTopic || researching) return

    setResearching(true)

    try {
      const result = await researchWeb(
        question,
        activeTopic.context || '',
      )

      const webMsg: DisplayMessage = {
        role: 'assistant',
        content: result.report,
        type: 'web',
        webSources: result.sources,
        searchTime: result.search_time,
        webSaved: false,
      }
      setMessages(prev => [...prev, webMsg])

      // Save to Firestore
      addMessage(user.uid, activeTopic.id, {
        role: 'assistant',
        content: `[Web Research]\n${result.report}`,
      })
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Web research error: ${err instanceof Error ? err.message : 'Failed'}`,
          type: 'web',
        },
      ])
    } finally {
      setResearching(false)
    }
  }

  async function handleSaveToKB(msgIndex: number) {
    const msg = messages[msgIndex]
    if (!msg || !msg.content) return

    const lastUserMsg = [...messages].slice(0, msgIndex).reverse().find(m => m.role === 'user')

    try {
      await saveResearchToKB(
        msg.content,
        lastUserMsg?.content || '',
        msg.webSources || [],
      )
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, webSaved: true } : m))
    } catch {
      // silent fail
    }
  }

  async function handleSaveToTopicContext(msgIndex: number) {
    if (!user || !activeTopic) return
    const msg = messages[msgIndex]
    if (!msg || !msg.content) return

    const lastUserMsg = [...messages].slice(0, msgIndex).reverse().find(m => m.role === 'user')

    try {
      const updatedContext = await updateContextAPI(
        lastUserMsg?.content || '',
        msg.content,
        activeTopic.context || '',
      )
      await updateTopicContext(user.uid, activeTopic.id, updatedContext)
      setActiveTopic(prev => prev ? { ...prev, context: updatedContext } : null)
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, webSaved: true } : m))
    } catch {
      // silent fail
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="flex w-72 flex-col border-r bg-muted/30">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Topics</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setShowNewTopic(true)}
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>

        {/* New topic form */}
        {showNewTopic && (
          <form onSubmit={handleCreateTopic} className="border-b p-3 space-y-2">
            <Input
              placeholder="Topic name..."
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <textarea
              placeholder="Context (optional) — describe what this topic is about..."
              value={newTopicContext}
              onChange={e => setNewTopicContext(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={!newTopicName.trim()}>
                Create
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => { setShowNewTopic(false); setNewTopicName(''); setNewTopicContext('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Topic list */}
        <div className="flex-1 overflow-y-auto">
          {topics.length === 0 && !showNewTopic && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No topics yet. Create one to get started.
            </div>
          )}
          {topics.map(topic => (
            <div
              key={topic.id}
              className={`group flex items-center gap-2 border-b px-3 py-2.5 cursor-pointer hover:bg-accent/50 ${
                activeTopic?.id === topic.id ? 'bg-accent' : ''
              }`}
              onClick={() => selectTopic(topic)}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{topic.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {topic.messages?.length || 0} messages
                </p>
              </div>
              <div className="hidden group-hover:flex gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); handleRenameTopic(topic.id) }}
                >
                  <PenLine className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id) }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                {activeTopic ? activeTopic.name : 'Expert Q&A'}
              </h1>
              {activeTopic?.context && (
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3 w-3" />
                  {showContext ? 'Hide context' : 'Show context'}
                </button>
              )}
            </div>
          </div>

          {/* Model selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              <span className="font-medium">{currentModel.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {AVAILABLE_MODELS.map(model => (
                <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)}>
                  <div>
                    <div className="font-medium">{model.label}</div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                  {model.id === selectedModel && (
                    <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Context display */}
        {showContext && activeTopic?.context && (
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Topic Context (auto-growing)</p>
            <p className="text-sm whitespace-pre-wrap">{activeTopic.context}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {!activeTopic && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Anchor className="h-12 w-12 text-muted-foreground/30" />
              <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
                Select or create a topic
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
                Create a topic to start a focused research thread about a specific insurance question or wind farm.
              </p>
            </div>
          )}

          {activeTopic && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
                Start asking questions
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
                Ask about {activeTopic.name}. The context will grow with each answer.
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
                ) : msg.type === 'web' ? (
                  /* Web Research Card */
                  <Card className="border-0 shadow-sm border-l-4 border-l-blue-400">
                    <CardContent className="pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600">Web Research</span>
                        {msg.searchTime && (
                          <span className="text-xs text-muted-foreground">{msg.searchTime}s</span>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none text-sm leading-relaxed prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-ul:my-2 prose-ol:my-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.webSources && msg.webSources.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Web Sources ({msg.webSources.length})
                          </p>
                          <div className="space-y-1">
                            {msg.webSources.map((src, j) => (
                              <a
                                key={j}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">{src.title || src.url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {!msg.webSaved && (
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleSaveToKB(i)}
                          >
                            <Save className="h-3 w-3" /> Save to KB
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleSaveToTopicContext(i)}
                          >
                            <BookmarkPlus className="h-3 w-3" /> Save to Topic
                          </Button>
                        </div>
                      )}
                      {msg.webSaved && (
                        <p className="mt-3 text-xs text-green-600 border-t pt-2">Saved</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  /* KB Answer Card */
                  <div>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-4">
                        <div className="prose prose-sm max-w-none text-sm leading-relaxed prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-ul:my-2 prose-ol:my-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-medium text-muted-foreground">
                                Sources ({msg.chunksRetrieved} chunks)
                              </p>
                              {msg.model && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {msg.model}
                                </Badge>
                              )}
                            </div>
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
                        {/* Research Online button — show when answer seems weak */}
                        {msg.content && !msg.content.startsWith('Error') && (
                          <div className="mt-3 border-t pt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                              disabled={researching}
                              onClick={() => {
                                const lastQ = [...messages].slice(0, i).reverse().find(m => m.role === 'user')
                                if (lastQ) handleWebResearch(lastQ.content)
                              }}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {researching ? 'Researching...' : 'Research Online'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
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
          {researching && (
            <div className="flex justify-start">
              <Card className="border-0 shadow-sm border-l-4 border-l-blue-400">
                <CardContent className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">Researching online...</span>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={activeTopic ? `Ask about ${activeTopic.name}...` : 'Select a topic first...'}
              disabled={loading || !activeTopic}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim() || !activeTopic} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
