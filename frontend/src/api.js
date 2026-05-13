import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

export const api = {
  // Projects
  async getProjects() {
    const response = await fetch(`${API_URL}/projects`)
    if (!response.ok) throw new Error('Failed to fetch projects')
    return response.json()
  },

  async createProject(project) {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    if (!response.ok) throw new Error('Failed to create project')
    return response.json()
  },

  async getProject(id) {
    const response = await fetch(`${API_URL}/projects/${id}`)
    if (!response.ok) throw new Error('Failed to fetch project')
    return response.json()
  },

  async updateProject(id, data) {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update project')
    return response.json()
  },

  async deleteProject(id) {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete project')
    return response.json()
  },

  // Tasks
  async getTasks(projectId) {
    const response = await fetch(`${API_URL}/projects/${projectId}/tasks`)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  async createTask(task) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  async updateTask(id, data) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  async deleteTask(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete task')
    return response.json()
  },

  // AI
  async getModels() {
    const response = await fetch(`${API_URL}/ai/models`)
    if (!response.ok) throw new Error('Failed to fetch models')
    return response.json()
  },

  async chatWithAI(request) {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('AI request failed')
    return response.json()
  },

  async getTaskSuggestions(projectId, request) {
    const response = await fetch(`${API_URL}/ai/task-suggestions?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('Failed to get suggestions')
    return response.json()
  },

  async getProjectSummary(projectId, request) {
    const response = await fetch(`${API_URL}/ai/project-summary?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('Failed to get summary')
    return response.json()
  },
}

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await api.getProjects()
      setProjects(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addProject(project) {
    const newProject = await api.createProject(project)
    setProjects([...projects, newProject])
    return newProject
  }

  async function removeProject(id) {
    await api.deleteProject(id)
    setProjects(projects.filter(p => p.id !== id))
  }

  return { projects, loading, error, loadProjects, addProject, removeProject }
}

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (projectId) {
      loadTasks()
    }
  }, [projectId])

  async function loadTasks() {
    try {
      const data = await api.getTasks(projectId)
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addTask(task) {
    const newTask = await api.createTask(task)
    setTasks([...tasks, newTask])
    return newTask
  }

  async function updateTaskStatus(id, status) {
    const updatedTask = await api.updateTask(id, { status })
    setTasks(tasks.map(t => t.id === id ? updatedTask : t))
    return updatedTask
  }

  async function removeTask(id) {
    await api.deleteTask(id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  return { tasks, loading, error, loadTasks, addTask, updateTaskStatus, removeTask }
}
