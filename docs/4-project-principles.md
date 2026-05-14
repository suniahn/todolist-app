# TodoListApp 프로젝트 구조 설계 원칙

Version 1.0 | 2026-05-13

---

## 1. 최상위 원칙 (모든 스택 공통)

### 1.1 도메인 우선 (Domain-First)

- 코드의 모든 구조적 결정은 `1-domain-definition.md`에 정의된 유비쿼터스 언어를 기준으로 한다.
- 엔티티 이름(`User`, `Todo`, `Category`), 비즈니스 규칙(BR-01~09), 도메인 이벤트는 코드에 그대로 반영한다.
- 기술적 편의를 위해 도메인 개념을 왜곡하지 않는다. 예: `TodoItem`, `TaskData` 같은 이름 금지.

### 1.2 단순성 우선 (Simplicity First)

- MVP 범위(UC-01~02, UC-04~08, 로그아웃)에만 집중한다. 2차 기능(UC-03, UC-09~10, OAuth, 다크모드)을 위한 사전 추상화를 만들지 않는다.
- 세 번 반복되는 패턴이 생기기 전까지 추상화하지 않는다.
- 미래 요구사항을 위한 플래그, 옵션, 플러그인 구조를 미리 만들지 않는다.

### 1.3 경계 명확성 (Clear Boundaries)

- 사용자 데이터 격리(BR-03): 모든 데이터 접근 경로에서 `user_id` 스코핑을 강제한다.
- 기본 카테고리(`is_default=true`, `user_id=NULL`)와 사용자 카테고리는 코드 레벨에서 명확히 구분한다.
- 인증 경계: 인증이 필요한 모든 엔드포인트/라우트는 명시적으로 보호 처리한다.

### 1.4 오류를 숨기지 않는다 (Explicit Over Silent)

- 예외 처리는 `docs/2-prd.md` §10의 에러 코드(`AUTH_*`, `TODO_*`, `CATEGORY_*` 등) 기준으로 명시적으로 처리한다.
- 조용한 실패(silent failure)를 허용하지 않는다. 서버는 항상 정해진 에러 응답을 반환한다.
- 클라이언트는 모든 API 오류에 대해 사용자에게 피드백을 제공한다.

---

## 2. 의존성 / 레이어 원칙

### 2.1 백엔드 레이어 구조

```
Request → Router → Controller → Service → Repository → Database
```

| 레이어 | 역할 | 허용 의존성 |
|--------|------|-------------|
| Router | URL 매핑, 미들웨어 연결 | Controller, Middleware |
| Controller | HTTP 파싱/직렬화, 입력 검증 | Service |
| Service | 비즈니스 규칙 실행 (BR-01~09) | Repository |
| Repository | SQL 쿼리, `pg` 직접 사용 | DB Pool |
| Middleware | Auth, 에러 처리 | Service (auth만), 없음 |

**규칙:**
- Controller는 SQL을 직접 작성하지 않는다.
- Service는 `req`, `res` 객체를 알지 못한다.
- Repository는 비즈니스 로직을 포함하지 않는다.
- **ORM 사용 금지**: `pg` 라이브러리만 직접 사용한다 (PRD 기술 스택 제약).

### 2.2 프론트엔드 레이어 구조

```
Page → Component → Hook (TanStack Query / Zustand) → API Client → Server
```

| 레이어 | 역할 | 허용 의존성 |
|--------|------|-------------|
| Page | 라우트 단위 화면, 레이아웃 조합 | Component, Hook |
| Component | UI 렌더링, 사용자 이벤트 처리 | Hook (데이터), 하위 Component |
| Hook | 서버 상태(TanStack Query), 클라이언트 상태(Zustand) | API Client, Store |
| API Client | axios 인스턴스, 인터셉터, 엔드포인트 함수 | 없음 (순수 HTTP) |
| Store | 전역 클라이언트 상태 (인증 토큰, 사용자 정보) | 없음 |

