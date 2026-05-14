# TodoListApp 프론트엔드 스타일 가이드

Version 1.1 | 2026-05-14  
참조: Google Calendar UI, `8-wireframe.md`, `2-prd.md`  
구현: Tailwind CSS v4 + `@theme` 토큰

---

## 1. 디자인 원칙

Google Calendar의 Material Design 접근법을 참조하여 아래 4가지 원칙을 따릅니다.

| 원칙 | 설명 |
|------|------|
| **명확성** | 상태(미완료·완료·기간초과)가 색상과 텍스트 스타일로 즉시 구분되어야 한다 |
| **밀도 효율** | 정보를 압축하되 터치 타깃은 최소 44×44px 이상 확보한다 |
| **일관성** | 동일한 역할의 요소는 동일한 색상·크기·형태를 사용한다 |
| **반응성** | 1024px 기준으로 데스크탑/모바일 레이아웃이 전환된다 |

---

## 2. Tailwind CSS v4 셋업

### 2.1 설치 구조

```
frontend/
├── src/
│   └── index.css         ← @import "tailwindcss" + @theme 토큰 정의
├── vite.config.ts         ← @tailwindcss/vite 플러그인 등록
└── index.html             ← Noto Sans KR Google Fonts 로드
```

### 2.2 vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### 2.3 index.html — 폰트 로드

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
```

### 2.4 index.css 구조

```css
@import "tailwindcss";   /* Tailwind v4 진입점 */

@theme { ... }           /* 디자인 토큰 → Tailwind 유틸리티 자동 생성 */

/* 글로벌 베이스 */
html, body { ... }

