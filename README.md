# TalentGraph AI

> AI-Powered Workforce Intelligence Platform
> Built for the SkillsHub Hackathon by Solvex

TalentGraph AI is an intelligent workforce discovery platform that helps HR teams identify the right talent using semantic AI-powered search, resume intelligence, and reasoning-driven candidate matching — powered by **Google Gemini 2.5 Flash**.

Instead of relying on outdated spreadsheets or keyword filters, TalentGraph AI understands skills contextually and helps organizations discover, evaluate, and assemble high-performing teams through natural language interactions.

---

## 🚀 Problem Statement

Modern organizations struggle to understand and utilize employee skill data effectively. Traditional HR systems rely heavily on manual tagging, static profiles, and keyword matching, making talent discovery inefficient and inaccurate.

TalentGraph AI solves this by:

* Automatically extracting structured skills and experience from resume PDFs
* Inferring related expertise using AI reasoning
* Enabling semantic natural language talent search with explainable match scoring
* Generating intelligent, constraint-aware team recommendations
* Providing organization-wide skill gap analytics
* Syncing real-world signal from public GitHub profiles

---

## ✨ Features

### 🧠 AI Resume Intelligence

Upload a resume PDF and Gemini 2.5 Flash automatically extracts:

* Skills with proficiency levels and years of experience
* Work history, achievements, and technologies used
* Certifications, education, and projects
* Seniority level, domain expertise, and career trajectory
* AI-generated profile summary and strengths

Employees review the parsed data before saving it to their profile through a guided 3-step workflow (Upload → Review → Save).

---

### 🔍 Semantic Talent Search

Search your talent pool using plain English:

> "Find a senior React developer with payment integration and AWS experience"

TalentGraph AI returns:

* Candidates ranked by semantic match score (0–100)
* AI-generated per-candidate reasoning with specific evidence
* Skill gap analysis and key strengths
* Match level classification (Excellent / Strong / Good / Fair / Weak)
* Synonym-aware matching — Node.js = NodeJS, React = ReactJS, Postgres = PostgreSQL

---

### 💬 AI Chat Search

Conversational talent discovery with session memory:

> "Show me available backend engineers who know Python and AWS"
> "Now filter to only those with Kubernetes experience"

The chat interface:

* Maintains conversation context across follow-up refinements
* Surfaces inline candidate chips directly in the chat thread
* Suggests follow-up queries based on search results
* Understands domain context: fintech → payments/banking, healthtech → HIPAA

---

### 👥 AI Team Builder

Describe a project and generate an optimized team instantly:

> "Build a fintech mobile app with real-time payments, fraud detection, and a React dashboard with 5 years experience"

The platform:

* Parses hard constraints from natural language (minimum experience, seniority level)
* Pre-filters the candidate pool before sending to AI
* Selects 3–7 non-redundant members covering all required domains
* Balances seniority and avoids single points of failure
* Provides skill coverage map, team score, risks, and alternative candidates

---

### 📊 Skill Gap Analytics

Organization-wide intelligence dashboard for HR teams with:

* Top skills by frequency and proficiency distribution across the org
* Department-level skill breakdowns with employee counts
* Seniority distribution and experience band analytics
* Category breakdown (Frontend, Backend, Cloud, AI/ML, Design, etc.)
* KPI cards: total employees, avg skills per person, avg years experience, available count

---

### 🐙 GitHub Integration

Employees can connect their public GitHub profile to enrich their profile:

* Syncs public repos, top languages, followers/following
* Detects technical skills from language usage and repo topics
* Automatically queues detected skills as AI-inferred suggestions for HR review
* Displays a language proficiency bar and top repositories

---

### 📦 Bulk Resume Import

HR teams can import multiple employees at once:

* Upload up to 20 PDF resumes in a single batch
* Sequential AI processing to respect rate limits
* Automatically creates User + Employee records or updates existing profiles by email
* Per-file status tracking (created / updated / skipped / error)
* Summary report after import completes

---

### 🧾 Profile Review Workflow

All AI-generated profiles go through a structured approval workflow:

* Employees review and edit extracted information before publishing
* HR can approve or reject submitted profiles
* Inferred skills are surfaced separately for conscious acceptance
* Profile completeness score tracks quality over time

---

## 🛠️ Tech Stack

### Frontend

* Next.js 15 (App Router, Server + Client Components)
* JavaScript (ES2024)
* Tailwind CSS
* Shadcn UI (Radix UI primitives)
* Framer Motion (page transitions, animated cards)
* Recharts (analytics charts)
* Lucide React (icons)

### Backend

* Next.js API Routes (Node.js runtime)
* JWT authentication (HTTP-only cookies)
* Role-based access control (HR / Employee)

### Database

* MongoDB (Atlas or local)
* Mongoose ODM
* Aggregation pipelines for analytics

### AI Layer

* **Google Gemini 2.5 Flash** — resume extraction, semantic search ranking, team composition, chat intent parsing, skill inference
* **text-embedding-004** — semantic similarity for embedding-based candidate ranking
* Production-grade client with exponential backoff retry, 55s timeout guard, and permissive safety settings for HR content
* In-memory LRU cache (2-min TTL for search, 5-min for team builder)

### Additional

* `pdf-parse` — PDF text extraction with Unicode ligature cleaning
* GitHub REST API (public, unauthenticated)
* `@google/generative-ai` SDK v0.24+

---

## 🧱 System Architecture

