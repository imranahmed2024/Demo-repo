# ProjectFlow - AI-Powered Project Management

A modern full-stack project management application with advanced AI integration using NVIDIA NIM.

## Features

### Core Features
- 📊 **Dashboard** - Overview of all projects with statistics
- 📁 **Project Management** - Create, view, and manage projects
- ✅ **Task Management** - Add, update, and track tasks within projects
- 🤖 **AI Assistant** - Chat with powerful AI models for project insights

### AI Features (Powered by NVIDIA NIM)
- **Multiple AI Models** - Choose from GLM-5.1, Llama 3.1, Mistral Large, and more
- **Project Summaries** - Get AI-generated project summaries with insights
- **Task Suggestions** - Receive intelligent task breakdown suggestions
- **Reasoning Display** - View the AI's thinking process
- **Context-Aware Responses** - AI understands your project context

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **NVIDIA NIM** - AI model integration
- **OpenAI SDK** - Compatible API interface
- **In-memory Database** - For MVP (can be extended to PostgreSQL/MongoDB)

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

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Tasks
- `GET /projects/{id}/tasks` - List tasks for a project
- `POST /tasks` - Create a new task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

### AI
- `GET /ai/models` - List available AI models
- `POST /ai/chat` - Chat with AI
- `POST /ai/task-suggestions` - Get task suggestions
- `POST /ai/project-summary` - Generate project summary

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

- [ ] User authentication and authorization
- [ ] Real-time collaboration features
- [ ] File attachments for tasks
- [ ] Gantt chart view
- [ ] Team management
- [ ] Email notifications
- [ ] Integration with GitHub/GitLab
- [ ] Time tracking
- [ ] Custom workflows
- [ ] Analytics dashboard

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please check the documentation or review the code comments.

---

**Built with ❤️ using FastAPI, React, and NVIDIA NIM**
