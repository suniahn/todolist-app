# TodoListApp 실행계획

Version 1.0 | 2026-05-13  
기반 문서: `2-prd.md`, `4-project-principles.md`, `5-arch-diagram.md`, `6-erd.md`

---

## 개요

| 항목 | 내용 |
|------|------|
| 개발 방식 | 문서 기반 개발(DDD), 레이어 독립 구현 |
| 구현 순서 | DB → Backend → Frontend (의존성 순) |
| 테스트 전략 | 레이어별 완료 조건 충족 후 통합 검증 |
| 금지 사항 | ORM 사용 금지, Cookie 토큰 저장 금지, `any` 타입 금지 |

---

## Phase 0: 프로젝트 초기 세팅

### TASK-0-1: 모노레포 구조 및 공통 환경 구성

**목표**: `backend/`, `frontend/` 디렉토리 구조 생성 및 공통 설정 파일 작성

**작업 항목**:
- [x] 루트 `.gitignore` 작성 (`.env`, `node_modules/`, `*.log`, `dist/`)
- [x] `backend/` 디렉토리 생성 및 `package.json` 초기화 (`npm init`)
- [x] `frontend/` 디렉토리 생성 및 Vite + React 19 + TypeScript 프로젝트 초기화
- [x] `backend/.env.example` 작성 (아래 변수 포함)
  ```
  DATABASE_URL=postgresql://user:password@localhost:5432/todolist_db
  JWT_SECRET=
  JWT_REFRESH_SECRET=
  JWT_EXPIRES_IN=1h
  JWT_REFRESH_EXPIRES_IN=7d
  PORT=3000
  NODE_ENV=development
  ALLOWED_ORIGINS=http://localhost:5173
  ```
- [x] `frontend/.env.example` 작성 (`VITE_API_BASE_URL=http://localhost:3000/api/v1`)

**완료 조건**:
- [x] `backend/`, `frontend/` 디렉토리가 루트에 존재
- [x] 각 디렉토리에 `package.json` 존재
- [x] `.env.example` 파일이 모든 필수 변수를 포함
- [x] `.env` 파일이 `.gitignore`에 포함

**의존성**: 없음

---

## Phase 1: 데이터베이스

### TASK-DB-1: PostgreSQL 연결 및 스키마 적용

**목표**: PostgreSQL 17 데이터베이스 생성 및 `database/schema.sql` 적용

**작업 항목**:
- [x] 데이터베이스 생성: `CREATE DATABASE todolist_db;`
- [x] pgcrypto 확장 활성화 확인: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
- [x] `database/schema.sql` 실행하여 3개 테이블 생성
  - `users` 테이블 (id, email, password, name, created_at, updated_at)
  - `categories` 테이블 (id, name, is_default, user_id, created_at)
  - `todos` 테이블 (id, user_id, category_id, title, description, start_date, due_date, is_completed, completed_at, created_at, updated_at)
- [x] 5개 인덱스 생성 확인
  - `idx_todos_user_id`, `idx_todos_category_id`, `idx_todos_due_date`
  - `idx_todos_is_completed`, `idx_categories_user_id`
- [x] 기본 카테고리 4종 시드 데이터 삽입 확인
  - 업무, 개인, 건강, 쇼핑 (`is_default=TRUE`, `user_id=NULL`)

**완료 조건**:
- [x] `\dt` 명령으로 `users`, `categories`, `todos` 테이블 3개 확인
- [x] `SELECT * FROM categories;` 결과에 4개 기본 카테고리 존재
- [x] `\d todos` 명령으로 CHECK 제약조건 `chk_todos_due_date` 확인
- [x] `\di` 명령으로 5개 인덱스 모두 확인
- [x] `gen_random_uuid()` 함수 호출 성공 확인

**의존성**: TASK-0-1

---

### TASK-DB-2: 데이터베이스 제약조건 검증

**목표**: 스키마의 모든 제약조건이 올바르게 작동하는지 SQL로 검증

**작업 항목**:
- [x] `uq_users_email` UNIQUE 제약 검증
  ```sql
  INSERT INTO users (email, password, name) VALUES ('test@test.com', 'hash', 'A');
  INSERT INTO users (email, password, name) VALUES ('test@test.com', 'hash', 'B'); -- 오류 확인
  ```
- [x] `chk_todos_due_date` CHECK 제약 검증
  ```sql
  -- 테스트용 더미 user/category 삽입 후:
  INSERT INTO todos (..., start_date, due_date) VALUES (..., '2026-05-15', '2026-05-10'); -- 오류 확인
  ```
- [x] `fk_todos_user` CASCADE 삭제 검증
  ```sql
  -- user 삭제 시 해당 user의 todos 자동 삭제 확인
  ```
- [x] `fk_todos_category` RESTRICT 동작 검증
  ```sql
  -- todos가 있는 category 삭제 시 FK 오류 확인
  ```