@layer components { ... }  /* 재사용 컴포넌트 클래스 */
```

> **Tailwind v4 변경점**: `tailwind.config.ts` 파일이 불필요. `@theme {}` 블록에서 CSS 변수를 정의하면 `bg-primary`, `text-danger`, `shadow-modal` 같은 유틸리티 클래스가 자동 생성됩니다.

---

## 3. 색상 시스템

### 3.1 @theme 토큰 정의

```css
@theme {
  --color-primary:        #1A73E8;   /* Google Blue */
  --color-primary-dark:   #1557B0;
  --color-primary-light:  #E8F0FE;

  --color-success:        #1E8E3E;   /* Google Green */
  --color-success-light:  #E6F4EA;

  --color-danger:         #D93025;   /* Google Red */
  --color-danger-light:   #FCE8E6;

  --color-warning:        #F9AB00;   /* Google Yellow */

  --color-text-primary:   #3C4043;
  --color-text-secondary: #5F6368;
  --color-text-disabled:  #9AA0A6;

  --color-border:         #DADCE0;
  --color-surface:        #FFFFFF;
  --color-background:     #F1F3F4;
  --color-skeleton:       #E8EAED;
}
```

### 3.2 자동 생성되는 Tailwind 유틸리티

| 토큰 | 배경 클래스 | 텍스트 클래스 | 테두리 클래스 |
|------|------------|-------------|-------------|
| `--color-primary` | `bg-primary` | `text-primary` | `border-primary` |
| `--color-success` | `bg-success` | `text-success` | `border-success` |
| `--color-danger` | `bg-danger` | `text-danger` | `border-danger` |
| `--color-text-primary` | `bg-text-primary` | `text-text-primary` | — |
| `--color-surface` | `bg-surface` | — | `border-surface` |
| `--color-background` | `bg-background` | — | — |

### 3.3 의미별 사용 규칙

| 상태 | 클래스 | 사용 위치 |
|------|--------|-----------|
| 미완료(정상) | `text-text-primary` | 할일 제목, 날짜 |
| 완료 | `line-through text-text-disabled` | 할일 제목 |
| 기간초과 | `text-danger font-medium` | 종료예정일 + ⚠ 아이콘 |
| 오늘 날짜 | `text-primary` | 날짜 강조 |
| 카테고리 칩 배경 | `bg-success text-white` | 카테고리 배지 |

---

## 4. 타이포그래피

### 4.1 폰트 토큰

```css
@theme {
  --font-sans: 'Noto Sans KR', 'Google Sans', ui-sans-serif, system-ui,
               -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

Tailwind 유틸리티: `font-sans`

### 4.2 타입 스케일 (Tailwind 클래스 매핑)

| 용도 | 클래스 | 결과 |
|------|--------|------|
| 앱 제목 | `text-[22px] font-medium` | 22px / 500 |
| 섹션·모달 제목 | `text-lg font-medium` | 18px / 500 |
| 본문·레이블 | `text-sm` | 14px / 400 |
| 강조 본문 | `text-sm font-medium` | 14px / 500 |
| 보조 정보·날짜 | `text-xs` | 12px / 400 |
| 에러·힌트 | `text-xs` | 12px / 400 |

### 4.3 텍스트 상태 클래스

```tsx
/* 완료된 할일 제목 */
<span className="line-through text-text-disabled">{title}</span>

/* 기간초과 날짜 */
<span className="text-danger font-medium">{dueDate}</span>
```

또는 `@layer components`에 정의된 유틸리티 사용:

```tsx
<span className="todo-completed">{title}</span>
<span className="date-overdue">{dueDate}</span>
```

---

## 5. 간격 시스템

Tailwind 기본 4px 그리드를 그대로 사용합니다.

| Tailwind 클래스 | 값 | 주요 사용처 |
|----------------|----|-----------| 
| `gap-1` / `p-1` | 4px | 아이콘-텍스트 간격, 칩 내부 |
| `gap-2` / `p-2` | 8px | 입력 세로 패딩, 인접 요소 간격 |
| `p-3` | 12px | 입력 가로 패딩, 버튼 패딩 |
| `p-4` | 16px | 카드 패딩, 섹션 내부 여백 |
| `p-5` | 20px | 섹션 간격 |
| `p-6` | 24px | 카드 간격, 모달 패딩 |
| `p-8` | 32px | 폼 카드 패딩 |
| `p-10` | 40px | 인증 카드 상하 패딩 |

---

## 6. 테두리 반경

```css
@theme {
  --radius-chip:  4px;
  --radius-input: 8px;
  --radius-card:  12px;
  --radius-pill:  24px;
}
```

| 토큰 | Tailwind 클래스 | 사용처 |
|------|----------------|--------|
| `--radius-chip` | `rounded-[4px]` 또는 `rounded` | 카테고리 칩 |
| `--radius-input` | `rounded-[8px]` 또는 `rounded-lg` | 입력, 버튼 |
| `--radius-card` | `rounded-[12px]` 또는 `rounded-xl` | 카드, 모달 |
| `--radius-pill` | `rounded-[24px]` 또는 `rounded-full` | FAB |

---

## 7. 그림자

```css
@theme {
  --shadow-card:     0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
  --shadow-dropdown: 0 2px 8px rgba(0,0,0,0.15);
  --shadow-modal:    0 4px 16px rgba(0,0,0,0.18);
  --shadow-fab:      0 2px 6px rgba(0,0,0,0.20);
  --shadow-toast:    0 3px 10px rgba(0,0,0,0.18);
}
```

Tailwind 유틸리티: `shadow-card`, `shadow-modal`, `shadow-fab`, `shadow-toast`, `shadow-dropdown`

---

## 8. 컴포넌트 클래스 레퍼런스

모든 컴포넌트 클래스는 `src/index.css`의 `@layer components`에 정의되어 있습니다.

### 8.1 버튼

```tsx
/* Primary — 주요 제출 액션 */
<button className="btn btn-primary">로그인</button>

/* Secondary — 취소 */
<button className="btn btn-secondary">취소</button>

/* Danger — 삭제 확인 */
<button className="btn btn-danger">삭제</button>

/* Ghost — 링크성 액션 */
<button className="btn btn-ghost">회원가입</button>

/* FAB — 새로운 할일 추가 */
<button className="btn btn-fab">
  <PlusIcon size={20} />
  새로운 할일 추가
</button>

/* 로딩 상태 */
<button className="btn btn-primary" disabled={isLoading}>
  {isLoading && <Spinner size={16} />}
  {isLoading ? '처리 중...' : '로그인'}
</button>
```

### 8.2 입력 필드

```tsx
/* 기본 */
<input className="input" placeholder="이메일" />

/* 에러 상태 */
<input className={`input ${error ? 'input-error' : ''}`} />

/* textarea */
<textarea className="input textarea" rows={4} />

/* 필드 래퍼 */
<div className="field">
  <label className="field-label">이메일 *</label>
  <input className={`input ${error ? 'input-error' : ''}`} />
  {error && <p className="field-error">⚠ {error}</p>}
  <p className="field-hint">{value.length} / 200</p>
</div>
```

### 8.3 카테고리 칩

```tsx
<span className="category-chip">{category.name}</span>
```

### 8.4 카드

```tsx
<div className="card p-4">{/* 내용 */}</div>

/* 모바일 할일 카드 */
<div className="card p-4 mb-2">{/* 할일 정보 */}</div>
```

### 8.5 헤더

```tsx
<header className="app-header">
  <h1 className="app-header-title">TodoListApp</h1>
  <div className="flex items-center gap-3 text-sm text-text-secondary">
    <span>{user.name}님</span>
    <button className="btn btn-ghost">로그아웃</button>
  </div>
</header>
```

### 8.6 모달

```tsx
<div className="modal-overlay">
  <div className="modal">
    <h2 className="text-lg font-medium text-text-primary mb-2">할일 삭제</h2>
    <hr className="border-border my-3" />
    <p className="text-sm text-text-secondary mb-6">
      정말로 삭제하시겠습니까?<br />삭제된 데이터는 복구할 수 없습니다.
    </p>
    <div className="flex justify-end gap-2">
      <button className="btn btn-secondary">취소</button>
      <button className="btn btn-danger">삭제</button>
    </div>
  </div>
</div>
```

### 8.7 토스트

```tsx
<div className="toast-container">
  <div className="toast toast-success">
    <CheckCircleIcon size={20} />
    <span>할일이 완료되었습니다.</span>
    <button className="ml-auto">×</button>
  </div>
  <div className="toast toast-error">
    <XCircleIcon size={20} />
    <span>일시적인 오류가 발생했습니다.</span>
    <button className="ml-auto">×</button>
  </div>
</div>
```

### 8.8 스켈레톤 로딩

```tsx
/* 테이블 행 스켈레톤 */
<div className="flex gap-4 p-4">
  <div className="skeleton w-4 h-4 rounded" />
  <div className="skeleton flex-1 h-4 rounded" />
  <div className="skeleton w-16 h-4 rounded" />
  <div className="skeleton w-20 h-4 rounded" />
</div>
```

### 8.9 페이지네이션

```tsx
<div className="pagination">
  <button className="pagination-btn" disabled={page <= 1}>‹</button>
  <span>{page} / {totalPages}</span>
  <button className="pagination-btn" disabled={page >= totalPages}>›</button>
</div>
```

---

## 9. 레이아웃

### 9.1 페이지 기본 구조

```tsx
<>
  <header className="app-header">...</header>

  <main className="max-w-[1200px] mx-auto px-6 py-6 desktop:px-6 px-4">
    {/* 페이지 콘텐츠 */}
  </main>
</>
```

### 9.2 반응형 브레이크포인트

```css
@theme {
  --breakpoint-desktop: 1024px;
}
```

| 범위 | Tailwind 접두사 | 레이아웃 |
|------|----------------|---------|
| `< 1024px` | 기본 (mobile-first) | 카드 레이아웃, 세로 필터, 전체 너비 버튼 |
| `≥ 1024px` | `desktop:` | 테이블 레이아웃, 가로 필터 |

```tsx
/* 반응형 예시 */
<div className="flex flex-col desktop:flex-row desktop:gap-5 gap-3">
  {/* 필터 영역 */}
</div>

<button className="btn btn-fab w-full desktop:w-auto">
  새로운 할일 추가
</button>
```

### 9.3 인증 페이지

```tsx
<div className="auth-page">
  <div className="auth-card">
    <h1 className="text-[22px] font-medium text-center text-text-primary mb-6">
      로그인
    </h1>
    <form className="flex flex-col gap-4">
      {/* 필드들 */}
      <button className="btn btn-primary w-full mt-2">로그인</button>
      <p className="text-xs text-center text-text-secondary">
        계정이 없으신가요?{' '}
        <Link className="text-primary" to="/register">회원가입</Link>
      </p>
    </form>
  </div>
</div>
```

### 9.4 할일 폼 페이지 (생성/수정)

```tsx
<main className="max-w-[640px] mx-auto px-4 py-6">
  <div className="card p-8">
    <h2 className="text-lg font-medium text-text-primary mb-6">새로운 할일 추가</h2>

    <form className="flex flex-col gap-4">
      {/* 제목, 설명 필드 */}

      {/* 날짜 — 2열 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label className="field-label">시작일 *</label>
          <input type="date" className="input" />
        </div>
        <div className="field">
          <label className="field-label">종료예정일 *</label>
          <input type="date" className="input" />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 mt-2">
        <button type="button" className="btn btn-secondary">취소</button>
        <button type="submit" className="btn btn-primary">등록</button>
      </div>
    </form>
  </div>
</main>
```

### 9.5 필터 영역

```tsx
<div className="card p-4 desktop:p-5 mb-4">
  <div className="flex flex-col desktop:flex-row desktop:items-center gap-4">

    {/* 카테고리 드롭다운 */}
    <div className="field">
      <label className="field-label">카테고리</label>
      <select className="input">
        <option>전체</option>
        {categories.map(c => <option key={c.id}>{c.name}</option>)}
      </select>
    </div>

    {/* 완료 여부 드롭다운 */}
    <div className="field">
      <label className="field-label">완료 여부</label>
      <select className="input">
        <option>전체</option>
        <option>미완료만</option>
        <option>완료만</option>
      </select>
    </div>

    {/* 일정 상태 라디오 */}
    <div className="field">
      <label className="field-label">일정 상태</label>
      <div className="flex gap-4">
        {['전체', '진행 중', '기간초과'].map(s => (
          <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name="schedule" value={s} />
            {s}
          </label>
        ))}
      </div>
    </div>

  </div>
</div>
```

---

## 10. 할일 상태별 시각 표현

| 상태 | 클래스 조합 |
|------|------------|
| 미완료(정상) | `text-text-primary` |
| 완료 | `todo-completed` (`line-through text-text-disabled`) |
| 기간초과 날짜 | `date-overdue` (`text-danger font-medium`) |
| 행 호버 | `hover:bg-[#F8F9FA]` |
| 토글 로딩 | 체크박스 `disabled` + 스피너 표시 |

```tsx
<tr className={`border-b border-border hover:bg-[#F8F9FA] transition-colors ${
  todo.is_completed ? 'opacity-70' : ''
}`}>
  <td className="p-3 w-10">
    <input
      type="checkbox"
      className="checkbox"
      checked={todo.is_completed}
      disabled={isToggling}
    />
  </td>
  <td className="p-3">
    <span className={todo.is_completed ? 'todo-completed' : 'text-text-primary'}>
      {todo.title}
    </span>
  </td>
  <td className="p-3">
    <span className="category-chip">{todo.category_name}</span>
  </td>
  <td className={`p-3 text-xs ${isOverdue(todo) ? 'date-overdue' : 'text-text-secondary'}`}>
    {todo.due_date}
    {isOverdue(todo) && ' ⚠'}
  </td>
</tr>
```

---

## 11. 아이콘

Material Symbols 또는 Heroicons 중 하나를 일관되게 사용합니다.

| 사용처 | 아이콘 | 크기 | 색상 클래스 |
|--------|--------|------|------------|
| 수정 버튼 | `edit` | 18px | `text-text-secondary hover:text-text-primary` |
| 삭제 버튼 | `delete` | 18px | `text-text-secondary hover:text-danger` |
| 새 할일 추가 | `add` | 20px | `text-white` |
| 기간초과 경고 | `warning` | 16px | `text-danger` |
| 토스트 성공 | `check_circle` | 20px | `text-white` |
| 토스트 오류 | `cancel` | 20px | `text-white` |
| 이전/다음 | `chevron_left/right` | 20px | `text-text-secondary` |

---

## 12. 접근성 (a11y)

| 항목 | 구현 방법 |
|------|-----------|
| 색상 대비 | WCAG AA 이상 (4.5:1) — 위 색상 팔레트 기준 |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` (버튼 기본 `h-[40px]` + 상하 4px 여백) |
| 포커스 링 | `focus:ring-2 focus:ring-primary focus:ring-offset-2` |
| 아이콘 버튼 | `aria-label="수정"`, `aria-label="삭제"` 필수 |
| 로딩 상태 | `aria-busy="true"` + `role="status"` |
| 에러 연결 | `aria-describedby="field-error-id"` |
| 모달 포커스 트랩 | 열릴 때 첫 요소로 이동, 닫힐 때 트리거로 복귀 |
| 스크린 리더 | 스켈레톤에 `aria-hidden="true"` 추가 |
