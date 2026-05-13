import { useState } from 'react'
import { useProjects } from '../api'

export default function Dashboard() {
  const { projects, loading, addProject, removeProject } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', owner_id: 'user1' })

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    try {
      await addProject(newProject)
      setShowModal(false)
      setNewProject({ name: '', description: '', owner_id: 'user1' })
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Make sure the backend is running.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-800 mb-2">Dashboard</h1>
        <p className="text-dark-500">Welcome to your AI-powered project management workspace</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Projects</p>
              <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
            </div>
            <div className="text-4xl">📁</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Projects</p>
              <p className="text-3xl font-bold mt-1">{stats.activeProjects}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completedProjects}</p>
            </div>
            <div className="text-4xl">🎉</div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-800">Recent Projects</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <span>+</span>
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-dark-500 mb-4">No projects yet</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-dark-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-dark-800">{project.name}</h3>
                  <button
                    onClick={() => removeProject(project.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-dark-500 text-sm mb-3">{project.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                  <a href={`/projects/${project.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">Create Project</button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