- [x] `user_id=NULL` 카테고리 접근 시 기본 카테고리 조회 확인

**완료 조건**:
- [x] 중복 이메일 INSERT 시 `duplicate key value violates unique constraint` 오류 발생
- [x] due_date < start_date INSERT 시 `violates check constraint` 오류 발생
- [x] user 삭제 시 todos 자동 삭제 (CASCADE) 동작 확인
- [x] todo 보유 category 삭제 시 FK 오류 발생
- [x] `WHERE is_default = TRUE OR user_id = $1` 쿼리로 5개 이상 카테고리 조회 성공

**의존성**: TASK-DB-1

---

## Phase 2: 백엔드

### TASK-BE-1: 프로젝트 구조 및 공통 모듈 세팅

**목표**: Express 앱 골격, DB 연결 풀, 에러 클래스 구현

**작업 항목**:
- [x] 백엔드 의존성 설치
  ```
  express, pg, bcrypt, jsonwebtoken, cors, dotenv
  ```
- [x] 디렉토리 구조 생성
  ```
  backend/src/
  ├── routes/
  ├── controllers/
  ├── services/
  ├── repositories/
  ├── middleware/
  ├── db/
  └── utils/
  ```
- [x] `src/db/pool.js` 구현 (pg.Pool, DATABASE_URL 환경변수 사용, max: 20)
- [x] `src/utils/errors.js` 구현
  - `AppError` 클래스 (code, message, statusCode 필드)
  - 11개 에러 코드 상수 정의
    - `AUTH_INVALID_CREDENTIALS` (401), `AUTH_EMAIL_DUPLICATE` (409)
    - `AUTH_TOKEN_EXPIRED` (401), `AUTH_UNAUTHORIZED` (401)
    - `TODO_NOT_FOUND` (404), `TODO_FORBIDDEN` (403), `TODO_INVALID_DATE` (400)
    - `CATEGORY_NOT_FOUND` (404), `CATEGORY_IN_USE` (409)
    - `VALIDATION_ERROR` (400), `INTERNAL_SERVER_ERROR` (500)
- [x] `src/middleware/error.middleware.js` 구현
  - AppError → `{ code, message }` JSON 응답 변환
  - 미처리 에러 → `INTERNAL_SERVER_ERROR` (500) 응답
- [x] `src/app.js` 구현 (CORS, JSON 파싱, 라우터 마운트, 에러 미들웨어 등록)
- [x] `src/index.js` 구현 (dotenv 로드, 서버 시작)

**완료 조건**:
- [x] `node src/index.js` 실행 시 `Server running on port 3000` 출력
- [x] `pool.query('SELECT 1')` 성공 (DB 연결 확인)
- [x] 존재하지 않는 라우트 요청 시 404 응답
- [x] 의도적 에러 발생 시 `{ code, message }` 형식의 JSON 응답 반환

**의존성**: TASK-0-1, TASK-DB-1

---

### TASK-BE-2: 인증 미들웨어 구현

**목표**: JWT Access Token 검증 미들웨어 구현

**작업 항목**:
- [x] `src/middleware/auth.middleware.js` 구현
  - `Authorization: Bearer <token>` 헤더 추출
  - 헤더 없음 → `AUTH_UNAUTHORIZED` (401) throw
  - `jwt.verify(token, JWT_SECRET)` 검증
  - 토큰 만료 → `AUTH_TOKEN_EXPIRED` (401) throw
  - 서명 오류 → `AUTH_UNAUTHORIZED` (401) throw
  - 검증 성공 → `req.userId = payload.sub` 설정 후 next()

**완료 조건**:
- [x] Authorization 헤더 없는 요청 → 401 `AUTH_UNAUTHORIZED`
- [x] 만료된 JWT → 401 `AUTH_TOKEN_EXPIRED`
- [x] 서명이 틀린 JWT → 401 `AUTH_UNAUTHORIZED`
- [x] 유효한 JWT → `req.userId`에 UUID 문자열 설정

**의존성**: TASK-BE-1

---

### TASK-BE-3: 사용자 레포지토리 및 인증 서비스 구현

**목표**: 회원가입, 로그인, 토큰 갱신, 로그아웃 API 구현

**작업 항목**:
- [x] `src/repositories/user.repository.js` 구현
  - `findByEmail(email)` → `SELECT * FROM users WHERE email = $1` (bcrypt 비교를 위해 password 필드 포함)
  - `findById(id)` → `SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1` (password 필드 제외)
  - `create({ email, hashedPassword, name })` → `INSERT INTO users ... RETURNING id, email, name, created_at, updated_at` (password 필드 제외)
