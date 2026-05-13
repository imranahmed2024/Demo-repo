import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo' })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const [projectData, tasksData] = await Promise.all([
        api.getProject(id),
        api.getTasks(id)
      ])
      setProject(projectData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault()
    try {
      await api.createTask({ ...newTask, project_id: id })
      setShowTaskModal(false)
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' })
      loadData()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task')
    }
  }

  async function updateTaskStatus(taskId, status) {
    try {
      await api.updateTask(taskId, { status })
      loadData()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  async function generateAISummary() {
    setAiLoading(true)
    try {
      const response = await api.getProjectSummary(id, {
        model: 'z-ai/glm-5.1',
        prompt: 'Generate a comprehensive project summary with insights and recommendations.',
        temperature: 0.7
      })
      setAiSummary(response.summary)
    } catch (error) {
      console.error('Failed to get AI summary:', error)
      alert('Failed to generate AI summary. Make sure NVIDIA_API_KEY is configured.')
    } finally {
      setAiLoading(false)
    }
  }

  async function getAITaskSuggestions() {
    setAiLoading(true)
    try {
      const response = await api.getTaskSuggestions(id, {
        model: 'z-ai/glm-5.1',
        prompt: 'Suggest additional tasks for this project based on the current state.',
        temperature: 0.7
      })
      alert(response.suggestions)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      alert('Failed to get AI suggestions')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <a href="/projects" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">← Back to Projects</a>
        <h1 className="text-3xl font-bold text-dark-800 mb-2">{project.name}</h1>
        <p className="text-dark-500">{project.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-dark-500 text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-dark-800">{taskStats.total}</p>
        </div>
        <div className="card text-center bg-yellow-50">
          <p className="text-yellow-700 text-sm">To Do</p>
          <p className="text-2xl font-bold text-yellow-800">{taskStats.todo}</p>
        </div>
        <div className="card text-center bg-blue-50">
          <p className="text-blue-700 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-800">{taskStats.inProgress}</p>
        </div>
        <div className="card text-center bg-green-50">
          <p className="text-green-700 text-sm">Done</p>
          <p className="text-2xl font-bold text-green-800">{taskStats.done}</p>
        </div>
      </div>

      {/* AI Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center">
          <span className="mr-2">🤖</span> AI Assistant
        </h2>
        <div className="flex space-x-4">
          <button 
            onClick={generateAISummary} 
            disabled={aiLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <span>📊</span>
            <span>{aiLoading ? 'Generating...' : 'Generate Summary'}</span>
          </button>
          <button 
            onClick={getAITaskSuggestions} 
            disabled={aiLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>💡</span>
            <span>{aiLoading ? 'Thinking...' : 'Get Task Suggestions'}</span>
          </button>
        </div>
        {aiSummary && (
          <div className="mt-4 p-4 bg-dark-50 rounded-lg">
            <h3 className="font-semibold text-dark-800 mb-2">AI Summary:</h3>
            <p className="text-dark-600 whitespace-pre-wrap">{aiSummary}</p>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-800">Tasks</h2>
          <button onClick={() => setShowTaskModal(true)} className="btn-primary">
            + Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-dark-500">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border border-dark-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dark-800">{task.title}</h3>
                  <p className="text-dark-500 text-sm">{task.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      task.status === 'todo' ? 'bg-yellow-100 text-yellow-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">Add Task</button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
