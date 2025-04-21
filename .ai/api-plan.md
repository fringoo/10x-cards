# REST API Plan

## 1. Resources

- **User / Auth** (`auth.users`, `profiles`)
- **Flashcard** (`flashcards`)
- **Session** (`sessions`)
- **SessionFlashcard** (`session_flashcards`)
- **Admin Metrics** (aggregated stats for admin dashboard)

## 2. Endpoints

### Error Response Format
All error responses return the indicated HTTP status code and JSON body:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details"?: { ... }
  }
}
```

### 2.1 Authentication & User Management

#### POST /auth/register
- Description: Register a new user and create a profile stub
- Request Body (JSON):
  - `email` (string, required)
  - `password` (string, required, meets strength rules)
- Response (201 Created):
  ```json
  {
    "user": {"id": "uuid", "email": "string"},
    "profile": {"id": "uuid", "fullName": null, "avatarUrl": null},
    "token": "jwtToken"
  }
  ```
- Errors: 400 Bad Request (validation), 409 Conflict (email already exists)

#### POST /auth/login
- Description: Authenticate user and return JWT
- Request Body (JSON):
  - `email` (string, required)
  - `password` (string, required)
- Response (200 OK):
  ```json
  {
    "user": {"id": "uuid", "email": "string"},
    "profile": {"id": "uuid", "fullName": "string", "avatarUrl": "string"},
    "token": "jwtToken"
  }
  ```
- Errors: 400 Bad Request, 401 Unauthorized

#### POST /auth/password-reset
- Description: Send password reset email
- Request Body (JSON): `{ "email": "string" }`
- Response (200 OK): `{ "message": "Reset link sent" }`
- Errors: 400 Bad Request

#### POST /auth/reset-password/confirm
- Description: Confirm reset with token and set new password
- Request Body (JSON):
  - `token` (string, required)
  - `newPassword` (string, required)
- Response (200 OK): `{ "message": "Password updated" }`
- Errors: 400 Bad Request, 401 Unauthorized

#### GET /users/me
- Description: Get current user's profile
- Response (200 OK):
  ```json
  {
    "id": "uuid",
    "fullName": "string",
    "avatarUrl": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### PUT /users/me
- Description: Update current user's profile
- Request Body (JSON):
  - `fullName` (string, optional)
  - `avatarUrl` (string, optional)
- Response (200 OK): updated profile object
- Errors: 400 Bad Request

### 2.2 Flashcards

#### POST /flashcards
- Description: Create a new flashcard (manual)
- Request Body (JSON):
  - `front` (string, required)
  - `back` (string, required)
  - `source` (string, required, must be `manual`)
- Response (201 Created): full flashcard object with timestamps
- Errors: 400 Bad Request (missing fields), 422 Unprocessable Entity (invalid enum)

#### POST /flashcards/generate
- Description: Generate flashcards from free text via AI
- Request Body (JSON):
  ```json
  {
    "text": "string",
    "maxCards"?: 10
  }
  ```
- Response (200 OK): list of draft flashcards
  ```json
  [ { "front": "string", "back": "string" }, ... ]
  ```
- Errors: 400 Bad Request (text too short/long), 429 Too Many Requests

#### GET /flashcards
- Description: List current user's flashcards
- Query Params:
  - `page` (integer, default 1)
  - `pageSize` (integer, default 20)
  - `source` (string filter: `ai` or `manual`)
  - `sortBy` (string: `createdAt` or `updatedAt`)
  - `sortOrder` (string: `asc` or `desc`)
- Response (200 OK):
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "ai" | "manual",
        "approvalStatus": "approved" | "rejected" | "pending",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 123 }
  }
  ```
- Errors: 400 Bad Request

#### GET /flashcards/{flashcardId}
- Description: Get a single flashcard by ID
- Response (200 OK):
  ```json
  {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "source": "ai" | "manual",
    "approvalStatus": "approved" | "rejected" | "pending",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- Errors: 404 Not Found, 403 Forbidden

#### PATCH /flashcards/{flashcardId}
- Description: Update front/back of an existing flashcard
- Request Body (JSON): any of:
  - `front` (string)
  - `back` (string)
- Response (200 OK): updated flashcard object
- Errors: 400 Bad Request, 404 Not Found, 403 Forbidden

#### DELETE /flashcards/{flashcardId}
- Description: Delete a flashcard
- Response (204 No Content)
- Errors: 404 Not Found, 403 Forbidden

#### POST /flashcards/{flashcardId}/approve
- Description: Approve an AI-generated flashcard
- Response (200 OK): updated flashcard object (with `approvalStatus: "approved"`)

#### POST /flashcards/{flashcardId}/reject
- Description: Reject an AI-generated flashcard
- Response (200 OK): updated flashcard object (with `approvalStatus: "rejected"`)

### 2.3 Learning Sessions

#### POST /sessions
- Description: Start a new learning session
- Request Body (JSON):
  - `cardCount` (integer, optional – number of cards, default 20)
- Response (201 Created): `{ "id": "uuid", "startedAt": "timestamp" }`
- Errors: 400 Bad Request

#### GET /sessions
- Description: List past sessions (paginated)
- Query Params:
  - `page` (integer, default 1)
  - `pageSize` (integer, default 20)
  - `sortBy` (string: `startedAt` or `endedAt`)
  - `sortOrder` (string: `asc` or `desc`)
- Response (200 OK):
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "startedAt": "timestamp",
        "endedAt": "timestamp" | null,
        "cardCount": 20
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 45 }
  }
  ```

#### GET /sessions/{sessionId}
- Description: Get session details
- Response (200 OK):
  ```json
  {
    "id": "uuid",
    "startedAt": "timestamp",
    "endedAt": "timestamp" | null,
    "cardCount": 20
  }
  ```

#### GET /sessions/{sessionId}/flashcards
- Description: Fetch flashcards for review in this session
- Response (200 OK): list of flashcard objects with review metadata
- Errors: 404 Not Found, 403 Forbidden

#### PATCH /sessions/{sessionId}/flashcards/{flashcardId}
- Description: Record review result for a flashcard
- Request Body (JSON):
  - `status` (string, required: `correct` or `incorrect`)
- Response (200 OK): updated review record
- Errors: 400 Bad Request, 404 Not Found, 403 Forbidden

#### POST /sessions/{sessionId}/complete
- Description: Complete the learning session
- Response (200 OK): full session object with `endedAt`
- Errors: 400 Bad Request, 404 Not Found, 403 Forbidden

### 2.4 Admin Metrics

#### GET /admin/metrics
- Description: Retrieve system-wide metrics for administrators
- Query Params: none or optional time range filters
- Response (200 OK):
  ```json
  {
    "totalFlashcards": 1000,
    "aiFlashcards": 700,
    "manualFlashcards": 300,
    "acceptanceRateAi": 0.75,
    "weeklyRetention": 0.50,
    "averageSessionsPerUser": 3
  }
  ```
- Errors: 403 Forbidden

## 3. Authentication & Authorization

- **Mechanism**: Supabase JWT tokens issued on login/register. Use `Authorization: Bearer <token>` header.
- **RLS**: Tables `flashcards`, `sessions`, `profiles`, `session_flashcards` enforce ownership via RLS policies:
  - Only `auth.uid()` may select/update/delete own rows.
- **Roles**:
  - `authenticated`: access to own data only.
  - `admin`: allowed to call `/admin/*` endpoints.

## 4. Validation & Business Logic

1. **Field Validation**:
   - `front`, `back`: non-empty strings.
   - `source` ∈ {`ai`,`manual`}.
   - `status` ∈ {`correct`,`incorrect`,`approved`,`rejected`} as appropriate.
   - Text length limits enforced on `text` input for AI generation.
2. **Error Handling**:
   - Early return for invalid payloads (400).
   - 401 for missing/invalid auth.
   - 403 for forbidden access (RLS violation).
   - 404 for missing resources.
   - 422 for enum validation failures.
3. **Pagination & Sorting**:
   - Default `page_size=20`, max `page_size=100`.
   - Sort by timestamp fields; default `desc`.
4. **AI Generation Rate Limiting**:
   - Apply per-user limit (e.g. 5 requests/min).
5. **Session Flow**:
   - Create session record, then serve cards ordered by spaced‑repetition algorithm.
   - Record each review in `session_flashcards` with `reviewed_at` timestamp.
   - Conclude session by setting `ended_at`.

*This plan aligns with the given database schema, PRD requirements, and the Astro/TypeScript/Supabase tech stack, using RESTful conventions, JWT-based auth, and RLS for data security.* 