-- =============================================================
-- ServiceHub AI - Supabase PostgreSQL Initial Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ORGANIZATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    org_code    TEXT NOT NULL UNIQUE,
    domain      TEXT,
    logo_url    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_org_code ON organizations(org_code);

-- =============================================================
-- USERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    department_id   UUID,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'EMPLOYEE',
    avatar_url      TEXT,
    phone           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_org_id    ON users(org_id);
CREATE INDEX idx_users_role      ON users(role);

-- =============================================================
-- DEPARTMENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_org_id ON departments(org_id);

-- Add FK from users to departments (now that departments exists)
ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- =============================================================
-- TICKETS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS tickets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_number           TEXT NOT NULL,
    title                   TEXT NOT NULL,
    description             TEXT NOT NULL,
    category                TEXT NOT NULL DEFAULT 'GENERAL',
    priority                TEXT NOT NULL DEFAULT 'MEDIUM',
    status                  TEXT NOT NULL DEFAULT 'OPEN',
    department_id           UUID REFERENCES departments(id) ON DELETE SET NULL,
    creator_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    ai_suggested_category   TEXT,
    ai_confidence           FLOAT,
    ai_reasoning            TEXT,
    sla_due_at              TIMESTAMPTZ,
    resolved_at             TIMESTAMPTZ,
    rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_org_id     ON tickets(org_id);
CREATE INDEX idx_tickets_status     ON tickets(status);
CREATE INDEX idx_tickets_priority   ON tickets(priority);
CREATE INDEX idx_tickets_creator    ON tickets(creator_id);
CREATE INDEX idx_tickets_assignee   ON tickets(assignee_id);
CREATE UNIQUE INDEX idx_tickets_number ON tickets(org_id, ticket_number);

-- =============================================================
-- TICKET COMMENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

-- =============================================================
-- TICKET ACTIVITIES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS ticket_activities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);

-- =============================================================
-- TICKET ATTACHMENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    file_type   TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- KB DOCUMENTS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS kb_documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    file_type   TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    is_indexed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_documents_org_id ON kb_documents(org_id);

-- =============================================================
-- KB CHUNKS TABLE (RAG Vector Chunks)
-- =============================================================
CREATE TABLE IF NOT EXISTS kb_chunks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id      UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_chunks_doc_id  ON kb_chunks(doc_id);
CREATE INDEX idx_kb_chunks_org_id  ON kb_chunks(org_id);

-- =============================================================
-- CHAT THREADS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS chat_threads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT 'New Conversation',
    channel_type    TEXT NOT NULL DEFAULT 'AI_BOT',
    ticket_id       UUID REFERENCES tickets(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_org_id  ON chat_threads(org_id);
CREATE INDEX idx_chat_threads_user_id ON chat_threads(user_id);

-- =============================================================
-- CHAT MESSAGES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL DEFAULT 'USER',
    content     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);

-- =============================================================
-- NOTIFICATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    notif_type  TEXT NOT NULL DEFAULT 'INFO',
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    link        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =============================================================
-- AI USAGE LOGS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type     TEXT NOT NULL,
    prompt_tokens   INTEGER NOT NULL DEFAULT 0,
    response_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens    INTEGER NOT NULL DEFAULT 0,
    model_used      TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_org_id ON ai_usage_logs(org_id);

-- =============================================================
-- ROW LEVEL SECURITY (Multi-Tenant Data Isolation)
-- Enable RLS on all tenant tables
-- =============================================================
ALTER TABLE tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments     ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies are enforced at the application level via org_id filtering in SQLAlchemy queries.
-- Service role key bypasses RLS for backend operations.

COMMIT;
