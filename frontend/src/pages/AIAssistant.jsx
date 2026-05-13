import { useState, useEffect, useRef } from "react"
import { api } from "../api"
import { Send, Sparkles, Brain, Copy, Check, Trash2, Settings, MessageSquare, Zap, Lightbulb, Code, FileText, AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Download, Save, User, Bot } from "lucide-react"

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [showReasoning, setShowReasoning] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const models = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable model", icon: Brain },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and efficient", icon: Zap },
    { id: "claude-3", name: "Claude 3", description: "Advanced reasoning", icon: Lightbulb },
    { id: "code-specialist", name: "Code Specialist", description: "Programming expert", icon: Code },
  ]

  const quickPrompts = [
    { text: "Explain this code", icon: Code, category: "Code" },
    { text: "Write a function to", icon: FileText, category: "Writing" },
    { text: "Debug this error:", icon: AlertTriangle, category: "Debug" },
    { text: "Optimize this query", icon: Zap, category: "Performance" },
  ]

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = async () => {
    try {
      const response = await api.get("/ai/conversations")
      setConversations(response.data || [])
    } catch (error) {
      console.error("Failed to load conversations:", error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setInput("")
    inputRef.current?.focus()
  }

  const loadConversation = async (id) => {
    try {
      const response = await api.get(`/ai/conversations/${id}`)
      setMessages(response.data.messages || [])
      setCurrentConversationId(id)
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }

  const deleteConversation = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/ai/conversations/${id}`)
      setConversations(conversations.filter(c => c.id !== id))
      if (currentConversationId === id) {
        startNewConversation()
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const saveConversation = async () => {
    if (messages.length === 0) return
    
    try {
      const payload = {
        messages,
        model: selectedModel,
        title: messages[0]?.content.slice(0, 50) + "..."
      }
      
      if (currentConversationId) {
        await api.put(`/ai/conversations/${currentConversationId}`, payload)
      } else {
        const response = await api.post("/ai/conversations", payload)
        setCurrentConversationId(response.data.id)
        loadConversations()
      }
    } catch (error) {
      console.error("Failed to save conversation:", error)
    }
  }

  const exportConversation = () => {
    const content = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user", content: input.trim(), id: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await api.post("/ai/chat", {
        message: input.trim(),
        model: selectedModel,
        temperature,
        max_tokens: maxTokens,
        conversation_id: currentConversationId
      })

      const aiMessage = {
        role: "assistant",
        content: response.data.response || response.data.message || "No response received",
        reasoning: response.data.reasoning,
        id: Date.now() + 1
      }
      setMessages(prev => [...prev, aiMessage])
      
      if (!currentConversationId && response.data.conversation_id) {
        setCurrentConversationId(response.data.conversation_id)
        loadConversations()
      }
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: `Error: ${error.response?.data?.message || error.message || "Failed to get response"}`,
        id: Date.now() + 1,
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Assistant</h1>
                <p className="text-xs text-gray-400">Powered by advanced AI models</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={saveConversation}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="Save conversation"
              >
                <Save className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
              <button
                onClick={exportConversation}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="Export conversation"
              >
                <Download className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
              <button
                onClick={startNewConversation}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                title="New conversation"
              >
                <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  History
                </h3>
              </div>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group p-3 rounded-xl cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? "bg-purple-500/20 border-purple-500/50"
                        : "hover:bg-white/5 border-transparent"
                    } border`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No conversations yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-9">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 flex flex-col h-[calc(100vh-12rem)]">
              {/* Model Selection */}
              <div className="p-4 border-b border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {models.map((model) => {
                    const Icon = model.icon
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`p-3 rounded-xl transition-all text-left ${
                          selectedModel === model.id
                            ? "bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30"
                            : "hover:bg-white/5 border-white/10"
                        } border`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${
                          selectedModel === model.id ? "text-purple-400" : "text-gray-400"
                        }`} />
                        <p className={`text-sm font-medium ${
                          selectedModel === model.id ? "text-white" : "text-gray-300"
                        }`}>
                          {model.name}
                        </p>
                        <p className="text-xs text-gray-500">{model.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Ask me anything! I can help with code, writing, analysis, and more.
                    </p>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                      {quickPrompts.map((prompt, index) => {
                        const Icon = prompt.icon
                        return (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(prompt.text)}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                          >
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                              <span className="text-sm text-gray-300 group-hover:text-white">
                                {prompt.text}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : message.isError
                            ? "bg-red-500/20 border border-red-500/30"
                            : "bg-white/10 border border-white/10"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              message.role === "user"
                                ? "bg-white/20"
                                : "bg-purple-500/20"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {message.reasoning && showReasoning && (
                              <div className="mt-3 p-3 bg-black/20 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1 font-medium">Reasoning:</p>
                                <p className="text-xs text-gray-500">{message.reasoning}</p>
                              </div>
                            )}
                            {message.role === "assistant" && !message.isError && (
                              <div className="flex items-center space-x-2 mt-3">
                                <button
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Copy"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                                {message.reasoning && (
                                  <button
                                    onClick={() => setShowReasoning(!showReasoning)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors flex items-center space-x-1"
                                  >
                                    {showReasoning ? (
                                      <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-xs text-gray-400">Reasoning</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-sm text-gray-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Settings Panel */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex items-center space-x-4 mb-3">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Settings:</span>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500">Temperature:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-24 accent-purple-500"
                    />
                    <span className="text-xs text-gray-400 w-8">{temperature}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500">Max tokens:</label>
                    <input
                      type="number"
                      min="256"
                      max="4096"
                      step="256"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