**규칙:**
- Page는 비즈니스 로직을 직접 포함하지 않는다. Hook으로 위임한다.
- Component는 API를 직접 호출하지 않는다.
- 서버 상태(Todo 목록, Category 목록)는 TanStack Query로 관리한다.
- 클라이언트 상태(로그인 여부, 토큰)는 Zustand로 관리한다.

### 2.3 의존성 방향 규칙

- 의존성은 항상 외부 → 내부 방향이다. 내부 레이어가 외부 레이어를 참조하지 않는다.
- 공유 타입/인터페이스는 별도 `types/` 디렉토리에 위치하며 모든 레이어에서 참조 가능하다.
- 프론트엔드와 백엔드는 REST API 계약으로만 결합된다. 코드를 공유하지 않는다.

---

## 3. 코드 / 네이밍 원칙

### 3.1 유비쿼터스 언어 준수

도메인 문서의 용어를 코드 식별자에 직접 사용한다.

| 도메인 개념 | 코드 식별자 (올바름) | 금지 예시 |
|-------------|---------------------|-----------|
| Todo | `todo`, `Todo`, `todos` | `task`, `item`, `TodoData` |
| Category | `category`, `Category` | `tag`, `group`, `CategoryItem` |
| is_completed | `isCompleted`, `is_completed` | `done`, `finished`, `checked` |
| completed_at | `completedAt`, `completed_at` | `doneAt`, `finishTime` |
| schedule_status | `scheduleStatus` | `status`, `timing` |
| due_date | `dueDate`, `due_date` | `deadline`, `endDate` |

### 3.2 파일 및 디렉토리 네이밍

**백엔드:**
- 파일명: `kebab-case` (예: `todo-service.js`, `auth-middleware.js`)
- 클래스/생성자: `PascalCase` (예: `TodoService`)
- 함수/변수: `camelCase` (예: `createTodo`, `userId`)
- DB 컬럼: `snake_case` (예: `created_at`, `user_id`)
- 상수/에러코드: `UPPER_SNAKE_CASE` (예: `JWT_SECRET`, `AUTH_INVALID_CREDENTIALS`)

**프론트엔드:**
- 컴포넌트 파일: `PascalCase.tsx` (예: `TodoCard.tsx`, `LoginForm.tsx`)
- 훅 파일: `camelCase.ts`, `use` 접두사 (예: `useTodos.ts`, `useAuth.ts`)
- 유틸/API 파일: `kebab-case.ts` (예: `api-client.ts`, `date-utils.ts`)
- 페이지 파일: `PascalCase.tsx` (예: `TodoListPage.tsx`)

### 3.3 함수 네이밍 패턴

**Repository 함수:**
```
findById, findAllByUserId, create, update, deleteById
```

**Service 함수:**
```
getTodo, listTodos, createTodo, updateTodo, deleteTodo, toggleTodoCompletion
```

**API 엔드포인트 함수 (클라이언트):**
```
fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodo
```

**React Hook:**
```
useTodos, useTodo, useCreateTodo, useUpdateTodo, useDeleteTodo
```

### 3.4 주석 원칙

- 기본적으로 주석을 작성하지 않는다. 명확한 식별자가 주석을 대체한다.
- 비즈니스 규칙 번호(BR-XX)를 참조해야 할 때만 한 줄 주석을 허용한다.
  ```javascript
  // BR-07: 기본 카테고리는 삭제 불가
  if (category.isDefault) throw new AppError('CATEGORY_DEFAULT_DELETE_FORBIDDEN');
  ```
- API 계약과 다른 예외적 구현이 있을 때만 주석을 작성한다.

---

## 4. 테스트 / 품질 원칙

### 4.1 테스트 우선순위

MVP 일정(3일) 내에서 다음 우선순위로 테스트를 작성한다.

