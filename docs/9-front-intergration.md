# TodoListApp 프론트엔드 통합 가이드

Version 1.0 | 2026-05-14  
대상: TASK-FE-1 ~ TASK-FE-7 구현 담당자  
기반 문서: `swagger/swagger.json`, `docs/4-project-principles.md`, `docs/5-arch-diagram.md`

---

## 1. 백엔드 연결 정보

| 항목 | 값 |
|------|-----|
| API Base URL | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api-docs` |
| 환경변수 키 | `VITE_API_BASE_URL` |
| 프론트엔드 포트 | `http://localhost:5173` (CORS 허용됨) |

**프론트엔드 `.env`:**
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 2. 인증 구조 핵심 원칙

### 2.1 토큰 저장 규칙

| 토큰 | 유효기간 | 저장 위치 | 사용 방법 |
|------|----------|-----------|-----------|
| Access Token (AT) | 1시간 | Zustand 메모리 (`authStore`) | `Authorization: Bearer <AT>` 헤더 |
| Refresh Token (RT) | 7일 | Zustand 메모리 (`authStore`) | 요청 본문 `{ "refreshToken": "..." }` |

**금지 사항:**
- `localStorage` / `sessionStorage` 토큰 저장 금지
- `Cookie` / `Set-Cookie` 사용 금지
- `Authorization` 헤더로 RT 전송 금지

### 2.2 Zustand authStore 구조

```typescript
// src/store/authStore.ts
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: User | null;
  setTokens: (at: string, rt: string) => void;
  setCurrentUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}
```

- `persist` 미사용 — 페이지 새로고침 시 상태 초기화됨 (의도된 동작)
- `isAuthenticated()`: `accessToken !== null` 반환

### 2.3 axios 클라이언트 인터셉터

```typescript
// src/api/client.ts

// 요청 인터셉터: AT 자동 첨부
config.headers.Authorization = `Bearer ${authStore.getState().accessToken}`;

// 응답 인터셉터: AT 만료 시 자동 갱신 (SCN-09)
// 조건: error.response.status === 401 && error.response.data.code === 'AUTH_TOKEN_EXPIRED'
// 처리:
//   1. POST /auth/refresh { refreshToken } 호출
//   2. 성공 → authStore.setTokens(새AT, 기존RT) → 원본 요청 재시도
//   3. 실패 → authStore.clearAuth() → navigate('/login')
```

**주의:** `/auth/refresh` 엔드포인트 자체는 인터셉터 재시도 대상에서 제외한다. 무한 루프 방지를 위해 `_retry` 플래그를 사용한다.

```typescript
if (error.config._retry) {
  authStore.getState().clearAuth();
  navigate('/login');
  return Promise.reject(error);
}
error.config._retry = true;
```

---

## 3. API 엔드포인트 레퍼런스

### 3.1 인증 (Auth)

#### POST /auth/register — 회원가입 (UC-01)

```typescript
// 요청
interface RegisterPayload {
  email: string;    // RFC 5322 형식
  password: string; // 최소 8자, 영문+숫자 조합
  name: string;     // 1~50자
}

// 응답 201
interface User {
  id: string;         // UUID
  email: string;
  name: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
// password 필드는 응답에 포함되지 않음
```

| 오류 코드 | HTTP | 처리 |
|-----------|------|------|
| `VALIDATION_ERROR` | 400 | 입력 폼 인라인 에러 표시 |
| `AUTH_EMAIL_DUPLICATE` | 409 | "이미 사용 중인 이메일입니다" |

#### POST /auth/login — 로그인 (UC-02)

```typescript
// 요청
interface LoginPayload {
  email: string;
  password: string;
}

// 응답 200
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
```

성공 후 처리:
```typescript
authStore.setTokens(data.accessToken, data.refreshToken);
navigate('/');
```

| 오류 코드 | HTTP | 처리 |
|-----------|------|------|
| `AUTH_INVALID_CREDENTIALS` | 401 | "이메일 또는 비밀번호가 올바르지 않습니다" (이메일/비밀번호 구분 없이 단일 메시지) |

#### POST /auth/logout — 로그아웃

```typescript
// 요청 (Authorization: Bearer AT 헤더 필요)
interface LogoutPayload {
  refreshToken: string; // authStore에서 읽어온 RT
}
// 응답 200 {}
```

처리 순서: `api.auth.logout(RT)` → `authStore.clearAuth()` → `queryClient.clear()` → `navigate('/login')`

#### POST /auth/refresh — Access Token 재발급

```typescript
// 요청 (Authorization 헤더 불필요)
interface RefreshPayload {
  refreshToken: string;
}

// 응답 200
interface RefreshResponse {
  accessToken: string; // 새 AT (1h)
  // refreshToken은 갱신되지 않음
}
```

이 엔드포인트는 axios 인터셉터가 자동 호출한다. 직접 호출 불필요.

---

### 3.2 카테고리 (Categories)

#### GET /categories — 카테고리 목록 (BR-05)

