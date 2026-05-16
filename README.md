# TalentGraph AI

> AI-Powered Workforce Intelligence Platform
> Built for the SkillsHub Hackathon by Solvex

TalentGraph AI is an intelligent workforce discovery platform that helps HR teams identify the right talent using semantic AI-powered search, resume intelligence, and reasoning-driven candidate matching — powered by **Anthropic Claude**.

Instead of relying on outdated spreadsheets or keyword filters, TalentGraph AI understands skills contextually and helps organizations discover, evaluate, and assemble high-performing teams through natural language interactions.

---

## Problem Statement

Modern organizations struggle to understand and utilize employee skill data effectively. Traditional HR systems rely heavily on manual tagging, static profiles, and keyword matching, making talent discovery inefficient and inaccurate.

TalentGraph AI solves this by:

* Automatically extracting structured skills and experience from resume PDFs
* Inferring related expertise using AI reasoning
* Enabling semantic natural language talent search with explainable match scoring
* Generating intelligent, constraint-aware team recommendations
* Providing organization-wide skill gap analytics
* Syncing real-world signal from public GitHub profiles

---

## Features

### AI Resume Intelligence

Upload a resume PDF and Claude automatically extracts:

* Skills with proficiency levels and years of experience
* Work history, achievements, and technologies used
* Certifications, education, and projects
* Seniority level, domain expertise, and career trajectory
* AI-generated profile summary and strengths

Employees review the parsed data before saving it through a guided 3-step workflow (Upload → Review → Save).

---

### Semantic Talent Search

Search your talent pool using plain English:

> "Find a senior React developer with payment integration and AWS experience"

TalentGraph AI returns:

* Candidates ranked by semantic match score (0–100)
* AI-generated per-candidate reasoning with specific evidence
* Skill gap analysis and key strengths
* Match level classification (Excellent / Strong / Good / Fair / Weak)
* Synonym-aware matching — Node.js = NodeJS, React = ReactJS, Postgres = PostgreSQL

---

### AI Chat Search

Conversational talent discovery with session memory:

> "Show me available backend engineers who know Python and AWS"
> "Now filter to only those with Kubernetes experience"

The chat interface:

* Maintains conversation context across follow-up refinements
* Surfaces inline candidate chips directly in the chat thread
* Suggests follow-up queries based on search results
* Understands domain context: fintech → payments/banking, healthtech → HIPAA

---

### AI Team Builder

Describe a project and generate an optimized team instantly:

> "Build a fintech mobile app with real-time payments, fraud detection, and a React dashboard with 5 years experience"

The platform:

* Parses hard constraints from natural language (minimum experience, seniority level)
* Pre-filters the candidate pool before sending to AI
* Selects 3–7 non-redundant members covering all required domains
* Balances seniority and avoids single points of failure
* Provides skill coverage map, team score, risks, and alternative candidates

---

### Skill Gap Analytics

Organization-wide intelligence dashboard for HR teams with:

* Top skills by frequency and proficiency distribution across the org
* Department-level skill breakdowns with employee counts
* Seniority distribution and experience band analytics
* Category breakdown (Frontend, Backend, Cloud, AI/ML, Design, etc.)
* KPI cards: total employees, avg skills per person, avg years experience, available count

---

### GitHub Integration

Employees can connect their public GitHub profile to enrich their profile:

* Syncs public repos, top languages, followers/following
* Detects technical skills from language usage and repo topics
* Automatically queues detected skills as AI-inferred suggestions for HR review
* Displays a language proficiency bar and top repositories

---

### Bulk Resume Import

HR teams can import multiple employees at once:

* Upload up to 20 PDF resumes in a single batch
* Sequential AI processing to respect rate limits
* Automatically creates User + Employee records or updates existing profiles by email
* Per-file status tracking (created / updated / skipped / error)
* Summary report after import completes

---

### Profile Review Workflow

All AI-generated profiles go through a structured approval workflow:

