import { useState } from 'react'

export default function Tasks() {
  const [tasks] = useState([])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-800 mb-2">Tasks</h1>
        <p className="text-dark-500">View and manage all tasks across projects</p>
      </div>

      <div className="card text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-dark-800 mb-2">All Tasks View</h3>
        <p className="text-dark-500 mb-6">Navigate to a specific project to view and manage its tasks</p>
        <a href="/projects" className="btn-primary">Go to Projects</a>
      </div>
    </div>
  )
}
