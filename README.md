# ServiceHub AI — Enterprise Multi-Tenant AI Service Desk Platform

> A production-ready, full-stack enterprise SaaS application inspired by ServiceNow, Jira Service Management, and Freshservice.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 **Multi-Tenant Auth** | JWT + RBAC with 5 roles (Super Admin, Org Admin, Manager, Agent, Employee) |
| 🎫 **Ticket Management** | Full lifecycle with Gemini AI auto-classification, SLA enforcement, agent assignment |
| 💬 **Real-Time Chat** | FastAPI WebSockets with typing indicators, read receipts & presence |
| 📚 **RAG Knowledge Base** | PDF, DOCX, XLSX, CSV & URL indexing → Gemini 1.5 Flash strict tenant QA |
| 📊 **Analytics Dashboards** | Role-specific Recharts dashboards with live backend API data |
| 🔔 **Notifications** | Real-time push via WebSocket broadcast |
| 🌙 **Dark / Light Theme** | Persistent OS-matched theme toggle |

---

## 🏗️ Architecture

```
servicehub-ai/
├── backend/           # FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── api/       # REST + WebSocket endpoints
│   │   ├── core/      # Config, Security, Database
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic v2 schemas
│   │   ├── services/  # AI service, RAG service
│   │   └── websockets/# Connection manager
│   ├── alembic/       # DB migrations
│   └── render.yaml    # Render deployment config
│
├── frontend/          # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── features/  # Auth, Dashboard, Tickets, Chat, KB, Analytics
│   │   ├── context/   # AuthContext, ThemeContext
│   │   ├── layouts/   # AppLayout (sidebar + header)
│   │   ├── services/  # API client, WebSocket service
│   │   └── types/     # Shared TypeScript interfaces
│   └── vercel.json    # Vercel deployment config
│
└── supabase/
    └── migrations/    # Supabase PostgreSQL schema SQL
```

---

## 🚀 Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/servicehub-ai.git
cd servicehub-ai
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and DATABASE_URL

# Run database migrations
alembic upgrade head

# Seed demo data (Super Admin + Acme org)
python -m app.db.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://127.0.0.1:8000**
Swagger API Docs: **http://127.0.0.1:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env already set to http://127.0.0.1:8000/api/v1 for local dev

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Demo Accounts

| Role | Email | Password | Org Code |
|---|---|---|---|
| 🛡️ Super Admin | `servicehubai.2026@gmail.com` | `SuperAdmin@2026` | — |
| 🏢 Org Admin | `admin@acme.com` | `Password123!` | `acme` |
| 👔 Manager | `manager.it@acme.com` | `Password123!` | `acme` |
| 🎧 Agent | `agent.john@acme.com` | `Password123!` | `acme` |
| 👤 Employee | `employee.sarah@acme.com` | `Password123!` | `acme` |

---

## ☁️ Production Deployment

### Step 1 — Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Note your **Project Ref**, **DB Password**, and **Anon Key**.
3. Open **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql`. Run it.
4. Your **Database URL** will be:
   ```
   postgresql+asyncpg://postgres:[YOUR-DB-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

### Step 2 — Render (Backend API)

1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect your GitHub repository and select the **`backend/`** directory.
3. Render auto-detects `render.yaml`. Add Environment Variables:

| Variable | Value |
|---|---|
| `SECRET_KEY` | A random 32+ char secret string |
| `DATABASE_URL` | Supabase PostgreSQL URL from Step 1 |
| `GEMINI_API_KEY` | Your Google AI Studio API key |
| `BACKEND_CORS_ORIGINS` | `["https://your-app.vercel.app"]` |

4. Deploy. Note your Render backend URL (e.g., `https://servicehub-ai-backend.onrender.com`).

---

### Step 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repository. Set **Root Directory** to `frontend/`.
3. Add Environment Variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://servicehub-ai-backend.onrender.com/api/v1` |

4. Deploy. Your app goes live at `https://your-app.vercel.app`.

---

## 🔐 Backend Environment Variables Reference

```env
PROJECT_NAME="ServiceHub AI"
API_V1_STR="/api/v1"
SECRET_KEY="your-random-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# SQLite (local) or Supabase PostgreSQL (production)
DATABASE_URL="sqlite+aiosqlite:///./servicehub.db"
# DATABASE_URL="postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

GEMINI_API_KEY="your-gemini-api-key"
BACKEND_CORS_ORIGINS='["http://localhost:5173","https://your-app.vercel.app"]'
```

## 🖥️ Frontend Environment Variables Reference

```env
VITE_API_URL="http://127.0.0.1:8000/api/v1"
```

---

## 📦 Technology Stack

### Backend
| Package | Purpose |
|---|---|
| `fastapi` | REST & WebSocket API framework |
| `sqlalchemy[asyncio]` | Async ORM with multi-tenant models |
| `alembic` | Database migrations |
| `pydantic v2` | Request/response data validation |
| `python-jose` | JWT token generation & validation |
| `bcrypt` | Secure password hashing |
| `pypdf` | PDF text extraction for RAG |
| `python-docx` | DOCX text extraction for RAG |
| `pandas` + `openpyxl` | Excel & CSV parsing for RAG |
| `langchain-text-splitters` | Document chunking for vector RAG |
| `google-genai` | Gemini AI API (classification + RAG) |
| `beautifulsoup4` | URL link content extraction |

### Frontend
| Package | Purpose |
|---|---|
| `react 19` | UI framework |
| `vite` | Build tool & dev server |
| `typescript` | Type-safe development |
| `tailwindcss` | Utility-first CSS |
| `shadcn/ui` | Radix-based UI component library |
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state management |
| `react-hook-form` + `zod` | Forms with schema validation |
| `recharts` | Analytics data visualizations |
| `framer-motion` | Micro-animations & transitions |
| `lucide-react` | Icon library |

---

## 🗄️ Supabase Schema Overview

```
organizations     Multi-tenant root entity
users             Belongs to org, has role (SUPER_ADMIN/ORG_ADMIN/MANAGER/AGENT/EMPLOYEE)
departments       Belongs to org, has manager
tickets           Multi-tenant ITIL-style tickets with SLA enforcement
ticket_comments   Public replies + internal agent notes
ticket_activities Full audit trail
kb_documents      Uploaded files (PDF, DOCX, XLSX, CSV, URLs)
kb_chunks         Vector RAG text chunks (org-isolated)
chat_threads      Conversation sessions per user
chat_messages     Real-time WebSocket messages
notifications     In-app alert system
ai_usage_logs     Gemini API token consumption tracking
```

---

## 📜 License

MIT License — Built for enterprise service management.