* Employees review and edit extracted information before publishing
* HR can approve or reject submitted profiles
* Inferred skills are surfaced separately for conscious acceptance
* Profile completeness score tracks quality over time

---

## Tech Stack

### Frontend (Next.js App — Primary)

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 15.1+ | App Router, Server + Client Components, API Routes |
| React | 18.3+ | UI library |
| Tailwind CSS | 3.4+ | Utility-first styling |
| Shadcn UI | Latest | Component system built on Radix UI primitives |
| Framer Motion | 11.x | Page transitions and animated cards |
| Recharts | 2.14+ | Analytics charts and skill distribution graphs |
| Lucide React | Latest | Icon library |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| Sonner | 1.7+ | Toast notifications |

### Frontend (Vite Client — Alternative/Legacy)

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.3+ | UI library |
| Vite | 6.x | Build tool and dev server |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.7+ | HTTP client for API calls |
| Tailwind CSS | 3.4+ | Styling |
| Framer Motion | 11.x | Animations |
| Recharts | 2.14+ | Charts |

### Backend (Next.js API Routes — Primary)

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js API Routes | 15.x | Serverless API endpoints |
| Node.js | 20+ | Runtime |
| jose | 5.x | JWT token creation and verification |
| bcryptjs | 2.x | Password hashing |
| pdf-parse | 1.x | PDF text extraction with Unicode cleaning |
| concurrently | 8.x | Run multiple scripts in parallel |

### Backend (Express Server — Alternative)

| Tool | Version | Purpose |
|------|---------|---------|
| Express | 4.18+ | HTTP server framework |
| helmet | 7.x | Security headers |
| morgan | 1.x | HTTP request logging |
| cors | 2.x | Cross-origin resource sharing |
| express-rate-limit | 7.x | Rate limiting |
| multer | 1.x | Multipart file upload handling |
| cookie-parser | 1.x | Cookie middleware |
| jsonwebtoken | 9.x | JWT auth |
| nodemon | 3.x | Dev auto-restart |

### Database

| Tool | Version | Purpose |
|------|---------|---------|
| MongoDB | Atlas or local | Primary data store |
| Mongoose | 8.x | ODM with aggregation pipelines |

**Models:** `User`, `Employee`, `Skill`, `SearchHistory`, `TeamBuilderSession`

### AI Layer

| Tool | Purpose |
|------|---------|
| Anthropic Claude | Resume extraction, semantic search ranking, team composition, chat intent parsing |
| text-embedding-004 | Embedding-based semantic similarity for candidate ranking |
| @anthropic-ai/sdk | Anthropic Claude API client |
| @anthropic-ai/sdk | Anthropic Claude client (integrated, available for use) |

AI client features:
* Exponential backoff retry on rate limits
* 55-second timeout guard
* Permissive safety settings for HR content
* In-memory LRU cache (2-min TTL for search, 5-min for team builder)
* Skill inference engine with 100+ domain rules

### Auth

| Tool | Purpose |
|------|---------|
| JWT (HTTP-only cookies) | Stateless session management |
| NextAuth.js | OAuth-ready auth adapter |
| Role-based middleware | HR vs Employee route enforcement |

---

## System Architecture

```
Browser (Next.js App Router)
         │
         ▼
  Next.js Middleware (JWT auth, role routing)
         │
         ▼
  API Routes (/api/*)
         │
    ┌────┴────────────────────────┐
    │                             │
    ▼                             ▼
MongoDB (Mongoose)        Anthropic Claude
  - Employee                - Resume extraction
  - User                    - Semantic ranking
  - Skill                   - Team composition
  - SearchHistory           - Chat intent
  - TeamBuilderSession      - Skill inference
                                  │
                                  ▼
                          text-embedding-004
                          (semantic similarity)

Alternative Stack:
  Vite Client (port 5173) → Express Server (port 5000) → MongoDB
```

---

## User Roles

### HR Team (`/hr/*`)