```
Browser (Next.js App Router)
         │
         ▼
  API Routes (/api/*)
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
MongoDB (Mongoose)    Gemini 2.5 Flash
  - Employee              - Resume extraction
  - User                  - Semantic ranking
  - Skill                 - Team composition
                          - Chat intent
                          - Skill inference
                          │
                          ▼
                  text-embedding-004
                  (semantic similarity)
```

---

## 🔐 User Roles

### HR Team (`/hr/*`)

* AI semantic search across the full talent pool
* AI Chat search with conversation memory
* Team Builder with project-to-team composition
* Employee directory with department/skill filters
* Skill Gap Analytics dashboard
* Bulk resume import
* Profile approval workflow

### Employees (`/employee/*`)

* Upload resume → AI parses → review → save to profile
* Manage profile: skills, experience, certifications, education, projects
* Connect GitHub for automatic skill detection
* View and accept AI-inferred skill suggestions

---

## 📁 Project Structure

```
/app
  /api
    /employees          # CRUD + /me endpoint
    /search             # Semantic search + /chat
    /team-builder       # AI team composition
    /resume
      /parse            # Single PDF parse
      /bulk             # Multi-PDF bulk import
    /analytics
      /skill-gap        # 6-aggregation analytics pipeline
    /github
      /sync             # GitHub profile sync
    /ai
      /extract-resume   # Direct AI extraction endpoint
    /seed               # Dev seeding
  /(dashboard)
    /hr                 # HR pages (search, directory, team-builder, analytics, chat, bulk-import)
    /employee           # Employee pages (profile, resume, github)
/components
  /hr                   # EmployeeCard, SearchResultCard, TeamMemberCard
  /employee             # ResumeUpload, ParsedResumeReview
  /shared               # Sidebar, PageHeader, SkeletonCard, EmptyState
  /dashboard            # StatsCard
  /ui                   # Shadcn primitives
/lib
  /ai
    gemini.js           # Gemini client (retry, timeout, safety)
    prompts.js          # 8 prompt templates
    parser.js           # Robust JSON parser with repair
    search.js           # Semantic search + team builder
    embeddings.js       # text-embedding-004 ranking
    extractor.js        # Resume data extraction
    utils.js            # LRU cache, serializers, error classifier
  /db
    /models             # Employee, User, Skill schemas
    seed.js             # Demo data seeder
  /github
    service.js          # GitHub public API sync
  /resume
    parser.js           # PDF text extraction
  /auth
    guards.js           # getAuthUser, requireAuth
/context
  AuthContext.jsx
/hooks
  useDebounce.js
```

---

## ⚡ Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-username/solvex-talentgraph-ai.git
cd solvex-talentgraph-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/talentgraph

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TalentGraph AI
```

Get your Gemini API key at [aistudio.google.com](https://aistudio.google.com).

### 4. Seed Demo Data

```bash
# Start the dev server first, then:
curl -X POST http://localhost:3000/api/seed
```

This creates 2 HR users and 8 employee profiles with skills, experience, and certifications.

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| HR | sarah.mitchell@company.com | Password123! |
| Employee | alice.chen@company.com | Password123! |

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧠 AI Reasoning Examples

### Semantic Search

**Query:** `"Find backend developers with payment gateway experience"`

**Gemini Response:**
> Bob is a strong match — 5 years of Node.js with PostgreSQL, implemented payment APIs at Shopify, and has direct AWS experience relevant to payment infrastructure. Available immediately.

---

### Team Builder

**Requirement:** `"Build a fintech mobile app with real-time payments and fraud detection with 5 years experience"`

**Gemini Output:**
* Mobile Lead — React Native + Swift specialist
* Backend Engineer — Node.js + PostgreSQL for payment APIs
* ML Engineer — Python + fraud detection models
* DevOps Lead — AWS + Kubernetes for real-time infrastructure

Hard constraint applied: only candidates with ≥ 5 years experience considered.

---

## 🎯 Hackathon Focus

This project addresses the two core AI challenges from the problem statement:

1. **Smart Profile Ingestion** — Gemini extracts structured, reasoned profile data from unstructured resume PDFs with proficiency calibration and career trajectory analysis
2. **Semantic Natural Language Search** — Gemini ranks candidates by semantic relevance, not keyword overlap, with per-candidate explanations grounded in actual profile data

The goal was not to build another CRUD HR system — but a workforce reasoning platform that feels like a real next-generation AI product.

---

## 🚀 Potential Future Improvements

* Vector database (Pinecone / pgvector) for persistent semantic search at scale
* Real-time availability forecasting based on project timelines
* Org chart visualization and reporting chain mapping
* LinkedIn profile sync
* Slack / Teams integration for talent alerts
* Skills benchmark against industry datasets

---

## 👨‍💻 Built by Solvex

* **Surya Lad** — Product, engineering, and AI integration

Built with speed, AI-first thinking, and product-focused execution during the SkillsHub Hackathon.

---

## 📌 Submission Notes

Built as part of a hackathon challenge evaluated on:

* AI capability and LLM integration depth
* Semantic reasoning quality
* Architecture quality and code organization
* UX polish and product thinking
* Real-world usability

TalentGraph AI prioritizes intelligent workflows, explainable AI decisions, and production-grade engineering patterns throughout.

---

## ⭐ Vision

TalentGraph AI is designed to evolve beyond a hackathon prototype into a true AI-powered workforce intelligence operating system — helping organizations understand, grow, and deploy their human capital with the same precision they apply to their technology infrastructure.
