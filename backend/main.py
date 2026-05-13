from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta, timezone
from enum import Enum
import uuid
import os
import jwt
import secrets
import re
from openai import OpenAI
from collections import defaultdict
import json
import bcrypt
from slowapi import SlowAPI, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="ProjectFlow - Advanced AI-Powered Project Management")

# Rate limiter
rate_limiter = SlowAPI()
app.state.limiter = rate_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - restrict to specific origins in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))

# In-memory database
projects_db: Dict[str, dict] = {}
tasks_db: Dict[str, dict] = {}
users_db: Dict[str, dict] = {}
teams_db: Dict[str, dict] = {}
comments_db: Dict[str, list] = {}
attachments_db: Dict[str, list] = {}
activity_logs_db: Dict[str, list] = {}
tags_db: Dict[str, dict] = {}
sprints_db: Dict[str, dict] = {}
project_templates_db: Dict[str, dict] = {}
time_entries_db: Dict[str, dict] = {}
dependencies_db: Dict[str, list] = {}
notifications_db: Dict[str, list] = {}
webhooks_db: Dict[str, dict] = {}
custom_fields_db: Dict[str, dict] = {}

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Enums
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class ActivityType(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    STATUS_CHANGED = "status_changed"
    ASSIGNED = "assigned"
    COMMENT_ADDED = "comment_added"
    ATTACHMENT_ADDED = "attachment_added"
    SPRINT_STARTED = "sprint_started"
    SPRINT_ENDED = "sprint_ended"

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: str = Field(..., min_length=1, max_length=100)
    role: str = "member"
    
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    owner_id: str

class Team(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    members: List[str] = []
    created_at: datetime

class TagCreate(BaseModel):
    name: str
    color: str = "#3B82F6"
    project_id: Optional[str] = None

class Tag(BaseModel):
    id: str
    name: str
    color: str
    project_id: Optional[str] = None

class CustomFieldCreate(BaseModel):
    name: str
    type: Literal["text", "number", "date", "select", "multi_select", "checkbox"] = "text"
    options: Optional[List[str]] = None
    required: bool = False
    project_id: str

class CustomField(BaseModel):
    id: str
    name: str
    type: str
    options: Optional[List[str]] = None
    required: bool
    project_id: str

class Attachment(BaseModel):
    id: str
    filename: str
    url: str
    size: int
    mime_type: str
    uploaded_by: str
    uploaded_at: datetime

class CommentCreate(BaseModel):
    content: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    parent_id: Optional[str] = None

class Comment(BaseModel):
    id: str
    content: str
    author_id: str
    author_name: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class ActivityLog(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    user_id: str
    user_name: str
    details: dict
    timestamp: datetime

class SprintCreate(BaseModel):
    name: str
    project_id: str
    start_date: datetime
    end_date: datetime
    goal: Optional[str] = ""

class Sprint(BaseModel):
    id: str
    name: str
    project_id: str
    start_date: datetime
    end_date: datetime
    goal: str
    status: str = "planning"
    created_at: datetime
    completed_tasks: int = 0
    total_tasks: int = 0

class TaskDependency(BaseModel):
    id: str
    task_id: str
    depends_on_task_id: str
    dependency_type: Literal["finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"] = "finish_to_start"
    created_at: datetime

class TimeEntry(BaseModel):
    id: str
    task_id: str
    user_id: str
    duration_minutes: int
    description: str
    date: datetime
    created_at: datetime

class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime
    link: Optional[str] = None

class Webhook(BaseModel):
    id: str
    url: str
    events: List[str]
    active: bool = True
    secret: Optional[str] = None
    created_at: datetime

class ProjectTemplate(BaseModel):
    id: str
    name: str
    description: str
    tasks: List[dict]
    custom_fields: List[dict]
    created_by: str
    created_at: datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    owner_id: str
    team_id: Optional[str] = None
    status: str = "planning"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    template_id: Optional[str] = None

class Project(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    team_id: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    budget: Optional[float] = None
    progress: float = 0.0
    tags: List[str] = []

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = ""
    assignee_id: Optional[str] = None
    priority: str = "medium"
    status: str = "todo"
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    sprint_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    tags: List[str] = []
    custom_field_values: Optional[Dict[str, Any]] = None
    story_points: Optional[int] = None

class Task(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    assignee_id: Optional[str]
    assignee_name: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: float = 0.0
    sprint_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    subtasks: List[str] = []
    tags: List[str] = []
    custom_field_values: Optional[Dict[str, Any]] = None
    story_points: Optional[int] = None
    dependencies: List[str] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

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

class AnalyticsData(BaseModel):
    total_projects: int
    active_projects: int
    total_tasks: int
    tasks_by_status: dict
    tasks_by_priority: dict
    completion_rate: float
    average_completion_time_days: float
    burndown_data: List[dict]
    team_velocity: float

# Helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt with automatic salt generation"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp"]})
        user_id = payload.get("sub")
        if not user_id or user_id not in users_db:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return users_db[user_id]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

def log_activity(entity_type: str, entity_id: str, action: str, user_id: str, user_name: str, details: dict):
    activity_id = str(uuid.uuid4())
    activity = {
        "id": activity_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "user_id": user_id,
        "user_name": user_name,
        "details": details,
        "timestamp": datetime.now()
    }
    if entity_id not in activity_logs_db:
        activity_logs_db[entity_id] = []
    activity_logs_db[entity_id].append(activity)
    return activity

def create_notification(user_id: str, title: str, message: str, type: str, link: Optional[str] = None):
    notification_id = str(uuid.uuid4())
    notification = {
        "id": notification_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "read": False,
        "created_at": datetime.now(),
        "link": link
    }
    if user_id not in notifications_db:
        notifications_db[user_id] = []
    notifications_db[user_id].append(notification)
    return notification

def calculate_project_progress(project_id: str) -> float:
    tasks = [t for t in tasks_db.values() if t["project_id"] == project_id]
    if not tasks:
        return 0.0
    completed = len([t for t in tasks if t["status"] == "done"])
    return (completed / len(tasks)) * 100

async def trigger_webhook(event: str, data: dict):
    for webhook in webhooks_db.values():
        if webhook["active"] and event in webhook["events"]:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    await client.post(webhook["url"], json={"event": event, "data": data})
            except:
                pass

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
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
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
    log_activity("project", project_id, "created", current_user["id"], current_user["name"], {"project_name": project.name})
    return project_data

@app.get("/projects", response_model=List[Project])
async def list_projects(current_user: dict = Depends(get_current_user)):
    # Return only projects owned by or accessible to the current user
    return [p for p in projects_db.values() if p["owner_id"] == current_user["id"] or current_user["role"] == "admin"]

@app.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    project = projects_db[project_id]
    # Check authorization
    if project["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return project

@app.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: dict, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    projects_db[project_id]["updated_at"] = datetime.now()
    for key, value in project_update.items():
        if key in projects_db[project_id]:
            projects_db[project_id][key] = value
    
    log_activity("project", project_id, "updated", current_user["id"], current_user["name"], {"updates": project_update})
    return projects_db[project_id]

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    if project["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
    
    log_activity("project", project_id, "deleted", current_user["id"], current_user["name"], {})
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

# Authentication endpoints
@app.post("/auth/register", response_model=User)
async def register_user(user: UserCreate):
    # Check if email already exists (case-insensitive)
    email_lower = user.email.lower()
    for u in users_db.values():
        if u["email"].lower() == email_lower:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    allowed_roles = ["member", "admin"]
    if user.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {allowed_roles}")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_data = {
        "id": user_id,
        "email": email_lower,
        "password": hash_password(user.password),
        "name": user.name.strip(),
        "role": user.role,
        "avatar_url": None,
        "created_at": now,
        "last_login": None
    }

    users_db[user_id] = user_data
    log_activity("user", user_id, "created", user_id, user.name, {"action": "User registered"})

    return {k: v for k, v in user_data.items() if k != "password"}

@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    email_lower = credentials.email.lower()
    user = None
    for u in users_db.values():
        if u["email"].lower() == email_lower and verify_password(credentials.password, u["password"]):
            user = u
            break

    if not user:
        log_activity("auth", "login_attempt", "failed", "unknown", "unknown", {"email": email_lower})
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    users_db[user["id"]]["last_login"] = datetime.now(timezone.utc)

    user_without_password = {k: v for k, v in user.items() if k != "password"}

    log_activity("user", user["id"], "logged_in", user["id"], user["name"], {"action": "User logged in"})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_without_password
    )

@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

# Team endpoints
@app.post("/teams", response_model=Team)
async def create_team(team: TeamCreate, current_user: dict = Depends(get_current_user)):
    team_id = str(uuid.uuid4())
    now = datetime.now()
    
    team_data = {
        "id": team_id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "members": [team.owner_id],
        "created_at": now
    }
    
    teams_db[team_id] = team_data
    log_activity("team", team_id, "created", current_user["id"], current_user["name"], {"team_name": team.name})
    
    return team_data

@app.get("/teams", response_model=List[Team])
async def list_teams(current_user: dict = Depends(get_current_user)):
    return [t for t in teams_db.values() if current_user["id"] in t["members"]]

@app.post("/teams/{team_id}/members", response_model=Team)
async def add_team_member(team_id: str, member_id: str, current_user: dict = Depends(get_current_user)):
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if member_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if member_id not in teams_db[team_id]["members"]:
        teams_db[team_id]["members"].append(member_id)
        create_notification(member_id, "Added to Team", f"You've been added to {teams_db[team_id]['name']}", "team")
    
    return teams_db[team_id]

# Comment endpoints
@app.post("/comments", response_model=Comment)
async def add_comment(comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    comment_id = str(uuid.uuid4())
    now = datetime.now()
    
    comment_data = {
        "id": comment_id,
        "content": comment.content,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "task_id": comment.task_id,
        "project_id": comment.project_id,
        "parent_id": comment.parent_id,
        "created_at": now,
        "updated_at": None
    }
    
    entity_id = comment.task_id or comment.project_id
    if entity_id not in comments_db:
        comments_db[entity_id] = []
    comments_db[entity_id].append(comment_data)
    
    log_activity("comment", comment_id, "created", current_user["id"], current_user["name"], {"content": comment.content[:100]})
    
    return comment_data

@app.get("/tasks/{task_id}/comments", response_model=List[Comment])
async def get_task_comments(task_id: str):
    return comments_db.get(task_id, [])

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    for entity_id, comments in comments_db.items():
        for i, comment in enumerate(comments):
            if comment["id"] == comment_id:
                if comment["author_id"] != current_user["id"] and current_user["role"] != "admin":
                    raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
                del comments[i]
                return {"message": "Comment deleted"}
    raise HTTPException(status_code=404, detail="Comment not found")

# Sprint endpoints
@app.post("/sprints", response_model=Sprint)
async def create_sprint(sprint: SprintCreate, current_user: dict = Depends(get_current_user)):
    if sprint.project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    sprint_id = str(uuid.uuid4())
    now = datetime.now()
    
    sprint_data = {
        "id": sprint_id,
        "name": sprint.name,
        "project_id": sprint.project_id,
        "start_date": sprint.start_date,
        "end_date": sprint.end_date,
        "goal": sprint.goal,
        "status": "planning",
        "created_at": now,
        "completed_tasks": 0,
        "total_tasks": 0
    }
    
    sprints_db[sprint_id] = sprint_data
    log_activity("sprint", sprint_id, "created", current_user["id"], current_user["name"], {"sprint_name": sprint.name})
    
    return sprint_data

@app.get("/projects/{project_id}/sprints", response_model=List[Sprint])
async def get_project_sprints(project_id: str):
    return [s for s in sprints_db.values() if s["project_id"] == project_id]

@app.put("/sprints/{sprint_id}/start")
async def start_sprint(sprint_id: str, current_user: dict = Depends(get_current_user)):
    if sprint_id not in sprints_db:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprints_db[sprint_id]["status"] = "active"
    log_activity("sprint", sprint_id, "started", current_user["id"], current_user["name"], {})
    await trigger_webhook("sprint.started", {"sprint_id": sprint_id})
    
    return sprints_db[sprint_id]

@app.put("/sprints/{sprint_id}/end")
async def end_sprint(sprint_id: str, current_user: dict = Depends(get_current_user)):
    if sprint_id not in sprints_db:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprints_db[sprint_id]["status"] = "completed"
    log_activity("sprint", sprint_id, "ended", current_user["id"], current_user["name"], {})
    await trigger_webhook("sprint.ended", {"sprint_id": sprint_id})
    
    return sprints_db[sprint_id]

# Time tracking endpoints
@app.post("/time-entries", response_model=TimeEntry)
async def log_time(task_id: str, duration_minutes: int, description: str, current_user: dict = Depends(get_current_user)):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    entry_id = str(uuid.uuid4())
    now = datetime.now()
    
    entry_data = {
        "id": entry_id,
        "task_id": task_id,
        "user_id": current_user["id"],
        "duration_minutes": duration_minutes,
        "description": description,
        "date": now,
        "created_at": now
    }
    
    time_entries_db[entry_id] = entry_data
    tasks_db[task_id]["actual_hours"] = tasks_db[task_id].get("actual_hours", 0) + (duration_minutes / 60)
    
    return entry_data

@app.get("/tasks/{task_id}/time-entries", response_model=List[TimeEntry])
async def get_task_time_entries(task_id: str):
    return [e for e in time_entries_db.values() if e["task_id"] == task_id]

# Task dependency endpoints
@app.post("/tasks/dependencies", response_model=TaskDependency)
async def add_task_dependency(task_id: str, depends_on_task_id: str, current_user: dict = Depends(get_current_user)):
    if task_id not in tasks_db or depends_on_task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    dep_id = str(uuid.uuid4())
    now = datetime.now()
    
    dependency = {
        "id": dep_id,
        "task_id": task_id,
        "depends_on_task_id": depends_on_task_id,
        "dependency_type": "finish_to_start",
        "created_at": now
    }
    
    dependencies_db[task_id] = dependencies_db.get(task_id, [])
    dependencies_db[task_id].append(dependency)
    tasks_db[task_id]["dependencies"].append(depends_on_task_id)
    
    return dependency

@app.get("/tasks/{task_id}/dependencies", response_model=List[TaskDependency])
async def get_task_dependencies(task_id: str):
    return dependencies_db.get(task_id, [])

# Analytics endpoint
@app.get("/analytics", response_model=AnalyticsData)
async def get_analytics(current_user: dict = Depends(get_current_user)):
    all_projects = list(projects_db.values())
    all_tasks = list(tasks_db.values())
    
    active_projects = len([p for p in all_projects if p["status"] == "active"])
    tasks_by_status = {}
    tasks_by_priority = {}
    
    for task in all_tasks:
        status = task["status"]
        priority = task["priority"]
        tasks_by_status[status] = tasks_by_status.get(status, 0) + 1
        tasks_by_priority[priority] = tasks_by_priority.get(priority, 0) + 1
    
    completed_tasks = len([t for t in all_tasks if t["status"] == "done"])
    total_tasks = len(all_tasks)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Calculate burndown data (last 7 days)
    burndown_data = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        tasks_completed_by_date = len([t for t in all_tasks if t["status"] == "done" and t.get("completed_at", date) <= date])
        burndown_data.append({"date": date.isoformat(), "remaining": total_tasks - tasks_completed_by_date})
    
    # Calculate team velocity (average tasks completed per week)
    team_velocity = completed_tasks / max(1, len([p for p in all_projects if p["status"] == "active"]))
    
    return AnalyticsData(
        total_projects=len(all_projects),
        active_projects=active_projects,
        total_tasks=total_tasks,
        tasks_by_status=tasks_by_status,
        tasks_by_priority=tasks_by_priority,
        completion_rate=completion_rate,
        average_completion_time_days=7.0,  # Simplified
        burndown_data=burndown_data,
        team_velocity=team_velocity
    ).dict()

# Notification endpoints
@app.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    return notifications_db.get(current_user["id"], [])

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    for notification in notifications_db.get(current_user["id"], []):
        if notification["id"] == notification_id:
            notification["read"] = True
            return notification
    raise HTTPException(status_code=404, detail="Notification not found")

# Webhook endpoints
@app.post("/webhooks", response_model=Webhook)
async def create_webhook(url: str, events: List[str], current_user: dict = Depends(get_current_user)):
    webhook_id = str(uuid.uuid4())
    now = datetime.now()
    
    webhook_data = {
        "id": webhook_id,
        "url": url,
        "events": events,
        "active": True,
        "secret": str(uuid.uuid4()),
        "created_at": now
    }
    
    webhooks_db[webhook_id] = webhook_data
    return webhook_data

@app.get("/webhooks", response_model=List[Webhook])
async def list_webhooks(current_user: dict = Depends(get_current_user)):
    return list(webhooks_db.values())

@app.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, current_user: dict = Depends(get_current_user)):
    if webhook_id not in webhooks_db:
        raise HTTPException(status_code=404, detail="Webhook not found")
    del webhooks_db[webhook_id]
    return {"message": "Webhook deleted"}

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast({"type": "message", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({"type": "disconnect", "message": "A user disconnected"})

# Enhanced Project endpoints with more features
@app.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: dict, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    projects_db[project_id]["updated_at"] = datetime.now()
    for key, value in project_update.items():
        if key in projects_db[project_id]:
            projects_db[project_id][key] = value
    
    # Recalculate progress
    projects_db[project_id]["progress"] = calculate_project_progress(project_id)
    
    log_activity("project", project_id, "updated", current_user["id"], current_user["name"], {"updates": project_update})
    await trigger_webhook("project.updated", {"project_id": project_id, "updates": project_update})
    
    return projects_db[project_id]

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated tasks
    tasks_to_delete = [t["id"] for t in tasks_db.values() if t["project_id"] == project_id]
    for task_id in tasks_to_delete:
        del tasks_db[task_id]
    
    log_activity("project", project_id, "deleted", current_user["id"], current_user["name"], {})
    await trigger_webhook("project.deleted", {"project_id": project_id})
    
    del projects_db[project_id]
    return {"message": "Project deleted"}

# Enhanced Task endpoints with more features
@app.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    if task.project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_id = str(uuid.uuid4())
    now = datetime.now()
    
    assignee_name = None
    if task.assignee_id and task.assignee_id in users_db:
        assignee_name = users_db[task.assignee_id]["name"]
    
    task_data = {
        "id": task_id,
        "project_id": task.project_id,
        "title": task.title,
        "description": task.description,
        "assignee_id": task.assignee_id,
        "assignee_name": assignee_name,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "estimated_hours": task.estimated_hours,
        "actual_hours": 0,
        "sprint_id": task.sprint_id,
        "parent_task_id": task.parent_task_id,
        "subtasks": [],
        "tags": task.tags,
        "custom_field_values": task.custom_field_values,
        "story_points": task.story_points,
        "dependencies": [],
        "created_at": now,
        "updated_at": now,
        "completed_at": None
    }
    
    tasks_db[task_id] = task_data
    
    # Update project progress
    projects_db[task.project_id]["progress"] = calculate_project_progress(task.project_id)
    
    # Notify assignee
    if task.assignee_id:
        create_notification(task.assignee_id, "Task Assigned", f"You've been assigned to: {task.title}", "task_assignment", f"/tasks/{task_id}")
    
    log_activity("task", task_id, "created", current_user["id"], current_user["name"], {"task_title": task.title})
    await trigger_webhook("task.created", {"task_id": task_id, "project_id": task.project_id})
    
    return task_data

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: dict, current_user: dict = Depends(get_current_user)):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = tasks_db[task_id]["status"]
    tasks_db[task_id]["updated_at"] = datetime.now()
    
    for key, value in task_update.items():
        if key in tasks_db[task_id]:
            tasks_db[task_id][key] = value
    
    # Set completed_at when status changes to done
    if task_update.get("status") == "done" and old_status != "done":
        tasks_db[task_id]["completed_at"] = datetime.now()
    
    # Update assignee name if assignee changed
    if "assignee_id" in task_update:
        if task_update["assignee_id"] and task_update["assignee_id"] in users_db:
            tasks_db[task_id]["assignee_name"] = users_db[task_update["assignee_id"]]["name"]
        else:
            tasks_db[task_id]["assignee_name"] = None
    
    # Update project progress
    project_id = tasks_db[task_id]["project_id"]
    projects_db[project_id]["progress"] = calculate_project_progress(project_id)
    
    log_activity("task", task_id, "updated", current_user["id"], current_user["name"], {"updates": task_update})
    await trigger_webhook("task.updated", {"task_id": task_id, "updates": task_update})
    
    return tasks_db[task_id]

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project_id = tasks_db[task_id]["project_id"]
    log_activity("task", task_id, "deleted", current_user["id"], current_user["name"], {})
    await trigger_webhook("task.deleted", {"task_id": task_id})
    
    del tasks_db[task_id]
    
    # Update project progress
    if project_id in projects_db:
        projects_db[project_id]["progress"] = calculate_project_progress(project_id)
    
    return {"message": "Task deleted"}

# Tag endpoints
@app.post("/tags", response_model=Tag)
async def create_tag(tag: TagCreate, current_user: dict = Depends(get_current_user)):
    tag_id = str(uuid.uuid4())
    
    tag_data = {
        "id": tag_id,
        "name": tag.name,
        "color": tag.color,
        "project_id": tag.project_id
    }
    
    tags_db[tag_id] = tag_data
    return tag_data

@app.get("/tags", response_model=List[Tag])
async def list_tags(project_id: Optional[str] = None):
    if project_id:
        return [t for t in tags_db.values() if t["project_id"] == project_id]
    return list(tags_db.values())

# Custom fields endpoints
@app.post("/custom-fields", response_model=CustomField)
async def create_custom_field(field: CustomFieldCreate, current_user: dict = Depends(get_current_user)):
    field_id = str(uuid.uuid4())
    
    field_data = {
        "id": field_id,
        "name": field.name,
        "type": field.type,
        "options": field.options,
        "required": field.required,
        "project_id": field.project_id
    }
    
    custom_fields_db[field_id] = field_data
    return field_data

@app.get("/projects/{project_id}/custom-fields", response_model=List[CustomField])
async def get_project_custom_fields(project_id: str):
    return [f for f in custom_fields_db.values() if f["project_id"] == project_id]

# Project templates endpoints
@app.post("/templates", response_model=ProjectTemplate)
async def create_template(name: str, description: str, tasks: List[dict], current_user: dict = Depends(get_current_user)):
    template_id = str(uuid.uuid4())
    now = datetime.now()
    
    template_data = {
        "id": template_id,
        "name": name,
        "description": description,
        "tasks": tasks,
        "custom_fields": [],
        "created_by": current_user["id"],
        "created_at": now
    }
    
    project_templates_db[template_id] = template_data
    return template_data

@app.get("/templates", response_model=List[ProjectTemplate])
async def list_templates():
    return list(project_templates_db.values())

@app.post("/projects/from-template", response_model=Project)
async def create_project_from_template(template_id: str, project_name: str, owner_id: str):
    if template_id not in project_templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = project_templates_db[template_id]
    
    # Create project
    project_id = str(uuid.uuid4())
    now = datetime.now()
    
    project_data = {
        "id": project_id,
        "name": project_name,
        "description": f"Created from template: {template['name']}",
        "owner_id": owner_id,
        "team_id": None,
        "status": "planning",
        "start_date": None,
        "end_date": None,
        "created_at": now,
        "updated_at": now,
        "budget": None,
        "progress": 0.0,
        "tags": []
    }
    
    projects_db[project_id] = project_data
    
    # Create tasks from template
    for task_template in template["tasks"]:
        task_id = str(uuid.uuid4())
        task_data = {
            "id": task_id,
            "project_id": project_id,
            "title": task_template.get("title", "Untitled Task"),
            "description": task_template.get("description", ""),
            "assignee_id": None,
            "assignee_name": None,
            "priority": task_template.get("priority", "medium"),
            "status": "todo",
            "due_date": None,
            "estimated_hours": task_template.get("estimated_hours"),
            "actual_hours": 0,
            "sprint_id": None,
            "parent_task_id": None,
            "subtasks": [],
            "tags": task_template.get("tags", []),
            "custom_field_values": None,
            "story_points": task_template.get("story_points"),
            "dependencies": [],
            "created_at": now,
            "updated_at": now,
            "completed_at": None
        }
        tasks_db[task_id] = task_data
    
    return project_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