* AI semantic search across the full talent pool
* AI Chat search with conversation memory
* Team Builder with project-to-team composition
* Employee directory with department/skill filters
* Skill Gap Analytics dashboard
* Bulk resume import (up to 20 PDFs)
* Profile approval workflow

### Employees (`/employee/*`)

* Upload resume → AI parses → review → save to profile
* Manage profile: skills, experience, certifications, education, projects
* Connect GitHub for automatic skill detection
* View and accept AI-inferred skill suggestions

---

## Project Structure

```
Solvex-skillshub-Project/
├── app/                          # Next.js 15 App Router (primary app)
│   ├── api/
│   │   ├── employees/            # CRUD + /me endpoint
│   │   ├── search/               # Semantic search + /chat
│   │   ├── team-builder/         # AI team composition
│   │   ├── resume/
│   │   │   ├── parse/            # Single PDF parse
│   │   │   └── bulk/             # Multi-PDF bulk import
│   │   ├── analytics/skill-gap/  # 6-aggregation analytics pipeline
│   │   ├── github/sync/          # GitHub profile sync
│   │   ├── ai/extract-resume/    # Direct AI extraction endpoint
│   │   ├── auth/                 # Login, register, logout, me
│   │   └── seed/                 # Dev data seeder
│   ├── (auth)/                   # Login, Register, Signup pages
│   └── (dashboard)/
│       ├── hr/                   # Search, directory, team-builder, analytics, chat, bulk-import
│       └── employee/             # Profile, resume, github pages
│
├── components/
│   ├── hr/                       # EmployeeCard, SearchResultCard, TeamMemberCard
│   ├── employee/                 # ResumeUpload, ParsedResumeReview, SkillsEditor
│   ├── shared/                   # Sidebar, PageHeader, SkeletonCard, EmptyState
│   ├── dashboard/                # StatsCard
│   └── ui/                       # Shadcn UI primitives (button, card, dialog, etc.)
│
├── lib/
│   ├── ai/
│   │   ├── gemini.js             # Claude AI client (retry, timeout, safety settings)
│   │   ├── prompts.js            # 8 AI prompt templates
│   │   ├── parser.js             # Robust JSON parser with auto-repair
│   │   ├── search.js             # Semantic search + team builder logic
│   │   ├── embeddings.js         # text-embedding-004 ranking
│   │   ├── extractor.js          # Resume data extraction orchestration
│   │   ├── inference.js          # Skill inference engine (100+ rules)
│   │   └── utils.js              # LRU cache, serializers, error classifier
│   ├── db/
│   │   ├── models/               # Employee, User, Skill, SearchHistory, TeamBuilderSession
│   │   └── seed.js               # Demo data (2 HR users, 8 employees)
│   ├── auth/
│   │   ├── jwt.js                # Token creation/verification (jose)
│   │   ├── cookies.js            # HTTP-only cookie management
│   │   ├── guards.js             # getAuthUser, requireAuth helpers
│   │   └── options.js            # NextAuth config
│   ├── github/service.js         # GitHub public API sync
│   └── resume/parser.js          # PDF text extraction
│
├── context/AuthContext.jsx
├── hooks/useDebounce.js
├── middleware.js                  # JWT verification + role-based routing
│
├── server/                        # Express.js backend (alternative stack)
│   ├── server.js                  # Entry point (port 5000)
│   ├── routes/                    # auth, employees, search, team-builder, resume, analytics, github
│   ├── controllers/               # authController, employeeController, searchController
│   ├── services/ai/               # claude.js, prompts.js
│   ├── models/                    # User, Employee, Skill
│   ├── middlewares/               # errorHandler, auth, validation
│   └── config/                    # db.js, env.js
│
└── client/                        # Vite + React frontend (alternative stack)
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── services/
    │   └── routes/
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

* Node.js 20+
* npm 10+
* MongoDB (local or Atlas)
* Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

---

### Option A — Next.js Full-Stack (Recommended)

This runs the complete app: Next.js handles both the frontend and API routes on a single port.

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/talentgraph
# or Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/talentgraph

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Google Claude AI
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TalentGraph AI
```