- [x] `src/services/auth.service.js` 구현
  - `register(email, password, name)`:
    - 이메일 중복 확인 → `AUTH_EMAIL_DUPLICATE` (409)
    - bcrypt.hash(password, 12)
    - user.repository.create()
  - `login(email, password)`:
    - user.repository.findByEmail() → 없으면 `AUTH_INVALID_CREDENTIALS` (401)
    - bcrypt.compare() → 불일치 시 `AUTH_INVALID_CREDENTIALS` (401)
    - Access Token (1h) + Refresh Token (7d) 생성 반환
  - `refreshToken(refreshToken)`:
    - jwt.verify(token, JWT_REFRESH_SECRET)
    - 만료 → `AUTH_TOKEN_EXPIRED` (401)
    - 새 Access Token 생성 반환
  - `logout(refreshToken)`: MVP는 클라이언트 측 삭제로 처리 (서버 blacklist 생략)
- [x] `src/controllers/auth.controller.js` 구현 (입력 검증 + HTTP 직렬화)
  - register: email RFC 5322 형식, password 8자+영문+숫자, name 1-50자
  - login: email/password 필수 여부 검증
- [x] `src/routes/auth.routes.js` 구현
  - `POST /auth/register` → auth.controller.register
  - `POST /auth/login` → auth.controller.login
  - `POST /auth/logout` → authMiddleware → auth.controller.logout
  - `POST /auth/refresh` → auth.controller.refresh

**완료 조건**:
- [x] `POST /auth/register` 성공 → 201, 유저 정보 반환 (password 필드 제외)
- [x] `POST /auth/register` 중복 이메일 → 409 `AUTH_EMAIL_DUPLICATE`
- [x] `POST /auth/register` 잘못된 입력 → 400 `VALIDATION_ERROR`
- [x] `POST /auth/login` 성공 → 200, `{ accessToken, refreshToken }` 반환
- [x] `POST /auth/login` 잘못된 비밀번호 → 401 `AUTH_INVALID_CREDENTIALS`
- [x] `POST /auth/refresh` 유효한 RT → 200, `{ accessToken }` 반환
- [x] `POST /auth/refresh` 만료된 RT → 401 `AUTH_TOKEN_EXPIRED`
- [x] `POST /auth/logout` AT 없음 → 401 `AUTH_UNAUTHORIZED`
- [x] DB에 비밀번호가 bcrypt 해시로 저장됨 확인 (`$2b$12$` 접두사)

**의존성**: TASK-BE-1, TASK-BE-2

---

### TASK-BE-4: 카테고리 API 구현

**목표**: 사용자 접근 가능한 카테고리 목록 조회 API 구현

**작업 항목**:
- [x] `src/repositories/category.repository.js` 구현
  - `findAllByUser(userId)`:
    ```sql
    SELECT * FROM categories
    WHERE is_default = TRUE OR user_id = $1
    ORDER BY is_default DESC, name ASC
    ```
  - `findById(categoryId)` → 카테고리 존재/접근 권한 확인용
- [x] `src/services/category.service.js` 구현
  - `getCategories(userId)` → category.repository.findAllByUser(userId)
  - `validateCategoryAccess(categoryId, userId)`:
    - category.repository.findById() → 없으면 `CATEGORY_NOT_FOUND` (404)
    - `is_default=TRUE` 이거나 `user_id === userId` 이면 접근 허용
    - 그 외 → `CATEGORY_NOT_FOUND` (404)
- [x] `src/controllers/category.controller.js` 구현
- [x] `src/routes/category.routes.js` 구현
  - `GET /categories` → authMiddleware → category.controller.getAll

**완료 조건**:
- [x] `GET /categories` (AT 포함) → 200, 4개 기본 카테고리 배열 반환
- [x] `GET /categories` AT 없음 → 401 `AUTH_UNAUTHORIZED`
- [x] 응답에 `id`, `name`, `is_default`, `user_id` 필드 포함
- [x] validateCategoryAccess: 존재하지 않는 categoryId → `CATEGORY_NOT_FOUND`

**의존성**: TASK-BE-2, TASK-DB-1

---

### TASK-BE-5: Todo CRUD API 구현

**목표**: Todo 생성, 조회, 수정, 삭제 API 구현 (BR-03, BR-07, BR-08 적용)

**작업 항목**:
- [x] `src/repositories/todo.repository.js` 구현
  - `findById(todoId)` → `SELECT * FROM todos WHERE id = $1`
  - `findAllByUser(userId, filters)`:
    ```sql
    SELECT * FROM todos
    WHERE user_id = $1
      AND ($2::uuid IS NULL OR category_id = $2)
      AND ($3::boolean IS NULL OR is_completed = $3)
    ORDER BY due_date ASC
    OFFSET $4 LIMIT $5
    ```
  - `countByUser(userId, filters)` → 전체 개수 (페이지네이션용)
  - `create({ userId, categoryId, title, description, startDate, dueDate })` → `INSERT INTO todos ... RETURNING *`
  - `update(todoId, fields)` → `UPDATE todos SET ..., updated_at=NOW() WHERE id=$1 RETURNING *`
  - `deleteTodo(todoId)` → `DELETE FROM todos WHERE id = $1`
