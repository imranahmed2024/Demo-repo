import { useState, useEffect } from 'react'
import { api } from '../api'
import { useTheme } from '../contexts/ThemeContext'

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, tasks: 0, completed: 0, pending: 0 })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const projects = await api.getProjects()
      setRecentProjects(projects.slice(0, 3))
      
      let totalTasks = 0
      let completedTasks = 0
      
      for (const project of projects) {
        const tasks = await api.getTasks(project.id)
        totalTasks += tasks.length
        completedTasks += tasks.filter(t => t.status === 'done').length
      }

      setStats({
        projects: projects.length,
        tasks: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks
      })
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Projects', value: stats.projects, icon: '📁', gradient: 'gradient-primary', color: 'text-primary' },
    { title: 'Total Tasks', value: stats.tasks, icon: '✅', gradient: 'gradient-purple', color: 'text-purple-600' },
    { title: 'Completed', value: stats.completed, icon: '✓', gradient: 'gradient-success', color: 'text-green-600' },
    { title: 'Pending', value: stats.pending, icon: '⏳', gradient: 'gradient-warning', color: 'text-yellow-600' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
          Dashboard
        </h1>
        <p className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
          Overview of your projects and tasks
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="card card-hover animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'} mb-1`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-14 h-14 ${stat.gradient} rounded-2xl flex items-center justify-center shadow-glow`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
            Recent Projects
          </h2>
          <a href="/projects" className="btn-outline btn-sm">View All →</a>
        </div>

        {recentProjects.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
            <div className="text-6xl mb-4">📁</div>
            <p>No projects yet</p>
            <a href="/projects" className="btn-primary mt-4 inline-block">Create Your First Project</a>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="block p-4 rounded-xl border border-border hover-lift transition-all duration-200"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'hsl(var(--dark-800))' : 'hsl(var(--muted))',
                  animationDelay: `${(index + 4) * 100}ms` 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
                      {project.name}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <span className="badge badge-primary">View →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