#### 3. Run the development server

```bash
npm run dev
```

App runs at **http://localhost:3000**

#### 4. Seed demo data (optional)

```bash
# With the server running:
curl -X POST http://localhost:3000/api/seed

# Or on Windows PowerShell:
Invoke-RestMethod -Method POST http://localhost:3000/api/seed
```

This creates 2 HR users and 8 employee profiles with full skills, experience, and certifications.

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| HR | sarah.mitchell@company.com | Password123! |
| HR | jennifer.park@company.com | Password123! |
| Employee | alice.chen@company.com | Password123! |
| Employee | bob.martinez@company.com | Password123! |

---

### Option B — Express + Vite (Alternative Stack)

This runs the Express backend and Vite React frontend as separate services.

#### 1. Install all dependencies

```bash
npm run install:all
# or manually:
npm install
cd server && npm install
cd ../client && npm install
```

#### 2. Configure environment variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/talentgraph
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=30d
ANTHROPIC_API_KEY=your-anthropic-api-key-here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### 3. Run both services concurrently

```bash
npm run dev:stack
```

| Service | URL |
|---------|-----|
| Vite React client | http://localhost:5173 |
| Express API server | http://localhost:5000 |

Or run them separately:

```bash
# Terminal 1 — Express server
npm run dev:server

# Terminal 2 — Vite client
npm run dev:client
```

---

### Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint |
| `npm run dev:stack` | Run Express server + Vite client concurrently |
| `npm run dev:server` | Run Express server only (port 5000) |
| `npm run dev:client` | Run Vite client only (port 5173) |
| `npm run install:all` | Install root + server + client dependencies |

---

## AI Reasoning Examples

### Semantic Search

**Query:** `"Find backend developers with payment gateway experience"`

**Claude Response:**
> Bob is a strong match — 5 years of Node.js with PostgreSQL, implemented payment APIs at Shopify, and has direct AWS experience relevant to payment infrastructure. Available immediately.

---

### Team Builder

**Requirement:** `"Build a fintech mobile app with real-time payments and fraud detection with 5 years experience"`

**Claude Output:**
* Mobile Lead — React Native + Swift specialist
* Backend Engineer — Node.js + PostgreSQL for payment APIs
* ML Engineer — Python + fraud detection models
* DevOps Lead — AWS + Kubernetes for real-time infrastructure

Hard constraint applied: only candidates with ≥ 5 years experience considered.

---

## Hackathon Focus

This project addresses the two core AI challenges from the problem statement:

1. **Smart Profile Ingestion** — Claude extracts structured, reasoned profile data from unstructured resume PDFs with proficiency calibration and career trajectory analysis
2. **Semantic Natural Language Search** — Claude ranks candidates by semantic relevance, not keyword overlap, with per-candidate explanations grounded in actual profile data

---

## Potential Future Improvements

* Vector database (Pinecone / pgvector) for persistent semantic search at scale
* Real-time availability forecasting based on project timelines
* Org chart visualization and reporting chain mapping
* LinkedIn profile sync
* Slack / Teams integration for talent alerts
* Skills benchmark against industry datasets

---

## Built by Solvex

* **Surya Lad** — Product, engineering, and AI integration

Built with speed, AI-first thinking, and product-focused execution during the SkillsHub Hackathon.

---

## Submission Notes

Built as part of a hackathon challenge evaluated on:

* AI capability and LLM integration depth
* Semantic reasoning quality
* Architecture quality and code organization
* UX polish and product thinking
* Real-world usability

TalentGraph AI prioritizes intelligent workflows, explainable AI decisions, and production-grade engineering patterns throughout.

---

## Vision

TalentGraph AI is designed to evolve beyond a hackathon prototype into a true AI-powered workforce intelligence operating system — helping organizations understand, grow, and deploy their human capital with the same precision they apply to their technology infrastructure.
