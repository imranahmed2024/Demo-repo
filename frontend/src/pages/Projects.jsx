import { useState } from 'react'
import { useProjects } from '../api'

export default function Projects() {
  const { projects, loading, addProject, removeProject } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', owner_id: 'user1' })

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-800 mb-2">Projects</h1>
        <p className="text-dark-500">Manage all your projects in one place</p>
      </div>

      <div className="flex justify-end mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">{project.name[0]}</span>
              </div>
              <button
                onClick={() => removeProject(project.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-dark-800 mb-2">{project.name}</h3>
            <p className="text-dark-500 text-sm mb-4">{project.description || 'No description provided'}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-dark-100">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {project.status}
              </span>
              <a href={`/projects/${project.id}`} className="btn-primary text-sm py-1 px-3">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 card">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-bold text-dark-800 mb-2">No Projects Yet</h3>
          <p className="text-dark-500 mb-6">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Project
          </button>
        </div>
      )}

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
