# TodoListApp PRD (Product Requirements Document)

**버전:** 1.0  
**작성일:** 2026-05-13  
**기반 문서:** `docs/1-domain-definition.md`  

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.1 | 2026-05-13 | sunny | todos.completed_at 필드 추가, CategoryDeleted 처리 방식 확정(삭제 차단), 기본 카테고리 공유 조회 방식 명시, overdue 필터 정의 보완 |
| 1.0 | 2026-05-13 | sunny | 최초 작성 |

---

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| 제품명 | TodoListApp |
| 목적 | 인증된 사용자가 카테고리 기반으로 할일을 체계적으로 관리하는 개인화 웹 애플리케이션 |
| 타겟 사용자 | 20~50대 직장인 |
| 플랫폼 | 반응형 웹 (Web + Mobile Web) |
| 개발 일정 | 3일 (MVP 기준) |

---

## 2. 타겟 사용자 정의

### 페르소나 A — 바쁜 20대 신입 직장인

| 항목 | 내용 |
|------|------|
| **이름** | 김지수 (26세, 마케팅팀 신입) |
| **환경** | 사무실 PC + 출퇴근 중 스마트폰 |
| **목표** | 쏟아지는 업무 요청을 놓치지 않고 기한 내에 처리하고 싶다 |
| **불편함** | 메모장·카카오톡 저장으로 관리하다 보니 완료 여부를 잊거나 기한을 넘기는 일이 잦다 |
| **기술 친숙도** | 높음 — 새 서비스 빠르게 습득, 모바일 우선 사용 |
| **주요 사용 패턴** | 오전 출근 전 할일 등록 → 처리 후 즉시 완료 체크 → 퇴근 전 미완료 목록 확인 |

---

### 페르소나 B — 멀티태스킹 30대 중간 관리자

| 항목 | 내용 |
|------|------|
| **이름** | 박성준 (35세, 개발팀 파트장) |
| **환경** | 사무실 듀얼 모니터 PC, 외근 시 태블릿 |
| **목표** | 업무·개인·팀 공유 일정을 한 곳에서 카테고리별로 구분해 관리하고 싶다 |
| **불편함** | 여러 툴에 일정이 분산되어 있어 전체 현황 파악에 시간이 낭비된다 |
| **기술 친숙도** | 중간 — 기능이 많아도 사용하는 건 핵심 기능뿐 |
| **주요 사용 패턴** | 주간 단위로 할일 일괄 등록 → 필터로 카테고리·기간초과 항목 확인 → 우선순위 조정 |

---

### 페르소나 C — 디지털 전환 중인 40~50대 시니어 직장인

| 항목 | 내용 |
|------|------|
| **이름** | 최미경 (48세, 총무팀 과장) |
| **환경** | 사무실 PC 위주, 스마트폰 사용은 간단한 조회 수준 |
| **목표** | 반복되는 행정 업무 일정을 빠뜨리지 않고 처리 확인하고 싶다 |
| **불편함** | 종이 다이어리에 적다 보니 분실·누락 위험이 있고 검색이 안 된다 |
| **기술 친숙도** | 낮음 — UI가 복잡하면 이탈, 직관적인 단순 화면 필수 |
| **주요 사용 패턴** | PC에서 할일 등록·수정 → 완료 시 체크 → 기간초과 필터로 놓친 일정 확인 |

---

### 공통 시사점

| 인사이트 | 설계 반영 |
|----------|----------|
| 모바일·PC 혼용 | 반응형 UI 필수, 터치 친화적 버튼 크기 |
| 빠른 상태 변경 니즈 | 목록에서 완료 토글을 바로 할 수 있어야 함 |
| 필터 활용도 높음 | 카테고리·기간초과·완료 여부 필터를 메인 화면에 노출 |
| 단순함 선호 | 설정·옵션 최소화, 핵심 액션을 전면에 배치 |

---

## 3. 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19+ · TypeScript · Zustand · TanStack Query |
| 백엔드 | Node.js · Express · REST API |
| 데이터베이스 | PostgreSQL 17 |
| DB 연동 | `pg` 라이브러리 (ORM 사용 금지) |
| 인증 | JWT (Access Token + Refresh Token) |
| 배포 환경 | 소규모 클라우드 / VPS (단일 서버 기준) |

> **pg 라이브러리 필수:** 백엔드의 모든 PostgreSQL 연동은 반드시 `pg` 라이브러리를 직접 사용한다. Sequelize, Prisma 등 ORM은 1차 범위에서 사용하지 않는다.

---

## 4. MVP 범위 정의

### 4.1 릴리즈 구분