- [x] `src/services/todo.service.js` 구현
  - `createTodo(userId, payload)`:
    - category.service.validateCategoryAccess(categoryId, userId)
    - `due_date >= start_date` 검증 → `TODO_INVALID_DATE` (400)
    - todo.repository.create()
  - `getTodos(userId, filters, page, limit)`:
    - `schedule_status=overdue` → `due_date < TODAY AND is_completed=false` 조건 추가
    - `schedule_status=ongoing` → `due_date >= TODAY OR is_completed=true` 조건 추가
    - todo.repository.findAllByUser() + countByUser()
  - `getTodoById(todoId, userId)`:
    - findById() → 없으면 `TODO_NOT_FOUND` (404)
    - `todo.user_id !== userId` → `TODO_FORBIDDEN` (403)
  - `updateTodo(todoId, userId, payload)`:
    - getTodoById() (소유권 확인 포함)
    - categoryId 변경 시 validateCategoryAccess()
    - 날짜 검증
    - todo.repository.update()
  - `deleteTodo(todoId, userId)`:
    - getTodoById() (소유권 확인 포함)
    - todo.repository.delete()
- [x] `src/controllers/todo.controller.js` 구현 (입력 검증 + HTTP 직렬화)
  - title: 필수, max 200자
  - description: 선택, max 1000자
  - start_date, due_date: 필수, YYYY-MM-DD 형식
  - category_id: 필수, UUID 형식
  - 쿼리 파라미터: page/limit 숫자 변환
- [x] `src/routes/todo.routes.js` 구현
  - `GET /todos` → todo.controller.getAll
  - `POST /todos` → todo.controller.create
  - `GET /todos/:id` → todo.controller.getOne
  - `PUT /todos/:id` → todo.controller.update
  - `DELETE /todos/:id` → todo.controller.deleteTodo

**완료 조건**:
- [x] `POST /todos` 성공 → 201, 생성된 todo 반환 (is_completed=false, completed_at=null)
- [x] `POST /todos` due_date < start_date → 400 `TODO_INVALID_DATE`
- [x] `POST /todos` 존재하지 않는 category_id → 404 `CATEGORY_NOT_FOUND`
- [x] `GET /todos` → 200, `{ todos: [], pagination: { page, limit, total } }` 반환
- [x] `GET /todos?category_id=...` → 해당 카테고리 todo만 반환
- [x] `GET /todos?is_completed=true` → 완료된 todo만 반환
- [x] `GET /todos?schedule_status=overdue` → due_date < 오늘 AND is_completed=false 만 반환
- [x] `GET /todos/:id` 타인 todo 조회 → 403 `TODO_FORBIDDEN`
- [x] `PUT /todos/:id` 성공 → 200, updated_at이 갱신된 todo 반환
- [x] `DELETE /todos/:id` 성공 → 204 No Content
- [x] `DELETE /todos/:id` 타인 todo → 403 `TODO_FORBIDDEN`

**의존성**: TASK-BE-2, TASK-BE-4

---

### TASK-BE-6: Todo 완료 토글 API 구현

**목표**: `PATCH /todos/:id/toggle` 구현 (BR-09)

**작업 항목**:
- [x] `todo.repository.js`에 `toggleCompletion(todoId, currentCompleted)` 추가
  ```sql
  UPDATE todos
  SET is_completed = $2,
      completed_at = CASE WHEN $2 = TRUE THEN NOW() ELSE NULL END,
      updated_at   = NOW()
  WHERE id = $1
  RETURNING *
  ```
- [x] `todo.service.js`에 `toggleTodo(todoId, userId)` 추가
  - getTodoById() (소유권 확인)
  - 현재 `is_completed` 반전하여 repository.toggleCompletion() 호출
- [x] `todo.controller.js`에 `toggle` 핸들러 추가
- [x] `todo.routes.js`에 `PATCH /todos/:id/toggle` 등록

**완료 조건**:
- [x] 미완료 todo 토글 → `is_completed=true`, `completed_at=<현재시각>` 반환
- [x] 완료된 todo 재토글 → `is_completed=false`, `completed_at=null` 반환
- [x] updated_at 갱신 확인
- [x] 타인 todo 토글 → 403 `TODO_FORBIDDEN`
- [x] 존재하지 않는 todo 토글 → 404 `TODO_NOT_FOUND`

**의존성**: TASK-BE-5

---

### TASK-BE-7: 백엔드 통합 검증

**목표**: 전체 API 흐름 통합 검증 (인증 → 카테고리 → Todo CRUD)

