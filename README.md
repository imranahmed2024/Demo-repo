# ProjectFlow - Advanced AI-Powered Project Management

A modern full-stack project management application with advanced AI integration using NVIDIA NIM, featuring enterprise-grade capabilities for teams of all sizes.

## 🚀 New Advanced Features

### Core Enhancements
- 🔐 **User Authentication** - Secure JWT-based authentication with registration and login
- 👥 **Team Management** - Create teams, add members, and collaborate effectively
- 💬 **Comments & Discussions** - Threaded comments on tasks and projects
- 📅 **Sprint Management** - Agile sprint planning, start, and end workflows
- ⏱️ **Time Tracking** - Log time against tasks with detailed descriptions
- 🔗 **Task Dependencies** - Define task relationships (finish-to-start, etc.)
- 🏷️ **Tags & Labels** - Organize projects and tasks with custom tags
- 📊 **Advanced Analytics** - Burndown charts, velocity tracking, completion rates
- 🔔 **Notifications** - Real-time notifications for assignments and updates
- 🎯 **Project Templates** - Create and use templates for recurring project types
- 📝 **Custom Fields** - Add custom fields to tasks (text, number, date, select, etc.)
- 🪝 **Webhooks** - Integrate with external tools via webhook events
- 🔄 **Real-time Updates** - WebSocket support for live collaboration
- 📈 **Activity Logs** - Complete audit trail of all project activities
- 📎 **Story Points** - Agile estimation support for tasks

### AI Features (Powered by NVIDIA NIM)
- **Multiple AI Models** - Choose from GLM-5.1, Llama 3.1, Mistral Large, and more
- **Project Summaries** - Get AI-generated project summaries with insights
- **Task Suggestions** - Receive intelligent task breakdown suggestions
- **Reasoning Display** - View the AI's thinking process
- **Context-Aware Responses** - AI understands your project context
- **Smart Notifications** - AI-powered insights on project health

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **NVIDIA NIM** - AI model integration
- **OpenAI SDK** - Compatible API interface
- **PyJWT** - JWT authentication
- **In-memory Database** - For MVP (easily extendable to PostgreSQL/MongoDB)
- **WebSocket** - Real-time communication
- **HTTPX** - Async HTTP client for webhooks

### Frontend
- **React 19** - Latest React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Beautiful, responsive UI
- **React Router** - Client-side routing

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Python 3.9+**
3. **NVIDIA API Key** - Get it from [NVIDIA NGC](https://ngc.nvidia.com/)

## Setup Instructions

### 1. Clone and Navigate
```bash
cd /workspace
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your NVIDIA API Key
export NVIDIA_API_KEY="your-api-key-here"

# Start the backend server
python main.py
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Configuration

### Setting NVIDIA API Key

**Linux/Mac:**
```bash
export NVIDIA_API_KEY="nvapi-xxxxx"
```

**Windows (PowerShell):**
```powershell
$env:NVIDIA_API_KEY="nvapi-xxxxx"
```

**Windows (CMD):**
```cmd
set NVIDIA_API_KEY=nvapi-xxxxx
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project
- `POST /projects/from-template` - Create project from template
- `GET /projects/{id}/sprints` - Get project sprints
- `GET /projects/{id}/custom-fields` - Get project custom fields

### Tasks
- `GET /projects/{id}/tasks` - List tasks for a project
- `POST /tasks` - Create a new task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `GET /tasks/{id}/comments` - Get task comments
- `GET /tasks/{id}/time-entries` - Get task time entries
- `GET /tasks/{id}/dependencies` - Get task dependencies
- `POST /tasks/dependencies` - Add task dependency
- `POST /time-entries` - Log time on a task

### Teams
- `POST /teams` - Create a team
- `GET /teams` - List user's teams
- `POST /teams/{id}/members` - Add member to team

### Comments
- `POST /comments` - Add a comment
- `DELETE /comments/{id}` - Delete a comment

### Sprints
- `POST /sprints` - Create a sprint
- `PUT /sprints/{id}/start` - Start a sprint
- `PUT /sprints/{id}/end` - End a sprint

### Tags
- `POST /tags` - Create a tag
- `GET /tags` - List all tags

### Templates
- `POST /templates` - Create a project template
- `GET /templates` - List all templates

### Custom Fields
- `POST /custom-fields` - Create a custom field

### Analytics
- `GET /analytics` - Get comprehensive analytics data

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/{id}/read` - Mark notification as read

### Webhooks
- `POST /webhooks` - Create a webhook
- `GET /webhooks` - List webhooks
- `DELETE /webhooks/{id}` - Delete a webhook

### AI
- `GET /ai/models` - List available AI models
- `POST /ai/chat` - Chat with AI
- `POST /ai/task-suggestions` - Get task suggestions
- `POST /ai/project-summary` - Generate project summary

### WebSocket
- `WS /ws` - Real-time updates connection

## Available AI Models

1. **z-ai/glm-5.1** - Advanced reasoning model (default)
2. **meta/llama-3.1-70b-instruct** - Meta's Llama 3.1 70B
3. **meta/llama-3.1-405b-instruct** - Meta's most powerful Llama
4. **mistralai/mistral-large-2-instruct** - Mistral's advanced model
5. **google/gemma-2-27b-it** - Google's Gemma model

## Usage Guide

### Creating a Project
1. Go to Dashboard or Projects page
2. Click "New Project"
3. Enter project name and description
4. Click "Create Project"

### Managing Tasks
1. Navigate to a project
2. Click "Add Task"
3. Fill in task details (title, description, priority)
4. Update task status as work progresses

### Using AI Features
1. **From Project Page:**
   - Click "Generate Summary" for AI-powered project insights
   - Click "Get Task Suggestions" for intelligent task recommendations

2. **From AI Assistant Page:**
   - Select your preferred AI model
   - Type your question or request
   - View the response and reasoning process
   - Use quick prompts for common tasks

## Project Structure

```
/workspace
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── api.js          # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Development

### Running in Development

**Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Frontend (new terminal):**
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

## Troubleshooting

### Backend Issues
- **NVIDIA_API_KEY not configured**: Make sure you've set the environment variable
- **Port already in use**: Change the port in `main.py` (default: 8000)

### Frontend Issues
- **Cannot connect to backend**: Ensure backend is running on port 8000
- **Module not found**: Run `npm install` again

### AI Features Not Working
1. Verify your NVIDIA API key is valid
2. Check your internet connection
3. Ensure the backend has the API key configured

## Future Enhancements

- [ ] PostgreSQL/MongoDB database integration
- [ ] File attachments for tasks and comments
- [ ] Gantt chart view with drag-and-drop
- [ ] Kanban board view
- [ ] Calendar view for deadlines
- [ ] Email notifications and digests
- [ ] Integration with GitHub/GitLab/Bitbucket
- [ ] Slack/Discord integrations
- [ ] Advanced role-based permissions
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced reporting and exports
- [ ] Resource management
- [ ] Budget tracking and invoicing
- [ ] Risk management
- [ ] Goal OKR tracking
- [ ] AI-powered task auto-assignment
- [ ] Predictive project completion dates
- [ ] Automated standup reports

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please check the documentation or review the code comments.

---

**Built with ❤️ using FastAPI, React, and NVIDIA NIM**
