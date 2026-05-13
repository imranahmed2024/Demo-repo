from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
from openai import OpenAI

app = FastAPI(title="Project Management API with AI")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database
projects_db: Dict[str, dict] = {}
tasks_db: Dict[str, dict] = {}
users_db: Dict[str, dict] = {}

# Pydantic models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    owner_id: str

class Project(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    status: str = "active"

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = ""
    assignee_id: Optional[str] = None
    priority: str = "medium"
    status: str = "todo"
    due_date: Optional[datetime] = None

class Task(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    assignee_id: Optional[str]
    priority: str
    status: str
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class AIRequest(BaseModel):
    model: str = "z-ai/glm-5.1"
    prompt: str
    context: Optional[str] = ""
    temperature: float = 0.7
    max_tokens: int = 2048

class AIResponse(BaseModel):
    content: str
    reasoning: Optional[str] = ""
    model: str

# NVIDIA NIM Client
def get_nvidia_client():
    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY not configured")
    
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

# Project endpoints
@app.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_id = str(uuid.uuid4())
    now = datetime.now()
    
    project_data = {
        "id": project_id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": now,
        "updated_at": now,
        "status": "active"
    }
    
    projects_db[project_id] = project_data
    return project_data

@app.get("/projects", response_model=List[Project])
async def list_projects():
    return list(projects_db.values())

@app.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@app.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: dict):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    projects_db[project_id]["updated_at"] = datetime.now()
    for key, value in project_update.items():
        if key in projects_db[project_id]:
            projects_db[project_id][key] = value
    
    return projects_db[project_id]

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"message": "Project deleted"}

# Task endpoints
@app.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    if task.project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_id = str(uuid.uuid4())
    now = datetime.now()
    
    task_data = {
        "id": task_id,
        "project_id": task.project_id,
        "title": task.title,
        "description": task.description,
        "assignee_id": task.assignee_id,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "created_at": now,
        "updated_at": now
    }
    
    tasks_db[task_id] = task_data
    return task_data

@app.get("/projects/{project_id}/tasks", response_model=List[Task])
async def list_tasks(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return [task for task in tasks_db.values() if task["project_id"] == project_id]

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: dict):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    tasks_db[task_id]["updated_at"] = datetime.now()
    for key, value in task_update.items():
        if key in tasks_db[task_id]:
            tasks_db[task_id][key] = value
    
    return tasks_db[task_id]

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks_db[task_id]
    return {"message": "Task deleted"}

# AI endpoints
@app.post("/ai/chat", response_model=AIResponse)
async def ai_chat(request: AIRequest):
    try:
        client = get_nvidia_client()
        
        messages = [{"role": "user", "content": request.prompt}]
        if request.context:
            messages.insert(0, {"role": "system", "content": request.context})
        
        completion = client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            top_p=1,
            max_tokens=request.max_tokens,
            extra_body={"chat_template_kwargs": {"enable_thinking": True, "clear_thinking": False}},
            stream=False
        )
        
        choice = completion.choices[0]
        content = choice.message.content
        reasoning = getattr(choice.message, "reasoning_content", "")
        
        return AIResponse(
            content=content,
            reasoning=reasoning,
            model=request.model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

@app.post("/ai/task-suggestions")
async def get_task_suggestions(project_id: str, request: AIRequest):
    """Get AI suggestions for task breakdown"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    existing_tasks = [t for t in tasks_db.values() if t["project_id"] == project_id]
    
    context = f"""
    Project: {project['name']}
    Description: {project['description']}
    Existing Tasks: {[t['title'] for t in existing_tasks]}
    
    Based on this project, suggest additional tasks or improvements.
    """
    
    enhanced_prompt = f"{context}\n\n{request.prompt}"
    
    try:
        client = get_nvidia_client()
        
        completion = client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": enhanced_prompt}],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            extra_body={"chat_template_kwargs": {"enable_thinking": True, "clear_thinking": False}},
            stream=False
        )
        
        content = completion.choices[0].message.content
        reasoning = getattr(completion.choices[0].message, "reasoning_content", "")
        
        return {"suggestions": content, "reasoning": reasoning, "model": request.model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

@app.post("/ai/project-summary")
async def generate_project_summary(project_id: str, request: AIRequest):
    """Generate AI-powered project summary"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    tasks = [t for t in tasks_db.values() if t["project_id"] == project_id]
    
    context = f"""
    Project: {project['name']}
    Description: {project['description']}
    Status: {project['status']}
    Total Tasks: {len(tasks)}
    Tasks by Status:
    - Todo: {len([t for t in tasks if t['status'] == 'todo'])}
    - In Progress: {len([t for t in tasks if t['status'] == 'in_progress'])}
    - Done: {len([t for t in tasks if t['status'] == 'done'])}
    
    Generate a comprehensive project summary with insights and recommendations.
    """
    
    try:
        client = get_nvidia_client()
        
        completion = client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": context}],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            extra_body={"chat_template_kwargs": {"enable_thinking": True, "clear_thinking": False}},
            stream=False
        )
        
        content = completion.choices[0].message.content
        reasoning = getattr(completion.choices[0].message, "reasoning_content", "")
        
        return {"summary": content, "reasoning": reasoning, "model": request.model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

@app.get("/ai/models")
async def list_ai_models():
    """List available AI models"""
    return {
        "models": [
            {"id": "z-ai/glm-5.1", "name": "GLM-5.1", "description": "Advanced reasoning model"},
            {"id": "meta/llama-3.1-70b-instruct", "name": "Llama 3.1 70B", "description": "Meta's latest Llama model"},
            {"id": "meta/llama-3.1-405b-instruct", "name": "Llama 3.1 405B", "description": "Meta's most powerful Llama model"},
            {"id": "mistralai/mistral-large-2-instruct", "name": "Mistral Large 2", "description": "Mistral's advanced model"},
            {"id": "google/gemma-2-27b-it", "name": "Gemma 2 27B", "description": "Google's Gemma model"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
