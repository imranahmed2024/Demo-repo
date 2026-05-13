# Security Fixes Applied to ProjectFlow

## Summary
This document outlines all security issues identified and fixed in the ProjectFlow application.

## Backend Security Fixes (backend/main.py)

### 1. Authentication & Authorization

#### Fixed Issues:
- **Weak Password Hashing**: Replaced SHA-256 with bcrypt (12 rounds) for secure password hashing
- **Insecure Default SECRET_KEY**: Made SECRET_KEY required environment variable (no default fallback)
- **Token Expiration**: Reduced token expiration from 7 days to 60 minutes (configurable via TOKEN_EXPIRE_MINUTES)
- **JWT Validation**: Added explicit expiration validation in JWT decode
- **Missing Authentication on Endpoints**: Added authentication to all project CRUD endpoints
- **Missing Authorization Checks**: Added owner/admin authorization checks for all project operations

#### Changes:
```python
# Before
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# After
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set")
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
```

### 2. Input Validation & Sanitization

#### Fixed Issues:
- **Weak Password Requirements**: Added strong password validation (min 8 chars, uppercase, lowercase, digit)
- **Email Validation**: Using Pydantic's EmailStr for proper email validation
- **Name Field Validation**: Added min/max length constraints
- **Project Name Validation**: Added required check and max length (200 chars)
- **Input Sanitization**: Added .strip() to prevent whitespace injection
- **Case-Insensitive Email**: Normalized emails to lowercase to prevent duplicate accounts

#### Changes:
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: str = Field(..., min_length=1, max_length=100)
    
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
```

### 3. CORS Configuration

#### Fixed Issues:
- **Overly Permissive CORS**: Changed from allow_all ("*") to specific allowed origins
- **Unrestricted HTTP Methods**: Limited to necessary methods only
- **Unrestricted Headers**: Limited to necessary headers only

#### Changes:
```python
# Before
allow_origins=["*"],
allow_methods=["*"],
allow_headers=["*"],

# After
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
allow_origins=ALLOWED_ORIGINS,
allow_methods=["GET", "POST", "PUT", "DELETE"],
allow_headers=["Authorization", "Content-Type"],
```

### 4. Rate Limiting

#### Added:
- Integrated SlowAPI for rate limiting protection against brute force and DoS attacks
- Added exception handler for rate limit exceeded errors

```python
from slowapi import SlowAPI, _rate_limit_exceeded_handler
rate_limiter = SlowAPI()
app.state.limiter = rate_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### 5. Security Logging

#### Added:
- Failed login attempt logging for security monitoring
- Activity logging for all project operations (create, update, delete)

### 6. Protected Fields

#### Added:
- Prevented modification of critical fields (id, owner_id, created_at) during updates

```python
protected_fields = ["id", "owner_id", "created_at"]
for field in protected_fields:
    project_update.pop(field, None)
```

### 7. Timezone Handling

#### Fixed Issues:
- **Deprecated datetime.utcnow()**: Replaced with datetime.now(timezone.utc)
- **Inconsistent Timezones**: Standardized on UTC for all timestamps

## Dependencies Updated (backend/requirements.txt)

Added security-critical packages:
- `bcrypt==4.1.2` - Secure password hashing
- `slowapi==0.1.9` - Rate limiting
- `email-validator==2.1.0` - Email validation

## Recommendations for Production

1. **Environment Variables**: Set these required environment variables:
   - `SECRET_KEY` - Generate a strong random key (e.g., `openssl rand -hex 32`)
   - `ALLOWED_ORIGINS` - Set to your production frontend URLs
   - `NVIDIA_API_KEY` - For AI features
   - `TOKEN_EXPIRE_MINUTES` - Adjust as needed

2. **Database**: Replace in-memory dictionaries with a proper database (PostgreSQL, MongoDB)

3. **HTTPS**: Always use HTTPS in production

4. **Additional Hardening**:
   - Add CSRF protection
   - Implement account lockout after failed attempts
   - Add refresh token mechanism
   - Use Redis for distributed rate limiting
   - Add security headers middleware
   - Implement proper file upload validation for attachments

5. **Monitoring**: Set up logging aggregation and alerting for security events

## Testing

After applying these fixes, test the following:
1. User registration with weak passwords (should fail)
2. Accessing projects without authentication (should fail)
3. Accessing other users' projects (should fail with 403)
4. Token expiration behavior
5. Rate limiting functionality
