import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AIAssistant() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('z-ai/glm-5.1')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    try {
      const data = await api.getModels()
      setModels(data.models)
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setResponse('')
    setReasoning('')
    
    try {
      const result = await api.chatWithAI({
        model: selectedModel,
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 2048
      })
      setResponse(result.content)
      setReasoning(result.reasoning || '')
    } catch (error) {
      console.error('AI request failed:', error)
      alert('AI request failed. Make sure NVIDIA_API_KEY is configured in the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-800 mb-2 flex items-center">
          <span className="mr-3 text-4xl">🤖</span>
          AI Assistant
        </h1>
        <p className="text-dark-500">Chat with powerful AI models powered by NVIDIA NIM</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 card">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-2">Select AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-field"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-2">Your Message</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field"
                rows="4"
                placeholder="Ask anything... The AI can help with project planning, task breakdown, code review, documentation, and more."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>AI is thinking...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Send to AI</span>
                </>
              )}
            </button>
          </form>

          {/* Response */}
          {(response || reasoning) && (
            <div className="border-t border-dark-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-dark-800 flex items-center">
                  <span className="mr-2">💬</span> AI Response
                </h3>
                {reasoning && (
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {showReasoning ? 'Hide' : 'Show'} Reasoning
                  </button>
                )}
              </div>

              {showReasoning && reasoning && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                    <span className="mr-2">🧠</span> AI Reasoning Process
                  </h4>
                  <p className="text-purple-700 whitespace-pre-wrap text-sm">{reasoning}</p>
                </div>
              )}

              <div className="p-4 bg-dark-50 rounded-lg">
                <p className="text-dark-800 whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Info */}
          <div className="card">
            <h3 className="font-bold text-dark-800 mb-4 flex items-center">
              <span className="mr-2">ℹ️</span> Current Model
            </h3>
            <div className="space-y-3">
              {models.find(m => m.id === selectedModel) && (
                <>
                  <div>
                    <p className="text-sm text-dark-500">Model ID</p>
                    <p className="font-mono text-sm text-dark-800">{selectedModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Name</p>
                    <p className="text-dark-800">{models.find(m => m.id === selectedModel).name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Description</p>
                    <p className="text-dark-800">{models.find(m => m.id === selectedModel).description}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="card">
            <h3 className="font-bold text-dark-800 mb-4 flex items-center">
              <span className="mr-2">⚡</span> Quick Prompts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setPrompt("Help me break down this project into manageable tasks: [Describe your project]")}
                className="w-full text-left p-3 bg-dark-50 hover:bg-dark-100 rounded-lg text-sm transition-colors"
              >
                📋 Break down project into tasks
              </button>
              <button
                onClick={() => setPrompt("What are the best practices for managing a software development project?")}
                className="w-full text-left p-3 bg-dark-50 hover:bg-dark-100 rounded-lg text-sm transition-colors"
              >
                💡 Project management best practices
              </button>
              <button
                onClick={() => setPrompt("Help me write a project proposal for [your project idea]")}
                className="w-full text-left p-3 bg-dark-50 hover:bg-dark-100 rounded-lg text-sm transition-colors"
              >
                📝 Write a project proposal
              </button>
              <button
                onClick={() => setPrompt("What are the potential risks in this project and how can I mitigate them?")}
                className="w-full text-left p-3 bg-dark-50 hover:bg-dark-100 rounded-lg text-sm transition-colors"
              >
                ⚠️ Identify project risks
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <h3 className="font-bold mb-4 flex items-center">
              <span className="mr-2">✨</span> Powered by NVIDIA NIM
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Advanced reasoning with thinking process</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Multiple state-of-the-art AI models</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Context-aware responses</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Real-time streaming responses</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
