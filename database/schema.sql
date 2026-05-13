-- TodoListApp Database Schema
-- 기반 문서: docs/6-erd.md, docs/2-prd.md §9
-- PostgreSQL 17

-- =============================================================
-- 확장 기능
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid() 지원

-- =============================================================
-- 테이블 삭제 (재실행 시 초기화용, 의존성 역순)
-- =============================================================

DROP TABLE IF EXISTS todos      CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- =============================================================
-- users
-- =============================================================

CREATE TABLE users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,          -- bcrypt 해시 (saltRounds >= 12)
    name       VARCHAR(50)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

-- =============================================================
-- categories
-- =============================================================

CREATE TABLE categories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    is_default BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id    UUID,                            -- NULL = 기본 카테고리 (BR-05)
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- todos
-- =============================================================

CREATE TABLE todos (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    category_id  UUID        NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,                          -- NULL 허용
    start_date   DATE        NOT NULL,
    due_date     DATE        NOT NULL,
    is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,                   -- NULL = 미완료, 완료 토글 시 NOW() (BR-09)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_todos_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_todos_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT chk_todos_due_date
        CHECK (due_date >= start_date)          -- BR-08
);

-- =============================================================
-- 인덱스
-- =============================================================

-- 할일 조회 성능 (사용자별 + 필터 조합)
CREATE INDEX idx_todos_user_id       ON todos(user_id);
CREATE INDEX idx_todos_category_id   ON todos(category_id);
CREATE INDEX idx_todos_due_date      ON todos(due_date);
CREATE INDEX idx_todos_is_completed  ON todos(is_completed);

-- 카테고리 조회 (기본 카테고리 + 사용자 소유 구분)
CREATE INDEX idx_categories_user_id  ON categories(user_id);

-- =============================================================
-- 기본 카테고리 초기 데이터 (BR-05)
-- is_default = TRUE, user_id = NULL → 모든 사용자 공유 조회
-- =============================================================

INSERT INTO categories (name, is_default, user_id) VALUES
    ('업무', TRUE, NULL),
    ('개인', TRUE, NULL),
    ('건강', TRUE, NULL),
    ('쇼핑', TRUE, NULL);