| 릴리즈 | 목표 | 기간 |
|--------|------|------|
| **1차 (MVP)** | 인증 + 핵심 할일 관리 | 3일 |
| **2차** | 프로필 관리, 커스텀 카테고리, OAuth, 다크모드, 다국어 | 추후 |

### 4.2 유스케이스별 포함 여부

| UC | 유스케이스 | 1차 | 2차 | 비고 |
|----|-----------|:---:|:---:|------|
| UC-01 | 회원가입 | ✅ | | |
| UC-02 | 로그인 | ✅ | | |
| UC-03 | 개인정보 수정 | | ✅ | 이름, 비밀번호 변경 |
| UC-04 | 할일 등록 | ✅ | | |
| UC-05 | 할일 수정 | ✅ | | |
| UC-06 | 할일 삭제 | ✅ | | |
| UC-07 | 할일 완료 토글 | ✅ | | |
| UC-08 | 할일 목록 조회·필터 | ✅ | | |
| UC-09 | 커스텀 카테고리 추가 | | ✅ | 1차는 기본 카테고리만 |
| UC-10 | 커스텀 카테고리 삭제 | | ✅ | |
| — | 로그아웃 | ✅ | | |
| — | 회원탈퇴 | | ✅ | 탈퇴 시 데이터 즉시 삭제 |
| — | OAuth 소셜 로그인 | | ✅ | Facebook, Google 등 |
| — | 다크모드 | | ✅ | |
| — | 다국어 지원 | | ✅ | |

### 4.3 MVP 제외 근거

- **UC-03 (개인정보 수정):** 핵심 사용자 가치와 무관, 비밀번호 변경 UX 설계 비용이 일정에 부담
- **UC-09/10 (커스텀 카테고리):** 기본 카테고리 4종으로 1차 니즈 충족 가능
- **회원탈퇴:** 데이터 즉시 삭제 정책의 안전한 구현에 별도 설계 필요

---

## 5. 기능 요구사항

### 5.1 인증 (Authentication)

#### UC-01 회원가입
- **입력:** 이메일, 비밀번호, 이름
- **처리:**
  - 이메일 중복 여부 확인
  - 비밀번호 bcrypt 해시 저장
  - 가입 성공 시 기본 카테고리 4종 자동 할당 (도메인 이벤트: `UserRegistered`)
- **유효성 검사:**
  - 이메일: RFC 5322 형식
  - 비밀번호: 최소 8자, 영문+숫자 조합
  - 이름: 최소 1자, 최대 50자

#### UC-02 로그인
- **입력:** 이메일, 비밀번호
- **처리:**
  - 자격증명 검증 후 Access Token + Refresh Token 발급
  - Access Token 만료: 1시간
  - Refresh Token 만료: 7일 (Zustand 메모리에 저장, 페이지 새로고침 시 초기화)
- **응답 본문:** Access Token · Refresh Token 모두 JSON 응답 본문으로 반환 (Set-Cookie 미사용)
  ```json
  { "accessToken": "...", "refreshToken": "..." }
  ```
- **실패 처리:** 자격증명 불일치 시 단일 에러 메시지 ("이메일 또는 비밀번호가 올바르지 않습니다")

#### 로그아웃
- 클라이언트가 요청 본문으로 Refresh Token 전달 → 서버에서 무효화
  ```json
  { "refreshToken": "..." }
  ```
- 서버는 Set-Cookie 헤더를 사용하지 않으므로 별도 쿠키 삭제 처리 없음

#### 인증 공통
- 모든 할일·카테고리 API는 유효한 Access Token 필수 (BR-01)
- Refresh Token 재발급: 클라이언트가 요청 본문으로 Refresh Token 전달
  ```json
  { "refreshToken": "..." }
  ```
- 향후 OAuth 소셜 로그인 추가를 고려한 인증 레이어 설계 (provider 필드 확장 가능 구조)

---

### 5.2 기본 카테고리

1차에서는 시스템이 제공하는 기본 카테고리 4종만 사용한다. (BR-05)

| 카테고리명 | 설명 |
|-----------|------|
| 업무 | 직장 관련 할일 |
| 개인 | 개인 생활 관련 할일 |
| 건강 | 운동·건강 관련 할일 |
| 쇼핑 | 구매·쇼핑 관련 할일 |

> 기본 카테고리는 `is_default = true`, `user_id = NULL`로 저장되며, 별도의 할당 절차 없이 **공유 조회 방식**으로 모든 사용자가 즉시 사용 가능하다. 도메인 이벤트 `UserRegistered`의 "기본 카테고리 자동 할당"은 이 공유 접근 허용을 의미하며, user-category 매핑 테이블은 사용하지 않는다.

---

### 5.3 할일 관리