1. **비즈니스 규칙 테스트** (최우선): BR-01~09를 Service 레이어에서 단위 테스트
2. **API 통합 테스트**: 9개 엔드포인트의 정상/오류 응답 검증
3. **인증 플로우 테스트**: Access Token 만료, Refresh 흐름 (SCN-09)
4. **UI 컴포넌트 테스트**: 필터 UI, 폼 유효성 검사 (우선순위 낮음)

### 4.2 테스트 파일 위치

- 백엔드: 테스트 대상 파일과 같은 디렉토리 또는 `__tests__/` 서브디렉토리
- 프론트엔드: 컴포넌트/훅 파일과 같은 디렉토리, `*.test.tsx` 확장자

### 4.3 테스트 데이터 원칙

- DB 테스트는 실제 PostgreSQL을 사용한다 (mock DB 금지 - 실제 쿼리 검증 필요).
- 테스트용 사용자/카테고리/Todo는 각 테스트 전후로 완전히 정리한다.
- 기본 카테고리(`is_default=true`)는 공유 픽스처로 사용 가능하다.

### 4.4 품질 게이트

- TypeScript strict 모드 활성화 (프론트엔드).
- `any` 타입 사용 금지. 도메인 엔티티 인터페이스를 정의하여 사용한다.
- ESLint 오류가 있는 상태로 커밋하지 않는다.
- p95 응답시간 500ms 이하 목표 (비기능 요구사항 NFR-01).

---

## 5. 설정 / 보안 / 운영 원칙

### 5.1 환경 변수 관리

모든 비밀값과 환경별 설정은 환경 변수로 관리한다.

```
# 필수 환경 변수
DATABASE_URL=          # PostgreSQL 연결 문자열
JWT_SECRET=            # Access Token 서명 키
JWT_REFRESH_SECRET=    # Refresh Token 서명 키
JWT_EXPIRES_IN=        # Access Token 만료 (예: 1h)
JWT_REFRESH_EXPIRES_IN= # Refresh Token 만료 (예: 7d)
PORT=                  # 서버 포트
NODE_ENV=              # development | production | test
ALLOWED_ORIGINS=       # CORS 허용 오리진 (쉼표 구분, 예: http://localhost:5173)
```

- `.env` 파일은 절대 git에 커밋하지 않는다. `.env.example`만 커밋한다.
- 코드에 비밀값을 하드코딩하지 않는다.

### 5.2 보안 원칙

- **비밀번호**: bcrypt로 해시 저장 (BR-01, PRD 보안 요구사항).
- **SQL 인젝션 방지**: `pg`의 파라미터 바인딩을 항상 사용한다. 문자열 보간으로 쿼리를 만들지 않는다.
  ```javascript
  // 올바름
  pool.query('SELECT * FROM todos WHERE id = $1', [todoId]);
  // 금지
  pool.query(`SELECT * FROM todos WHERE id = ${todoId}`);
  ```
- **인증**: JWT Access Token(단기) + Refresh Token(장기) 이중 구조. 두 토큰 모두 JSON 응답 본문으로 전달하며 Set-Cookie를 사용하지 않는다.
- **Refresh Token 수신**: `/auth/refresh`, `/auth/logout` 엔드포인트는 Refresh Token을 요청 본문(`{ "refreshToken": "..." }`)으로 수신한다. 쿠키나 Authorization 헤더를 사용하지 않는다.
- **데이터 격리**: 모든 Todo/Category 쿼리에 `user_id = $N` 조건을 반드시 포함한다 (BR-03).
- **CORS**: 허용된 오리진만 명시적으로 설정한다.

### 5.3 에러 응답 표준

PRD 에러 코드 체계를 모든 API 응답에 일관되게 적용한다.

```json
{
  "code": "AUTH_EMAIL_DUPLICATE",
  "message": "이미 사용 중인 이메일입니다"
}
```

- 서버 내부 오류(`INTERNAL_SERVER_ERROR`)는 스택 트레이스를 클라이언트에 노출하지 않는다.
- 개발 환경에서만 상세 오류를 로그에 기록한다.

### 5.4 데이터 보존 원칙