**작업 항목**:
- [x] HTTP 클라이언트(curl)로 SCN-01~10 전체 시나리오 수동 실행 (47/47 PASS)
- [x] 회원가입 → 로그인 → todo 생성 → 수정 → 완료 토글 → 삭제 전체 흐름 확인
- [x] Access Token 만료 시뮬레이션 후 Refresh Token으로 갱신 확인
- [x] 다른 사용자의 todo 접근 시도 → 403 확인
- [x] 카테고리 필터, 완료 필터, schedule_status 필터 개별/복합 동작 확인
- [x] 모든 에러 코드 응답이 `{ code, message }` 형식인지 확인
- [x] Swagger UI 추가 (`GET /api-docs`, `swagger-ui-express` 패키지, `swagger/swagger.json` 연동)
- [x] 주요 지점 console log 추가 (`[HTTP]` 요청 로거, `[AUTH]` 인증 이벤트, `[TODO]` CRUD 이벤트, `[ERROR]` 에러 처리)
- [x] `pg` DATE 타입 파서 설정 (`types.setTypeParser`) — DATE 컬럼을 `YYYY-MM-DD` 문자열로 반환 (타임존 변환 방지)

**완료 조건**:
- [x] 9개 엔드포인트 모두 성공 케이스 동작 확인
- [x] 11개 에러 코드 중 구현된 모든 코드의 HTTP 상태코드 정확성 확인
- [x] 다른 사용자 데이터 격리 (BR-03) 확인
- [x] 응답 본문에 password 필드 미포함 확인 (user.repository.js 명시적 컬럼 선택으로 구현)
- [x] pg 파라미터 바인딩 사용 (SQL 인젝션 방지) 코드 리뷰 확인
- [x] Swagger UI (`http://localhost:3000/api-docs`) 접근 확인
- [x] DATE 컬럼 타임존 변환 문제 수정 확인 (YYYY-MM-DD 형식 응답)

**의존성**: TASK-BE-3 ~ TASK-BE-6 모두

---

## Phase 3: 프론트엔드

### TASK-FE-1: 프로젝트 구조 및 공통 설정

**목표**: React 19 + TypeScript 프로젝트 구조 생성 및 공통 모듈 구현

**작업 항목**:
- [ ] 의존성 설치
  ```
  zustand, @tanstack/react-query, axios
  ```
- [ ] 디렉토리 구조 생성
  ```
  frontend/src/
  ├── pages/
  ├── components/
  │   ├── auth/
  │   ├── todo/
  │   └── common/
  ├── hooks/
  ├── store/
  ├── api/
  ├── types/
  └── utils/
  ```
- [ ] `src/types/domain.ts` 작성
  - `User`, `Category`, `Todo` 인터페이스 정의
- [ ] `src/types/api.ts` 작성
  - `CreateTodoPayload`, `UpdateTodoPayload`
  - `LoginPayload`, `RegisterPayload`, `AuthResponse`
  - `TodoFilters` (category_id?, is_completed?, schedule_status?: `'ongoing' | 'overdue'`)
  - `PaginatedResponse<T>` (todos, pagination)
- [ ] `tsconfig.json` strict 모드 활성화 확인

**완료 조건**:
- [ ] `npm run dev` 실행 시 브라우저에서 기본 화면 접근 가능
- [ ] TypeScript 컴파일 오류 없음 (`npm run build` 성공)
- [ ] ESLint 오류 없음 (`npm run lint` 성공)
- [ ] 모든 타입 파일에 `any` 미사용

**의존성**: TASK-0-1

---

### TASK-FE-2: Zustand authStore 및 axios 클라이언트 구현

**목표**: 인증 상태 관리 스토어와 API 클라이언트(토큰 자동 갱신 인터셉터) 구현

**작업 항목**:
- [ ] `src/store/authStore.ts` 구현
  - 상태: `accessToken`, `refreshToken`, `currentUser`
  - 액션: `setTokens()`, `setCurrentUser()`, `clearAuth()`, `isAuthenticated()`
  - 저장소: 메모리(Zustand 기본값, persist 미사용)
- [ ] `src/api/client.ts` 구현
  - axios 인스턴스 생성 (baseURL: `VITE_API_BASE_URL`)
  - **요청 인터셉터**: authStore에서 accessToken 읽어 `Authorization: Bearer` 헤더 자동 첨부
  - **응답 인터셉터** (SCN-09 토큰 자동 갱신):
    - 401 + `AUTH_TOKEN_EXPIRED` 감지
    - `POST /auth/refresh { refreshToken }` 호출
    - 성공 → authStore accessToken 업데이트 → 원본 요청 재시도
    - 실패 → authStore clearAuth() → `/login` 리다이렉트
- [ ] `src/api/auth.ts` 구현
  - `register(email, password, name)`
  - `login(email, password)` → `AuthResponse`
  - `logout(refreshToken)`
  - `refreshAccessToken(refreshToken)` → `{ accessToken }`
- [ ] `src/api/categories.ts` 구현
  - `fetchCategories()` → `Category[]`