#### UC-04 할일 등록
- **입력:** 제목(필수), 설명(선택), 시작일(필수), 종료예정일(필수), 카테고리(필수)
- **유효성 검사:**
  - 제목: 최대 200자
  - 설명: 최대 1,000자
  - 종료예정일 ≥ 시작일 (BR-08)
  - 카테고리: 사용자가 접근 가능한 카테고리 ID여야 함 (BR-07)
- **기본값:** `is_completed = false`

#### UC-05 할일 수정
- 본인 소유 할일만 수정 가능 (BR-03)
- 수정 가능 필드: 제목, 설명, 시작일, 종료예정일, 카테고리, 완료 여부
- 유효성 검사는 등록과 동일

#### UC-06 할일 삭제
- 본인 소유 할일만 삭제 가능 (BR-03)
- 삭제는 물리 삭제 (soft delete 미사용)

#### UC-07 할일 완료 토글
- `is_completed` 값을 반전 (BR-09)
- 완료 → 미완료 복원 허용
- **완료 처리 시:** `completed_at = NOW()` 기록 (도메인 이벤트: `TodoCompleted`)
- **미완료 복원 시:** `completed_at = NULL` 초기화 (도메인 이벤트: `TodoReopened`)

#### UC-08 할일 목록 조회·필터

**기본 동작:**
- 본인 소유 할일만 반환 (BR-03)
- 기본 정렬: 종료예정일 오름차순

**필터 옵션 (조합 가능):**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `category_id` | UUID | 특정 카테고리 필터 |
| `is_completed` | Boolean | 완료 여부 필터 |
| `schedule_status` | `ongoing` \| `overdue` | 일정 종료 여부 — `overdue`: 종료예정일 < 오늘 AND 미완료. **완료된 할일은 기간이 지났어도 overdue 대상에서 제외한다.** `ongoing`: 종료예정일 ≥ 오늘 OR 완료 상태 |

**페이지네이션:**
- 방식: 오프셋 기반 (`page`, `limit`)
- 기본 페이지 크기: 20건

---

## 6. API 설계 (REST)

### 기본 규칙
- Base URL: `/api/v1`
- 인증 필요 엔드포인트: `Authorization: Bearer <access_token>` 헤더
- 응답 형식: JSON
- 에러 응답 형식:
  ```json
  { "code": "ERROR_CODE", "message": "사용자 친화적 메시지" }
  ```

### 엔드포인트 목록

#### 인증
| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| POST | `/auth/register` | 회원가입 | ❌ |
| POST | `/auth/login` | 로그인 | ❌ |
| POST | `/auth/logout` | 로그아웃 (body: refreshToken) | ✅ |
| POST | `/auth/refresh` | Access Token 재발급 (body: refreshToken) | ❌ |

#### 카테고리
| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| GET | `/categories` | 사용 가능한 카테고리 목록 | ✅ |

#### 할일
| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| GET | `/todos` | 할일 목록 조회 (필터·페이지네이션) | ✅ |
| POST | `/todos` | 할일 등록 | ✅ |
| GET | `/todos/:id` | 할일 단건 조회 | ✅ |
| PUT | `/todos/:id` | 할일 수정 | ✅ |
| DELETE | `/todos/:id` | 할일 삭제 | ✅ |
| PATCH | `/todos/:id/toggle` | 완료 상태 토글 | ✅ |

---

## 7. 비기능 요구사항

### 7.1 성능
| 항목 | 목표 |
|------|------|
| 동시 접속 | 300명 |
| API 응답 시간 | p95 ≤ 500ms |
| 할일 목록 쿼리 | 인덱스 활용으로 ≤ 100ms 목표 |

### 7.2 보안
- 비밀번호: bcrypt (saltRounds ≥ 12) 해시 저장
- SQL Injection: `pg` 파라미터 바인딩 필수 (쿼리 직접 조합 금지)
- JWT Secret: 환경변수로 관리 (코드 하드코딩 금지)
- CORS: 허용 Origin 화이트리스트 설정
- Access Token · Refresh Token: 모두 응답 본문(JSON)으로 전달, 클라이언트 Zustand 메모리에 저장 (쿠키 미사용)

### 7.3 데이터 보존
- 회원탈퇴 시: 해당 사용자의 User, Todo, 사용자 정의 Category 레코드 즉시 물리 삭제 (2차 구현)
- 기본 카테고리는 유지 (공유 리소스)

### 7.4 확장성 고려 (설계 시 반영)
- 인증 레이어: OAuth provider 추가를 위한 `provider` 필드 확장 구조
- 카테고리: 커스텀 카테고리 UI/API는 2차에서 추가 (DB 스키마는 이미 `is_default`, `user_id` 구분 포함)
- 다국어: 에러 코드 분리 설계로 메시지 교체 용이하게

