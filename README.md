# TalentGraph AI

> AI-Powered Workforce Intelligence Platform
> Built for the SkillsHub Hackathon by Solvex

TalentGraph AI is an intelligent workforce discovery platform that helps HR teams identify the right talent using semantic AI-powered search, resume intelligence, and reasoning-driven candidate matching.

Instead of relying on outdated spreadsheets or keyword filters, TalentGraph AI understands skills contextually and helps organizations discover, evaluate, and assemble high-performing teams through natural language interactions.

---

# 🚀 Problem Statement

Modern organizations struggle to understand and utilize employee skill data effectively. Traditional HR systems rely heavily on manual tagging, static profiles, and keyword matching, making talent discovery inefficient and inaccurate.

TalentGraph AI solves this by:

* Automatically extracting structured skills from resumes
* Inferring related expertise using AI reasoning
* Enabling semantic natural language talent search
* Generating intelligent team recommendations
* Providing explainable AI-powered match scoring

---

# ✨ Core Features

## 🧠 AI Resume Intelligence

Upload a resume PDF and automatically extract:

* Skills
* Experience
* Certifications
* Projects
* Seniority
* Domain expertise

Powered by Claude AI reasoning.

---

## 🔍 Semantic Talent Search

Search naturally like:

> “Find a React developer with WebSocket and payment integration experience.”

TalentGraph AI understands intent and returns:

* Ranked candidates
* Match percentages
* AI-generated reasoning
* Skill overlap analysis

---

## 👥 AI Team Builder

Describe a project requirement and generate optimized teams instantly.

Example:

> “Build a 4-member fintech engineering team with React, Node.js, AWS, and DevOps expertise.”

The platform intelligently:

* Selects candidates
* Balances seniority
* Evaluates skill coverage
* Suggests alternatives

---

## 🧾 Profile Review Workflow

AI-generated profiles go through a verification workflow where employees or HR teams can:

* Review extracted information
* Edit inaccuracies
* Approve profiles before publishing

---

## 📊 Smart Skill Intelligence

The platform can infer related skills automatically.

Examples:

* Next.js → React
* Express.js → REST APIs
* AWS Lambda → Serverless Architecture

---

# 🛠️ Tech Stack

## Frontend

* Next.js 15 (App Router)
* JavaScript
* Tailwind CSS
* Shadcn UI
* Framer Motion

## Backend

* Next.js API Routes
* Node.js

## Database

* MongoDB
* Mongoose

## AI Layer

* Claude AI

## Additional Tools

* PDF Parsing
* Semantic Search Logic
* AI Prompt Engineering

---

# 🧱 System Architecture

```txt id="system-architecture"
Frontend (Next.js)
        ↓
API Layer (Next.js API Routes)
        ↓
AI Processing Layer (Claude AI)
        ↓
MongoDB Database
```

---

# 🔐 User Roles

## HR Team

* Search employees
* Build teams
* Review profiles
* Manage workforce intelligence

## Employees

* Upload resumes
* Manage profiles
* Review extracted skills
* Update experience & certifications

---

# 📁 Project Structure

```txt id="project-structure"
/app
  /api
  /dashboard
  /employee
  /hr
  /search
/components
/lib
/models
/utils
/hooks
/public
```

---

# ⚡ Getting Started

## 1. Clone Repository

```bash id="clone-repo"
git clone https://github.com/your-username/solvex-talentgraph-ai.git
```

---

## 2. Install Dependencies

```bash id="install-dependencies"
npm install
```

---

## 3. Configure Environment Variables

Create `.env.local`

```env id="env-example"
MONGODB_URI=
CLAUDE_API_KEY=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## 4. Run Development Server

```bash id="run-dev"
npm run dev
```

---

# 🎯 Hackathon Focus

This project intentionally focuses on the two core AI challenges from the problem statement:

1. Smart Profile Ingestion
2. Semantic Natural Language Search

The goal was not to build another CRUD HR system — but to create an intelligent workforce reasoning platform that feels like a real next-generation AI product.

---

# 🧠 AI Reasoning Examples

## Query

> “Find backend developers with payment gateway experience.”

## AI Response

> “Rahul is a strong match because he has 4 years of Node.js experience, implemented Stripe integrations in two fintech platforms, and recently worked on scalable payment processing systems.”

---

# 🚀 Future Improvements

* Vector embeddings for advanced semantic retrieval
* GitHub repository intelligence
* Skill gap analytics
* Conversational HR assistant
* Availability forecasting
* Organization-wide workforce insights

---

# 👨‍💻 Solvex

Solvex is a two-member hackathon team:

* Surya Lad
* Claude AI

Built with speed, AI-first thinking, and product-focused execution during the SkillsHub Hackathon.

---

# 📌 Submission Notes

This repository was built as part of a hackathon challenge focused on:

* AI capability
* Semantic reasoning
* Architecture quality
* UX polish
* Product thinking

The project prioritizes intelligent workflows, explainable AI, and real-world usability.

---

# ⭐ Vision

TalentGraph AI is designed to evolve beyond a hackathon prototype into a true AI-powered workforce intelligence operating system for modern organizations.