- [ ] `src/api/todos.ts` 구현
  - `fetchTodos(filters, page, limit)` → `PaginatedResponse<Todo>`
  - `fetchTodo(id)` → `Todo`
  - `createTodo(payload)` → `Todo`
  - `updateTodo(id, payload)` → `Todo`
  - `deleteTodo(id)` → `void`
  - `toggleTodo(id)` → `Todo`

**완료 조건**:
- [ ] authStore에 토큰 저장 후 API 요청 시 Authorization 헤더 자동 포함 확인
- [ ] 401 `AUTH_TOKEN_EXPIRED` 응답 시 자동으로 /auth/refresh 호출 후 원본 요청 재시도 동작
- [ ] RT 만료 시 clearAuth() 호출 후 /login으로 리다이렉트
- [ ] 페이지 새로고침 시 authStore 초기화 (메모리 저장 확인)
- [ ] TypeScript 컴파일 오류 없음

**의존성**: TASK-FE-1, TASK-BE-3

---

### TASK-FE-3: 인증 페이지 구현 (로그인/회원가입)

**목표**: LoginPage, SignupPage 구현 (UC-01, UC-02)

**작업 항목**:
- [ ] `src/components/auth/LoginForm.tsx` 구현
  - 필드: email, password
  - 클라이언트 검증: 이메일 형식, 비밀번호 필수
  - 제출 중 버튼 비활성화
  - 에러: "이메일 또는 비밀번호가 올바르지 않습니다" 인라인 표시
- [ ] `src/components/auth/SignupForm.tsx` 구현
  - 필드: email, password, name
  - 클라이언트 검증: 이메일 RFC 5322, 비밀번호 8자+영문+숫자, 이름 1-50자
  - 실시간 인라인 에러 표시
  - 에러: 중복 이메일("이미 사용 중인 이메일입니다"), 형식 오류
- [ ] `src/hooks/useAuth.ts` 구현
  - `login(email, password)`: api.auth.login() → authStore.setTokens() → navigate('/')
  - `signup(email, password, name)`: api.auth.register() → api.auth.login() → navigate('/')
  - `logout()`: api.auth.logout(RT) → authStore.clearAuth() → queryClient.clear() → navigate('/login')
- [ ] `src/pages/LoginPage.tsx` 구현
- [ ] `src/pages/SignupPage.tsx` 구현
- [ ] `src/components/common/ProtectedRoute.tsx` 구현
  - authStore.isAuthenticated() === false → `<Navigate to="/login" />`
- [ ] `src/App.tsx` 라우팅 설정
  - `/login` → LoginPage
  - `/register` → SignupPage
  - `/` → ProtectedRoute → TodoListPage

**완료 조건**:
- [ ] 올바른 이메일/비밀번호 로그인 → `/` 리다이렉트
- [ ] 잘못된 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다" 표시
- [ ] 회원가입 성공 → 자동 로그인 후 `/` 리다이렉트
- [ ] 중복 이메일 회원가입 → "이미 사용 중인 이메일입니다" 표시
- [ ] 비밀번호 7자 → 폼 검증 오류 (제출 불가)
- [ ] `/`에 비인증 접근 → `/login` 리다이렉트

**의존성**: TASK-FE-2, TASK-BE-3

---

### TASK-FE-4: Todo 목록 및 필터 구현

**목표**: TodoListPage 구현 (UC-08, SCN-04)

**작업 항목**:
- [ ] `src/hooks/useCategories.ts` 구현
  - TanStack Query: `['categories']` 키, fetchCategories() 호출
- [ ] `src/hooks/useTodos.ts` 구현
  - TanStack Query: `['todos', filters, page]` 키
  - filters 변경 시 자동 재조회
  - 반환: `data`, `isLoading`, `error`, `refetch`
- [ ] `src/components/todo/TodoFilter.tsx` 구현
  - 카테고리 드롭다운 (4개 기본 카테고리)
  - 완료 여부 체크박스 (미완료만 / 전체 / 완료만)
  - 일정 상태 라디오버튼 (전체 / 진행 중 / 기간초과)
  - 필터 변경 → useTodos 쿼리 파라미터 업데이트
- [ ] `src/components/todo/TodoCard.tsx` 구현
  - 표시: 제목, 카테고리명, 시작일, 종료예정일, 완료 상태
  - 완료된 todo: 제목 취소선, 회색 처리
  - 액션: 완료 체크박스(TASK-FE-5), 수정 버튼, 삭제 버튼
- [ ] `src/components/todo/TodoList.tsx` 구현
  - TodoCard 목록 렌더링
  - 로딩 중: 스피너/스켈레톤 표시
  - 비어있을 때: "할일이 없습니다" 안내 메시지
  - 페이지네이션 컨트롤 (이전/다음 버튼)
- [ ] `src/pages/TodoListPage.tsx` 구현
  - "새로운 할일 추가" 버튼 → `/todos/new` 이동
  - 로그아웃 버튼 → useAuth().logout()
  - TodoFilter + TodoList 조합