```typescript
// 응답 200 — Category[]
interface Category {
  id: string;         // UUID
  name: string;       // "업무" | "개인" | "건강" | "쇼핑"
  is_default: boolean;
  user_id: string | null; // null = 기본 카테고리
  created_at: string;
}
```

MVP에서는 4개 기본 카테고리만 반환된다 (사용자 정의 카테고리 없음).

TanStack Query 키: `['categories']`

---

### 3.3 할일 (Todos)

#### GET /todos — 목록 조회 + 필터 (UC-08)

```typescript
// 쿼리 파라미터
interface TodoFilters {
  page?: number;              // 기본값 1
  limit?: number;             // 기본값 20, 최대 20
  category_id?: string;       // UUID
  is_completed?: boolean;
  schedule_status?: 'ongoing' | 'overdue';
}

// 응답 200
interface PaginatedTodos {
  todos: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number; // 필터 적용된 전체 개수
  };
}
```

`schedule_status` 동작:
- `overdue`: `due_date < 오늘 AND is_completed = false`
- `ongoing`: `due_date >= 오늘 OR is_completed = true`

정렬: `due_date ASC` 고정

TanStack Query 키: `['todos', filters, page]` (filters 변경 시 자동 재조회)

#### POST /todos — 할일 등록 (UC-04)

```typescript
// 요청
interface CreateTodoPayload {
  title: string;       // 필수, 최대 200자
  description?: string; // 선택, 최대 1000자
  start_date: string;  // 필수, YYYY-MM-DD
  due_date: string;    // 필수, YYYY-MM-DD, start_date 이상 (BR-08)
  category_id: string; // 필수, UUID
}

// 응답 201 — Todo
```

| 오류 코드 | HTTP | 조건 |
|-----------|------|------|
| `TODO_INVALID_DATE` | 400 | `due_date < start_date` (BR-08) |
| `CATEGORY_NOT_FOUND` | 404 | 접근 불가 카테고리 ID |

#### GET /todos/:id — 단건 조회

```typescript
// 응답 200 — Todo
// 오류: TODO_NOT_FOUND (404), TODO_FORBIDDEN (403)
```

#### PUT /todos/:id — 수정 (UC-05)

```typescript
// 요청 — 수정할 필드만 포함 (partial update)
interface UpdateTodoPayload {
  title?: string;
  description?: string | null;
  start_date?: string;
  due_date?: string;
  category_id?: string;
}
// 응답 200 — Todo (updated_at 갱신됨)
```

날짜 검증: 수정 후의 `start_date`와 `due_date` 대소 관계를 서버에서 재검증한다.  
예) 기존 `start_date=2026-05-01`인 상태에서 `due_date=2026-01-01`만 전송 → `TODO_INVALID_DATE`

#### DELETE /todos/:id — 삭제 (UC-06)

```typescript
// 응답 204 No Content (응답 본문 없음)
```

물리 삭제 — 복구 불가. 삭제 전 확인 모달 표시 필수.

#### PATCH /todos/:id/toggle — 완료 토글 (UC-07, BR-09)

```typescript
// 요청 본문 없음
// 응답 200 — Todo

// 미완료 → 완료:  is_completed=true,  completed_at=<현재시각>
// 완료   → 미완료: is_completed=false, completed_at=null
```

---

## 4. TypeScript 타입 정의

```typescript
// src/types/domain.ts

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  start_date: string;   // 'YYYY-MM-DD' 문자열 (Date 객체 아님)
  due_date: string;     // 'YYYY-MM-DD' 문자열 (Date 객체 아님)
  is_completed: boolean;
  completed_at: string | null; // ISO 8601 또는 null
  created_at: string;
  updated_at: string;
}
```

```typescript
// src/types/api.ts

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface PaginatedResponse<T> {
  todos: T[];
  pagination: { page: number; limit: number; total: number };
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
}

export type ErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_EMAIL_DUPLICATE'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'TODO_NOT_FOUND'
  | 'TODO_FORBIDDEN'
  | 'TODO_INVALID_DATE'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_IN_USE'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface TodoFilters {
  category_id?: string;
  is_completed?: boolean;
  schedule_status?: 'ongoing' | 'overdue';
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  start_date: string;
  due_date: string;
  category_id: string;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string | null;
  start_date?: string;
  due_date?: string;
  category_id?: string;
}
```

---

## 5. 에러 처리 가이드

### 5.1 에러 코드 전체 목록

