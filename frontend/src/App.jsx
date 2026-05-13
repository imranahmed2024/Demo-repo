import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import AIAssistant from './pages/AIAssistant'
import { LayoutDashboard, FolderKanban, CheckSquare, Bot, Menu, X, Bell, Search } from 'lucide-react'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme } = useTheme()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'AI Assistant', href: '/ai', icon: Bot },
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[hsl(var(--background))]' : 'bg-[hsl(var(--background))]'}`}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full transition-all duration-300 z-50 ${
        theme === 'dark' 
          ? 'bg-[hsl(var(--surface-elevated))] border-r border-[hsl(var(--border))]' 
          : 'bg-[hsl(var(--surface-elevated))] border-r border-[hsl(var(--border))]'
      } ${sidebarOpen ? 'w-64' : 'w-[72px]'} lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo Section */}
        <div className="h-[72px] flex items-center justify-between px-4 border-b border-[hsl(var(--border-light))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--info))] flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">P</span>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-[hsl(var(--text-primary))]">
                  ProjectFlow
                </h1>
                <p className="text-xs text-[hsl(var(--text-tertiary))]">
                  AI-Powered PM
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-[hsl(var(--surface))] rounded-lg"
          >
            <X size={20} className="text-[hsl(var(--text-secondary))]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--text-primary))]'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'stroke-[2.5px]' : ''} transition-transform group-hover:scale-110`} />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 border-t border-[hsl(var(--border-light))]">
          {/* Theme Toggle */}
          {sidebarOpen ? (
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[hsl(var(--surface))]' : 'bg-[hsl(var(--surface))]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[hsl(var(--text-secondary))]">
                  {theme === 'dark' ? '🌙 Dark' : '☀️ Light'} Mode
                </span>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ThemeToggle />
            </div>
          )}
          
          {/* Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full btn-secondary flex items-center justify-center gap-2 hidden lg:flex"
          >
            {sidebarOpen ? (
              <>
                <span>Collapse</span>
                <Menu size={16} className="rotate-180" />
              </>
            ) : (
              <Menu size={16} />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'} min-h-screen`}>
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-30 h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between ${
          theme === 'dark' 
            ? 'bg-[hsl(var(--surface-elevated))]/95 backdrop-blur-lg border-b border-[hsl(var(--border))]' 
            : 'bg-[hsl(var(--surface-elevated))]/95 backdrop-blur-lg border-b border-[hsl(var(--border))]'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-[hsl(var(--surface))] rounded-lg"
            >
              <Menu size={20} className="text-[hsl(var(--text-secondary))]" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 w-64 lg:w-80 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary-light))] transition-all">
              <Search size={18} className="text-[hsl(var(--text-tertiary))]" />
              <input 
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors">
              <Bell size={20} className="text-[hsl(var(--text-secondary))]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[hsl(var(--danger))] rounded-full border-2 border-[hsl(var(--surface-elevated))]" />
            </button>
            
            {/* User Avatar */}
            <div className="avatar cursor-pointer hover:ring-2 hover:ring-[hsl(var(--primary-light))] transition-all">
              <span>U</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
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
