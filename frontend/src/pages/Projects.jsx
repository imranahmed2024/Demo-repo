import { useState } from 'react'
import { useProjects } from '../api'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Grid3X3, List, Search, Filter, MoreVertical, ExternalLink } from 'lucide-react'

export default function Projects() {
  const { projects, loading, addProject, removeProject } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', owner_id: 'user1' })
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const { theme } = useTheme()

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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-display text-[hsl(var(--text-primary))] mb-2">Projects</h1>
            <p className="text-body text-[hsl(var(--text-secondary))]">
              Manage all your projects in one place
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* View Toggle & Filter */}
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm inline-flex items-center gap-2">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <div className="flex items-center bg-[hsl(var(--surface))] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[hsl(var(--surface-elevated))] shadow-sm text-[hsl(var(--primary))]' 
                    : 'text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]'
                }`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-[hsl(var(--surface-elevated))] shadow-sm text-[hsl(var(--primary))]' 
                    : 'text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3 className="text-title text-[hsl(var(--text-primary))] mb-2">
              {searchQuery ? 'No matching projects' : 'No Projects Yet'}
            </h3>
            <p className="text-body text-[hsl(var(--text-secondary))] mb-6">
              {searchQuery ? 'Try adjusting your search query' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                Create Project
              </button>
            )}
          </div>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          layout
        >
          <AnimatePresence>
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="card card-elevated p-5 hover:shadow-lg group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--info))] flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">{project.name[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))]">
                      <MoreVertical size={16} />
                    </button>
                    <button
                      onClick={() => removeProject(project.id)}
                      className="p-2 hover:bg-[hsl(var(--danger-bg))] rounded-lg text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))]"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h3 className="text-heading text-[hsl(var(--text-primary))] mb-2 truncate">
                  {project.name}
                </h3>
                <p className="text-small text-[hsl(var(--text-tertiary))] mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border-light))]">
                  <span className={`status-pill ${
                    project.status === 'active' 
                      ? 'status-pill-success' 
                      : 'status-pill-info'
                  }`}>
                    {project.status}
                  </span>
                  <a 
                    href={`/projects/${project.id}`} 
                    className="btn btn-primary btn-sm inline-flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          className="table-container"
          layout
        >
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--info))] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{project.name[0]}</span>
                      </div>
                      <span className="font-medium text-[hsl(var(--text-primary))]">{project.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-small text-[hsl(var(--text-tertiary))]">
                      {project.description || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${
                      project.status === 'active' 
                        ? 'status-pill-success' 
                        : 'status-pill-info'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={`/projects/${project.id}`} 
                        className="btn btn-primary btn-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="btn btn-ghost btn-sm text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger-bg))]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="text-title text-[hsl(var(--text-primary))]">Create New Project</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg text-[hsl(var(--text-tertiary))]"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateProject}>
                <div className="modal-body space-y-4">
                  <div>
                    <label className="block text-small font-medium text-[hsl(var(--text-secondary))] mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="input"
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-small font-medium text-[hsl(var(--text-secondary))] mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="input"
                      rows="4"
                      placeholder="Describe your project"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
