import { useState, useEffect } from 'react'
import { api } from '../api'
import { useTheme } from '../contexts/ThemeContext'
import { motion } from 'framer-motion'
import { PieChart, TrendingUp, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

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
      setRecentProjects(projects.slice(0, 5))
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent"></div>
      </div>
    )
  }

  const statCards = [
    { 
      title: 'Total Projects', 
      value: stats.projects, 
      icon: PieChart, 
      color: 'var(--primary)',
      trend: '+12%',
      trendUp: true 
    },
    { 
      title: 'Total Tasks', 
      value: stats.tasks, 
      icon: TrendingUp, 
      color: 'var(--info)',
      trend: '+8%',
      trendUp: true 
    },
    { 
      title: 'Completed', 
      value: stats.completed, 
      icon: CheckCircle, 
      color: 'var(--success)',
      trend: '+23%',
      trendUp: true 
    },
    { 
      title: 'Pending', 
      value: stats.pending, 
      icon: Clock, 
      color: 'var(--warning)',
      trend: '-5%',
      trendUp: false 
    },
  ]

  const pieData = [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending', value: stats.pending },
  ]

  const lineData = [
    { day: 'Mon', tasks: 12 },
    { day: 'Tue', tasks: 19 },
    { day: 'Wed', tasks: 15 },
    { day: 'Thu', tasks: 25 },
    { day: 'Fri', tasks: 22 },
    { day: 'Sat', tasks: 10 },
    { day: 'Sun', tasks: 8 },
  ]

  const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))']

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display text-[hsl(var(--text-primary))] mb-2">
          Dashboard
        </h1>
        <p className="text-body text-[hsl(var(--text-secondary))]">
          Overview of your projects and tasks performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card p-5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${stat.color})`, opacity: 0.15 }}
                >
                  <Icon size={24} style={{ color: `hsl(${stat.color})` }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.trendUp 
                    ? 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]' 
                    : 'bg-[hsl(var(--danger-bg))] text-[hsl(var(--danger))]'
                }`}>
                  {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-caption text-[hsl(var(--text-tertiary))] mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-[hsl(var(--text-primary))]" style={{ letterSpacing: '-0.02em' }}>
                {stat.value}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-heading text-[hsl(var(--text-primary))] mb-4">Task Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: `hsl(var(--surface-elevated))`, 
                    border: `1px solid hsl(var(--border))`,
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }} 
                />
                <span className="text-small text-[hsl(var(--text-secondary))]">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Line Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-heading text-[hsl(var(--text-primary))] mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis 
                  dataKey="day" 
                  stroke={`hsl(var(--text-tertiary))`}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke={`hsl(var(--text-tertiary))`}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: `hsl(var(--surface-elevated))`, 
                    border: `1px solid hsl(var(--border))`,
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke={`hsl(var(--primary))`} 
                  strokeWidth={3}
                  dot={{ fill: `hsl(var(--primary))`, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Projects */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border-light))]">
          <h2 className="text-heading text-[hsl(var(--text-primary))]">
            Recent Projects
          </h2>
          <a href="/projects" className="btn-ghost btn-sm">
            View All →
          </a>
        </div>

        {recentProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="text-title text-[hsl(var(--text-primary))] mb-2">No projects yet</h3>
            <p className="text-body text-[hsl(var(--text-secondary))] mb-6">
              Create your first project to get started
            </p>
            <a href="/projects" className="btn btn-primary">
              Create Project
            </a>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border-light))]">
            {recentProjects.map((project, index) => (
              <motion.a
                key={project.id}
                href={`/projects/${project.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="block p-4 sm:p-5 hover:bg-[hsl(var(--surface))] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--info))] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{project.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(var(--text-primary))]">
                        {project.name}
                      </h3>
                      <p className="text-small text-[hsl(var(--text-tertiary))]">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <span className="status-pill status-pill-info hidden sm:flex">
                    View →
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