---

## 8. UI/UX 요구사항

### 8.1 반응형 레이아웃
| 브레이크포인트 | 대상 |
|--------------|------|
| ≥ 1024px | 데스크탑 |
| < 1024px | 태블릿·모바일 |

### 8.2 주요 화면 목록

| 화면 | 경로 | 인증 필요 |
|------|------|:--------:|
| 로그인 | `/login` | ❌ |
| 회원가입 | `/register` | ❌ |
| 할일 목록 (메인) | `/` | ✅ |
| 할일 등록 | `/todos/new` | ✅ |
| 할일 수정 | `/todos/:id/edit` | ✅ |

### 8.3 UX 원칙
- 미인증 상태에서 보호 경로 접근 시 `/login`으로 리다이렉트
- 폼 유효성 오류는 필드 하단 인라인 표시
- 네트워크 요청 중 로딩 인디케이터 표시 (TanStack Query `isPending` 활용)
- 성공/실패 액션 피드백: 토스트 메시지

### 8.4 1차 제외 UI 기능
- 다크모드 (2차)
- 다국어 (i18n) (2차)

---

## 9. 데이터베이스 설계

### 9.1 테이블 정의

```sql
-- 사용자
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(50)  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 카테고리
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 할일
CREATE TABLE todos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID        NOT NULL REFERENCES categories(id),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  start_date   DATE        NOT NULL,
  due_date     DATE        NOT NULL,
  is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_due_date CHECK (due_date >= start_date)
);
```

### 9.2 인덱스

```sql
-- 할일 조회 성능 (사용자별 + 필터)
CREATE INDEX idx_todos_user_id          ON todos(user_id);
CREATE INDEX idx_todos_category_id      ON todos(category_id);
CREATE INDEX idx_todos_due_date         ON todos(due_date);
CREATE INDEX idx_todos_is_completed     ON todos(is_completed);
-- 카테고리 조회 (기본 + 사용자 소유)
CREATE INDEX idx_categories_user_id     ON categories(user_id);
```

### 9.3 기본 카테고리 초기 데이터

```sql
INSERT INTO categories (name, is_default, user_id) VALUES
  ('업무', TRUE, NULL),
  ('개인', TRUE, NULL),
  ('건강', TRUE, NULL),
  ('쇼핑', TRUE, NULL);
```

---

## 10. 에러 코드 정의

| 코드 | HTTP | 메시지 |
|------|------|--------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호가 올바르지 않습니다 |
| `AUTH_EMAIL_DUPLICATE` | 409 | 이미 사용 중인 이메일입니다 |
| `AUTH_TOKEN_EXPIRED` | 401 | 인증이 만료되었습니다. 다시 로그인해주세요 |
| `AUTH_UNAUTHORIZED` | 401 | 로그인이 필요합니다 |
| `TODO_NOT_FOUND` | 404 | 할일을 찾을 수 없습니다 |
| `TODO_FORBIDDEN` | 403 | 접근 권한이 없습니다 |
| `TODO_INVALID_DATE` | 400 | 종료예정일은 시작일보다 이전일 수 없습니다 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리를 찾을 수 없습니다 |
| `CATEGORY_IN_USE` | 409 | 해당 카테고리에 할일이 존재하여 삭제할 수 없습니다 |
| `VALIDATION_ERROR` | 400 | 입력값을 확인해주세요 |
| `INTERNAL_SERVER_ERROR` | 500 | 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요 |

---

## 11. 개발 일정 (3일)

| 일차 | 작업 범위 |
|------|-----------|
| **Day 1** | 프로젝트 초기화, DB 스키마 생성, 인증 API (회원가입·로그인·로그아웃·토큰 갱신) |
| **Day 2** | 할일 CRUD API, 카테고리 조회 API, 프론트엔드 인증 화면 (로그인·회원가입) |
| **Day 3** | 프론트엔드 할일 목록·등록·수정·완료 토글, 필터 UI, 통합 테스트·버그 수정 |

---

## 12. 2차 릴리즈 백로그

| 기능 | 우선순위 |
|------|---------|
| 회원탈퇴 (데이터 즉시 삭제) | 높음 |
| 개인정보 수정 (이름, 비밀번호) | 높음 |
| 커스텀 카테고리 추가·삭제 (BR-04 접근 권한 적용 필요) | 중간 |
| — 카테고리 삭제 정책: 연관 할일이 존재하면 삭제 차단 (`CATEGORY_IN_USE` 에러 반환) | 중간 |
| OAuth 소셜 로그인 (Google, Facebook) | 중간 |
| 다크모드 | 낮음 |
| 다국어 지원 (i18n) | 낮음 |