| 코드 | HTTP | 의미 | UI 처리 |
|------|------|------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일/비밀번호 불일치 | 폼 인라인 에러 |
| `AUTH_EMAIL_DUPLICATE` | 409 | 이메일 중복 | 폼 인라인 에러 |
| `AUTH_TOKEN_EXPIRED` | 401 | AT 만료 | axios 인터셉터 자동 처리 |
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음/무효 | `/login` 리다이렉트 |
| `TODO_NOT_FOUND` | 404 | 할일 없음 | 토스트 에러 |
| `TODO_FORBIDDEN` | 403 | 타인 할일 접근 | 토스트 에러 |
| `TODO_INVALID_DATE` | 400 | due_date < start_date | 폼 인라인 에러 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리 없음 | 토스트 에러 |
| `CATEGORY_IN_USE` | 409 | 카테고리 삭제 불가 | 토스트 에러 |
| `VALIDATION_ERROR` | 400 | 입력값 오류 | 폼 인라인 에러 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 오류 | 토스트 에러 |

### 5.2 에러 응답 형식

모든 에러는 동일한 JSON 구조로 반환된다:

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다"
}
```

중첩 구조(`{ "error": { "code": ... } }`) **아님**.

### 5.3 axios 에러 처리 패턴

```typescript
import { AxiosError } from 'axios';
import type { ErrorResponse } from '@/types/api';

function getErrorCode(error: unknown): ErrorCode | null {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    return data?.code ?? null;
  }
  return null;
}
```

---

## 6. 날짜 처리 주의사항

백엔드는 `start_date`, `due_date`를 `YYYY-MM-DD` **문자열**로 반환한다 (JavaScript `Date` 객체 변환 없음).

```typescript
// 올바름 — 문자열 직접 사용
todo.due_date // "2026-05-14"

// 표시용 포맷
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}년 ${month}월 ${day}일`;
}

// 날짜 비교 (문자열 사전순 비교 가능)
const isOverdue = todo.due_date < new Date().toISOString().split('T')[0]
                  && !todo.is_completed;
```

폼 `<input type="date" />` 의 `value` 속성도 `YYYY-MM-DD` 문자열을 그대로 사용한다.

---

## 7. ProtectedRoute 구현

```typescript
// src/components/common/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

라우팅 구조:
```
/login           → LoginPage     (비인증 접근 가능)
/register        → SignupPage    (비인증 접근 가능)
/                → ProtectedRoute → TodoListPage
/todos/new       → ProtectedRoute → TodoCreatePage
/todos/:id/edit  → ProtectedRoute → TodoEditPage
```

---

## 8. TanStack Query 캐시 키 규칙

| 쿼리 키 | 설명 |
|---------|------|
| `['categories']` | 카테고리 목록 — 로그아웃 시 무효화 |
| `['todos', filters, page]` | 필터/페이지 변경마다 새 쿼리 |
| `['todos', 'detail', id]` | 단건 조회 |

mutation 성공 후 무효화:
```typescript
// Todo 생성/수정/삭제/토글 후
queryClient.invalidateQueries({ queryKey: ['todos'] });

// 로그아웃 후
queryClient.clear();
```

---

## 9. 클라이언트 입력 검증 규칙

폼 제출 전 클라이언트에서 먼저 검증한다. 서버 검증은 이중 안전망으로 사용한다.

| 필드 | 규칙 |
|------|------|
| email | RFC 5322 형식 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| password | 최소 8자, 영문 1자 이상 + 숫자 1자 이상 |
| name | 1~50자 |
| title | 필수, 1~200자 |
| description | 선택, 0~1000자 |
| start_date | 필수, YYYY-MM-DD |
| due_date | 필수, YYYY-MM-DD, `>= start_date` |
| category_id | 필수, UUID 형식 |

`due_date < start_date` 조건은 폼에서 실시간으로 감지하여 제출 버튼을 비활성화한다 (SCN-03).

---

## 10. 개발 서버 실행

### 백엔드 시작

```powershell
cd C:\_vibe\todolist-app\backend
node src/index.js
# → Server running on port 3000
```

### 프론트엔드 시작

```powershell
cd C:\_vibe\todolist-app\frontend
npm run dev
# → http://localhost:5173
```

백엔드가 먼저 실행되어 있어야 프론트엔드 API 호출이 정상 동작한다.

---

## 11. 통합 검증 체크리스트 (TASK-FE-7)

| 시나리오 | 검증 항목 |
|----------|-----------|
| SCN-01 | 회원가입 → 자동 로그인 → todo 생성 → 목록 표시 |
| SCN-02 | 잘못된 비밀번호 → 단일 오류 메시지 → 재입력 성공 |
| SCN-03 | due_date < start_date → 실시간 경고 + 제출 불가 |
| SCN-04 | 카테고리 필터 + overdue 필터 복합 적용 |
| SCN-05 | 완료 토글 → 취소선 표시 → 재토글 복원 |
| SCN-06 | todo 수정 → 기존 값 사전 입력 → 저장 확인 |
| SCN-07 | 삭제 확인 모달 → 삭제 → 목록에서 제거 |
| SCN-09 | AT 만료 시 자동 갱신 후 원본 요청 재시도 |
| SCN-10 | 로그아웃 → `/login` 리다이렉트 → `/` 직접 접근 차단 |

반응형 기준:
- 1024px 이상: 일반 레이아웃
- 768px 이하: 세로 스택 레이아웃