- Todo 삭제는 물리적 삭제(Physical Delete)만 수행한다. Soft Delete 없음 (SCN-07).
- 완료 시각(`completed_at`)은 토글 완료 시 기록, 재오픈 시 `NULL`로 업데이트한다 (SCN-05).
- 카테고리 삭제 시 연관 Todo가 존재하면 삭제를 차단한다 (`CATEGORY_IN_USE`, 409). Todo가 없는 경우에만 삭제 가능하다 (CategoryDeleted 처리).

---

## 6. 프론트엔드 디렉토리 구조

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/                    # 라우트 단위 페이지 컴포넌트
│   │   ├── LoginPage.tsx         # UC-02 로그인
│   │   ├── SignupPage.tsx        # UC-01 회원가입
│   │   └── TodoListPage.tsx      # UC-04~08 Todo 관리 (메인)
│   │
│   ├── components/               # 재사용 UI 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── todo/
│   │   │   ├── TodoCard.tsx      # 개별 Todo 항목
│   │   │   ├── TodoList.tsx      # Todo 목록
│   │   │   ├── TodoForm.tsx      # 생성/수정 폼 (공용)
│   │   │   ├── TodoFilter.tsx    # 카테고리/상태 필터
│   │   │   └── DeleteConfirmModal.tsx  # SCN-07 삭제 확인
│   │   └── common/
│   │       ├── ProtectedRoute.tsx  # SCN-10 라우트 보호
│   │       └── ErrorMessage.tsx
│   │
│   ├── hooks/                    # 커스텀 훅 (비즈니스 로직)
│   │   ├── useAuth.ts            # 인증 상태, 로그인/로그아웃
│   │   ├── useTodos.ts           # Todo 목록 조회 (TanStack Query)
│   │   ├── useTodoMutations.ts   # Todo 생성/수정/삭제/토글
│   │   └── useCategories.ts      # 카테고리 목록 조회
│   │
│   ├── store/                    # Zustand 전역 상태
│   │   └── authStore.ts          # 토큰, 사용자 정보
│   │
│   ├── api/                      # API 클라이언트 레이어
│   │   ├── client.ts             # axios 인스턴스 + 인터셉터 (SCN-09 토큰 갱신)
│   │   ├── auth.ts               # /auth 엔드포인트 함수
│   │   ├── todos.ts              # /todos 엔드포인트 함수
│   │   └── categories.ts         # /categories 엔드포인트 함수
│   │
│   ├── types/                    # TypeScript 타입 정의
│   │   ├── domain.ts             # User, Todo, Category 인터페이스
│   │   ├── api.ts                # 요청/응답 DTO 타입
│   │   └── filters.ts            # 필터 파라미터 타입 (schedule_status 등)
│   │
│   ├── utils/                    # 순수 유틸리티 함수
│   │   └── date.ts               # 날짜 포맷, schedule_status 계산
│   │
│   ├── App.tsx                   # 라우터 설정
│   └── main.tsx                  # 진입점
│
├── .env.example
├── .eslintrc.json
├── tsconfig.json
└── package.json
```

**프론트엔드 핵심 규칙:**
- `pages/`는 `components/`를 조합하고, `hooks/`를 통해 데이터를 가져온다.
- `api/`는 순수 HTTP 함수만 포함한다. 상태 관리 로직 없음.
- `types/domain.ts`의 인터페이스는 도메인 문서의 엔티티 정의와 1:1 대응한다.
- `client.ts`의 axios 인터셉터가 Access Token 만료(`AUTH_TOKEN_EXPIRED`) 시 자동 갱신을 처리한다.

---

## 7. 백엔드 디렉토리 구조

```
backend/
├── src/
│   ├── routes/                   # Express 라우터 (URL 매핑)
│   │   ├── auth.routes.js        # POST /auth/register, /auth/login, /auth/logout(body:RT), /auth/refresh(body:RT)
│   │   ├── todo.routes.js        # GET/POST /todos, GET/PUT/DELETE /todos/:id, PATCH /todos/:id/toggle
│   │   └── category.routes.js    # GET /categories
│   │
│   ├── controllers/              # HTTP 요청/응답 처리, 입력 검증
│   │   ├── auth.controller.js
│   │   ├── todo.controller.js
│   │   └── category.controller.js
│   │
│   ├── services/                 # 비즈니스 규칙 (BR-01~09)
│   │   ├── auth.service.js       # 회원가입, 로그인, 토큰 발급
│   │   ├── todo.service.js       # Todo CRUD, 완료 토글, 필터 로직
│   │   └── category.service.js   # 카테고리 조회, 삭제 처리
│   │
│   ├── repositories/             # DB 접근 (pg 직접 사용)
│   │   ├── user.repository.js
│   │   ├── todo.repository.js
│   │   └── category.repository.js
│   │
│   ├── middleware/               # Express 미들웨어
│   │   ├── auth.middleware.js    # Access Token 검증(Authorization 헤더), user_id 추출 — /auth/refresh·logout는 별도 RT 검증
│   │   └── error.middleware.js   # 전역 에러 핸들러 (PRD §10 에러 코드)
│   │
│   ├── db/
│   │   ├── pool.js               # pg Pool 설정 및 export
│   │   └── schema.sql            # 테이블 DDL (2-prd.md 스키마 기준)
│   │
│   ├── types/                    # JSDoc 타입 정의 또는 TypeScript 인터페이스
│   │   └── domain.js             # User, Todo, Category 구조 문서화
│   │
│   ├── utils/
│   │   └── errors.js             # AppError 클래스, 에러 코드 상수 (AUTH_*, TODO_*, CATEGORY_*)
│   │
│   └── app.js                    # Express 앱 설정, 미들웨어 등록
│
├── index.js                      # 서버 진입점 (포트 바인딩)
├── .env.example
├── .eslintrc.json
└── package.json
```

**백엔드 핵심 규칙:**
- `repositories/`의 모든 쿼리는 `pg` Pool의 파라미터 바인딩(`$1`, `$2`)을 사용한다.
- `services/`에서 BR 번호를 위반하는 상황은 `AppError`를 던져 `error.middleware.js`가 처리한다.
- `auth.middleware.js`는 검증된 `user_id`를 `req.userId`에 담아 Controller로 전달한다.
- 카테고리 삭제 시 `category.service.js`에서 연관 Todo 존재 여부를 먼저 확인하고, 존재하면 `CATEGORY_IN_USE(409)`를 던진다.

---

## 8. API 계약 원칙

PRD의 9개 엔드포인트를 기준으로 프론트-백엔드 계약을 준수한다.

| 메서드 | 경로 | 인증 | 대응 유스케이스 |
|--------|------|------|----------------|
| POST | /auth/register | 불필요 | UC-01 (회원가입) |
| POST | /auth/login | 불필요 | UC-02 (로그인) |
| POST | /auth/logout | 필요(AT) + body:RT | 로그아웃 — AT로 사용자 식별, body의 RT를 서버에서 무효화 |
| POST | /auth/refresh | body:RT만 | 토큰 갱신 — AT 불필요, body의 RT로 새 AT 발급 |
| GET | /categories | 필요 | 카테고리 목록 조회 |
| GET | /todos | 필요 | UC-08 (할일 목록 조회, 필터: category_id, is_completed, schedule_status) |
| POST | /todos | 필요 | UC-04 (할일 등록) |
| PUT | /todos/:id | 필요 | UC-05 (할일 수정) |
| DELETE | /todos/:id | 필요 | UC-06 (할일 삭제) |
| PATCH | /todos/:id/toggle | 필요 | UC-07 (완료 토글) |

- 요청/응답 페이로드 필드명은 PRD의 스키마 컬럼명과 일치시킨다 (`snake_case`).
- 프론트엔드에서 `camelCase`로 변환이 필요한 경우 `api/` 레이어에서만 처리한다.
