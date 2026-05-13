import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import AIAssistant from './pages/AIAssistant'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { theme } = useTheme()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Tasks', href: '/tasks', icon: '✅' },
    { name: 'AI Assistant', href: '/ai', icon: '🤖' },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-dark-900 via-dark-800 to-primary-900/20' : 'from-slate-50 via-white to-primary-50'}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 ${
        theme === 'dark' 
          ? 'bg-dark-900/95 backdrop-blur-xl border-r border-dark-700' 
          : 'bg-white/95 backdrop-blur-xl border-r border-border'
      } shadow-soft-lg ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
                    ProjectFlow
                  </h1>
                  <p className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                    AI-Powered PM
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary'
                      : 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : theme === 'dark'
                      ? 'text-dark-400 hover:bg-dark-800 hover:text-white'
                      : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                {sidebarOpen && (
                  <span className="font-medium animate-fade-in">{item.name}</span>
                )}
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Theme Toggle */}
          {sidebarOpen && (
            <div className={`px-4 py-3 rounded-xl mb-2 ${theme === 'dark' ? 'bg-dark-800' : 'bg-dark-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                  {theme === 'dark' ? '🌙 Dark' : '☀️ Light'} Mode
                </span>
                <ThemeToggle />
              </div>
            </div>
          )}
          
          {/* Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full btn-secondary flex items-center justify-center space-x-2 ${
              !sidebarOpen && 'px-2'
            }`}
          >
            <span className="transition-transform duration-300">{sidebarOpen ? '←' : '→'}</span>
            {sidebarOpen && <span className="animate-fade-in">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-40 px-8 py-4 ${
          theme === 'dark' 
            ? 'bg-dark-900/80 backdrop-blur-lg border-b border-dark-700' 
            : 'bg-white/80 backdrop-blur-lg border-b border-border'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-800'}`}>
                Welcome back! 👋
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                Let's make today productive
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile Theme Toggle */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>
              {/* User Avatar */}
              <div className="avatar cursor-pointer hover-lift">
                <span>U</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