**완료 조건**:
- [ ] 로그인 후 `/` 접근 시 todo 목록 표시 (초기 빈 목록 포함)
- [ ] 카테고리 필터 선택 시 해당 카테고리 todo만 표시
- [ ] 완료 필터 선택 시 완료/미완료 todo 분리 표시
- [ ] schedule_status=overdue 선택 시 due_date 지난 미완료 todo만 표시
- [ ] 완료된 todo에 취소선 스타일 적용 확인
- [ ] 빈 목록일 때 "할일이 없습니다" 메시지 표시
- [ ] 20개 초과 시 페이지네이션 동작

**의존성**: TASK-FE-3, TASK-BE-4, TASK-BE-5

---

### TASK-FE-5: Todo 완료 토글 구현

**목표**: PATCH /todos/:id/toggle 연동 (UC-07, SCN-05)

**작업 항목**:
- [ ] `src/hooks/useTodoMutations.ts`에 `toggleTodo` mutation 구현
  - `useMutation({ mutationFn: (id) => api.todos.toggleTodo(id) })`
  - 성공 시: `['todos']` 쿼리 무효화 (목록 자동 갱신)
  - 성공 시: 토스트 메시지 ("할일이 완료되었습니다" / "할일이 미완료 상태로 복원되었습니다")
  - 실패 시: 토스트 에러 메시지
- [ ] `TodoCard.tsx`에 완료 체크박스 토글 연결
  - 클릭 → `toggleTodo(todo.id)` 호출
  - `isPending` 중 체크박스 비활성화
  - 완료 상태에 따라 체크박스 체크/해제

**완료 조건**:
- [ ] 미완료 todo 체크박스 클릭 → 완료 처리 후 취소선 표시
- [ ] 완료된 todo 체크박스 클릭 → 미완료 복원 후 취소선 제거
- [ ] 토글 중 체크박스 비활성화 (중복 클릭 방지)
- [ ] 성공 토스트 메시지 표시

**의존성**: TASK-FE-4, TASK-BE-6

---

### TASK-FE-6: Todo 생성 및 수정 페이지 구현

**목표**: TodoCreatePage, TodoEditPage 구현 (UC-04, UC-05, SCN-01, SCN-06)

**작업 항목**:
- [ ] `src/components/todo/TodoForm.tsx` 구현 (생성/수정 공용)
  - 필드: title (max 200), description (max 1000), start_date, due_date, category_id 드롭다운
  - 실시간 클라이언트 검증:
    - title: 필수, 200자 카운터 표시
    - description: 1000자 카운터 표시
    - due_date < start_date: 경고 + 제출 버튼 비활성화 (SCN-03)
    - category_id: 필수 (드롭다운 선택 필요)
  - 제출 중 버튼 비활성화
  - 서버 에러 인라인 표시
- [ ] `src/hooks/useTodoMutations.ts`에 나머지 mutation 추가
  - `createTodo(payload)`: POST /todos → 성공 시 `/` 리다이렉트 + `['todos']` 무효화
  - `updateTodo(id, payload)`: PUT /todos/:id → 성공 시 `/` 리다이렉트 + `['todos']` 무효화
  - `deleteTodo(id)`: DELETE /todos/:id → 성공 시 목록 무효화 + 토스트
- [ ] `src/pages/TodoCreatePage.tsx` 구현
  - TodoForm (빈 초기값)
  - 제출 → `createTodo()` 호출
- [ ] `src/pages/TodoEditPage.tsx` 구현
  - `GET /todos/:id`로 기존 데이터 로드 후 TodoForm 초기값 설정
  - 제출 → `updateTodo()` 호출
- [ ] `src/components/todo/DeleteConfirmModal.tsx` 구현
  - "정말로 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다." 메시지
  - 확인/취소 버튼
  - 확인 → `deleteTodo()` 호출
- [ ] `App.tsx` 라우트 추가
  - `/todos/new` → ProtectedRoute → TodoCreatePage
  - `/todos/:id/edit` → ProtectedRoute → TodoEditPage

**완료 조건**:
- [ ] 필드 누락 시 제출 버튼 비활성화 및 인라인 에러 표시
- [ ] due_date < start_date 입력 시 즉시 경고 표시 + 제출 불가
- [ ] todo 생성 성공 → `/` 리다이렉트 후 새 todo 목록에 표시
- [ ] todo 수정 폼에 기존 값이 사전 입력됨
- [ ] todo 수정 성공 → `/` 리다이렉트 후 변경 내용 반영
- [ ] 삭제 확인 모달 표시 → 확인 클릭 → todo 목록에서 제거
- [ ] 삭제 성공 토스트 메시지 표시

**의존성**: TASK-FE-4, TASK-BE-5

---

### TASK-FE-7: 프론트엔드 통합 및 반응형 검증

**목표**: 전체 사용자 시나리오(SCN-01~10) 브라우저 동작 검증 및 반응형 확인

**작업 항목**:
- [ ] SCN-01: 회원가입 → 자동로그인 → todo 생성 전체 흐름 확인
- [ ] SCN-02: 잘못된 비밀번호 → 단일 오류 메시지 표시 → 재입력 성공
- [ ] SCN-03: due_date < start_date 입력 → 실시간 경고 → 수정 후 제출 성공
- [ ] SCN-04: 카테고리 + 기간초과 필터 복합 적용 확인
- [ ] SCN-05: todo 완료 토글 → 취소선 표시 → 재토글 복원
- [ ] SCN-06: todo 수정 → 카테고리 변경 → 저장 확인
- [ ] SCN-07: 삭제 확인 모달 → 삭제 실행 → 목록에서 제거
- [ ] SCN-09: (AT 만료 시뮬레이션) 자동 갱신 후 원본 요청 재시도 확인
- [ ] SCN-10: 로그아웃 → `/login` 리다이렉트 → `/` 직접 접근 차단
- [ ] 반응형 검증: 브라우저 너비 1024px 이상/미만에서 레이아웃 확인
- [ ] 콘솔 에러 없음 확인

**완료 조건**:
- [ ] SCN-01~10 모든 시나리오 브라우저에서 정상 동작
- [ ] 로그인된 사용자 A가 사용자 B의 todo에 접근 시 서버 403 응답 처리 확인
- [ ] 반응형: 1024px 이상 정상 레이아웃, 768px에서 세로 스택 레이아웃
- [ ] TypeScript 컴파일 오류, ESLint 오류, 콘솔 에러 없음

**의존성**: TASK-FE-3 ~ TASK-FE-6 모두, TASK-BE-7

---

## 구현 순서 요약 및 의존성 그래프

```
TASK-0-1 (초기 세팅)
    │
    ├── TASK-DB-1 (스키마 적용)
    │       │
    │       └── TASK-DB-2 (제약조건 검증)
    │
    └── TASK-BE-1 (공통 모듈)
            │
            ├── TASK-BE-2 (인증 미들웨어)
            │       │
            │       ├── TASK-BE-3 (인증 API) ─────────────────────┐
            │       └── TASK-BE-4 (카테고리 API)                   │
            │               │                                      │
            │               └── TASK-BE-5 (Todo CRUD API)         │
            │                       │                              │
            │                       └── TASK-BE-6 (토글 API)      │
            │                               │                      │
            │                               └── TASK-BE-7 (통합)  │
            │                                                      │
            └── TASK-FE-1 (FE 구조)                               │
                    │                                              │
                    └── TASK-FE-2 (스토어 + API 클라이언트)        │
                            │                                      │
                            └── TASK-FE-3 (인증 페이지) ──────────┘
                                    │
                                    └── TASK-FE-4 (목록 + 필터)
                                            │
                                            ├── TASK-FE-5 (완료 토글)
                                            └── TASK-FE-6 (생성/수정/삭제)
                                                    │
                                                    └── TASK-FE-7 (통합 검증)
```

---

## 병렬 실행 가능 태스크

| 병렬 그룹 | 태스크 | 조건 |
|-----------|--------|------|
| **그룹 A** | TASK-DB-1 + TASK-BE-1 | TASK-0-1 완료 후 |
| **그룹 B** | TASK-DB-2 + TASK-BE-2 | 각각 TASK-DB-1, TASK-BE-1 완료 후 |
| **그룹 C** | TASK-BE-3 + TASK-BE-4 | TASK-BE-2 완료 후 |
| **그룹 D** | TASK-FE-1 | TASK-0-1 완료 후 (백엔드와 병렬 가능) |
| **그룹 E** | TASK-BE-5 + TASK-FE-2 | 각각 선행 태스크 완료 후 |

---

## 비기능 요구사항 체크리스트

### 보안
- [x] 모든 SQL 쿼리 파라미터 바인딩 사용 (`$1`, `$2`) — SQL 인젝션 방지
- [x] bcrypt saltRounds ≥ 12
- [x] JWT 시크릿 환경변수 로드 (하드코딩 금지)
- [x] 응답에 password 필드 미포함 (user.repository.js 명시적 컬럼 선택)
- [x] CORS 허용 오리진 명시적 설정 (`ALLOWED_ORIGINS` 환경변수)

### 성능
- [x] 5개 DB 인덱스 적용 확인
- [x] 페이지네이션 기본값 limit=20 적용

### 코드 품질
- [x] ORM 미사용 확인 (pg 직접 사용)
- [x] Set-Cookie 응답 헤더 미사용 (토큰은 JSON body)
- [ ] `any` 타입 미사용 (TypeScript strict) — 프론트엔드 미구현
- [ ] ESLint 오류 없음 — 프론트엔드 미구현
- [ ] localStorage 토큰 저장 미사용 (Zustand 메모리 저장) — 프론트엔드 미구현
