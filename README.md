# 🏙️ City Pulse AI — Municipal Intelligence Platform

> **AI-powered civic intelligence for Montgomery, AL** — transforming raw municipal data into actionable insights for city leaders and transparent information for citizens.

🔗 **Live App:** [city-pulse-aip.lovable.app](https://city-pulse-aip.lovable.app)

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack & Sponsored Technologies](#tech-stack--sponsored-technologies)
- [Data Pipeline](#data-pipeline)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Commercial Potential](#commercial-potential)
- [Team](#team)

---

## 🎯 Problem Statement

Cities generate massive volumes of operational data — 311 service requests, 911 emergency calls, business licenses — but this data sits in silos, inaccessible to decision-makers and invisible to citizens. City leaders lack real-time intelligence to allocate resources effectively, and citizens have no window into how their city actually operates.

**City Pulse AI bridges this gap** by ingesting, analyzing, and surfacing municipal data through an AI-powered intelligence platform that serves both leadership and the public.

---

## 💡 Solution Overview

City Pulse AI is a **production-ready civic intelligence platform** that:

1. **Ingests** real municipal datasets (311, 911, business licenses) via automated CSV pipeline
2. **Analyzes** data through a district scoring engine that computes risk, demand, and economic signals
3. **Generates** AI-powered insights using RAG (Retrieval-Augmented Generation) with vector search
4. **Presents** dual-mode dashboards — Executive Intelligence for leaders, Public Transparency for citizens
5. **Recommends** prioritized actions based on signal convergence across districts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 18 + TypeScript + Tailwind CSS + shadcn/ui           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Overview  │ │ Safety   │ │ Economic │ │ AI Brief │       │
│  │Dashboard  │ │ Analytics│ │ Signals  │ │ (RAG)    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Infra    │ │ Heatmap  │ │Recommend │ │Transpare │       │
│  │ 311 Data │ │ District │ │ Actions  │ │ ncy      │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  Mode Context: Leadership ↔ Citizen Toggle                  │
│  State: React Query (5min cache) + Supabase Realtime        │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API + Edge Functions
┌───────────────────┴─────────────────────────────────────────┐
│                    BACKEND (Supabase)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Edge Functions (Deno)                   │    │
│  │  ┌──────────────┐  ┌───────────────┐                │    │
│  │  │ingest-dataset│  │compute-scores │                │    │
│  │  │ CSV → Tables │  │ District Risk │                │    │
│  │  └──────────────┘  └───────────────┘                │    │
│  │  ┌──────────────┐  ┌───────────────┐                │    │
│  │  │gen-embeddings│  │  ai-briefing  │                │    │
│  │  │ → pgvector   │  │ RAG + Stream  │                │    │
│  │  └──────────────┘  └───────────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                      │    │
│  │  • service_requests_311  • calls_911_monthly         │    │
│  │  • business_licenses     • district_scores           │    │
│  │  • district_signals      • ai_recommendations        │    │
│  │  • vector_documents (pgvector embeddings)            │    │
│  │  • dataset_catalog       • ingestion_audit_log       │    │
│  │  • 10+ materialized views for analytics              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AI Layer                                │    │
│  │  • Google Gemini Flash — reasoning & briefings       │    │
│  │  • OpenAI text-embedding-3-small — vector embeddings │    │
│  │  • RAG: embed query → pgvector similarity search     │    │
│  │         → context injection → streaming response     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CSV Files → ingest-dataset (Edge Fn) → PostgreSQL Tables
                                              ↓
                              compute-scores (Edge Fn)
                                              ↓
                              district_scores + district_signals
                                              ↓
                              generate-embeddings (Edge Fn)
                                              ↓
                              vector_documents (pgvector)
                                              ↓
User Query → ai-briefing (Edge Fn) → Embed Query → Vector Search
                                              ↓
                              Context + Gemini Flash → Streaming Response
```

---

## ✨ Key Features

### For City Leadership (Executive Mode)
- **Real-time KPI Dashboard** — 911 call volume, 311 resolution rates, business license activity
- **District Risk Scoring** — 5-dimensional scoring: public safety, emergency demand, economic activity, infrastructure stress, community engagement
- **AI Briefing Engine** — Ask natural language questions, get streaming AI responses grounded in real city data
- **Strategic Action Recommendations** — AI-generated prioritized recommendations based on signal convergence
- **ROI Quick Wins** — Economic impact analysis for data-driven resource allocation
- **Heatmap Intelligence** — Geographic visualization of district-level risk and activity

### For Citizens (Transparency Mode)
- **Open Data Portal** — Browse all datasets powering the platform with download links
- **Community Insights** — Understand neighborhood safety, service quality, and economic health
- **Plain Language AI** — Ask questions about your city in everyday language
- **District Comparisons** — See how your district compares across key metrics

### Technical Capabilities
- **Multi-file CSV ingestion** with auto-detection, chunked parsing, and deduplication
- **RAG pipeline** with pgvector similarity search for context-grounded AI responses
- **Streaming SSE responses** for real-time AI briefing experience
- **Role-based UI** that adapts terminology, KPIs, and layout per user mode
- **Responsive design** optimized for desktop, tablet, and mobile

---

## 🛠️ Tech Stack & Sponsored Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite | SPA with code splitting & lazy loading |
| **Styling** | Tailwind CSS, shadcn/ui | Design system with dark/light modes |
| **Charts** | Recharts | Data visualization & trend analysis |
| **Animation** | Framer Motion | Smooth transitions & micro-interactions |
| **State** | React Query (TanStack) | Server state with 5-min cache |
| **Backend** | **Supabase** (PostgreSQL) | Database, auth, edge functions, storage |
| **Vector DB** | **Supabase pgvector** | Embedding storage & similarity search |
| **AI Reasoning** | **Google Gemini Flash** | Streaming intelligence briefings |
| **Embeddings** | OpenAI text-embedding-3-small | Document vectorization for RAG |
| **Edge Runtime** | Deno (Supabase Functions) | Serverless compute for all backend logic |


---

## 🔄 Data Pipeline

### Datasets
| Dataset | Records | Source | Key Metrics |
|---------|---------|--------|-------------|
| **311 Service Requests** | 5,000+ | City of Montgomery | Categories, resolution time, priority, district |
| **911 Emergency Calls** | Monthly aggregates | City of Montgomery | Call volume, response time, priority levels |
| **Business Licenses** | 3,000+ | City of Montgomery | License type, status, sector, district |

### Ingestion Process
1. **Upload** — Multi-file CSV selection with drag-and-drop
2. **Detect** — Automatic dataset type detection from column headers
3. **Parse** — Chunked processing (500 rows/batch) to prevent UI blocking
4. **Normalize** — Status, priority, and field standardization
5. **Upsert** — Deduplication on natural keys (case_id, license_number)
6. **Catalog** — Audit logging with completion rates and error tracking

### Intelligence Pipeline
1. **Score** — `compute-scores` aggregates per-district signals across all datasets
2. **Embed** — `generate-embeddings` creates vector representations of data summaries
3. **Search** — `match_documents` performs cosine similarity search on user queries
4. **Reason** — Google Gemini Flash generates contextual insights from retrieved documents
5. **Recommend** — Signal convergence analysis produces prioritized action items

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd city-pulse-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
The app connects to a Supabase backend. Required environment variables:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

---

## 📁 Project Structure

```
src/
├── pages/                  # 9 route pages
│   ├── OverviewPage.tsx    # Executive dashboard with KPIs
│   ├── BriefingPage.tsx    # AI Q&A with RAG
│   ├── SafetyPage.tsx      # 911 emergency analytics
│   ├── InfrastructurePage  # 311 service request tracking
│   ├── EconomicPage.tsx    # Business license analytics
│   ├── MapPage.tsx         # District heatmap visualization
│   ├── RecommendationsPage # AI action recommendations
│   ├── TransparencyPage    # Open data portal
│   └── ROIPage.tsx         # Economic ROI analysis
├── components/             # 25+ reusable components
│   ├── ui/                 # shadcn/ui base components
│   ├── BriefingPanel.tsx   # Streaming AI chat interface
│   ├── CityHeatmap.tsx     # District risk visualization
│   ├── *Chart.tsx          # Data visualization components
│   └── *Card.tsx           # Data display cards
├── hooks/                  # Custom React hooks
│   └── useDistrictData.ts  # 5+ data fetching hooks
├── services/               # Data service layer
│   ├── districtService.ts
│   ├── emergencyCallService.ts
│   ├── businessLicenseService.ts
│   └── serviceRequestService.ts
└── lib/                    # Utilities
    ├── modeContext.tsx      # Leadership/Citizen toggle
    └── mockData.ts         # Fallback data

supabase/functions/
├── ingest-dataset/         # CSV parsing & database upsert
├── compute-scores/         # District scoring algorithm
├── generate-embeddings/    # Vector embedding creation
└── ai-briefing/            # RAG + Gemini streaming responses
```

---

## 💰 Commercial Potential

### Business Model
- **B2G SaaS** — Monthly subscription for municipal governments ($5K-50K/mo based on city size)
- **Citizen Portal License** — White-label transparency module for civic engagement
- **Data Integration Services** — Custom dataset onboarding and pipeline configuration

### Market Opportunity
- 19,000+ municipalities in the US alone
- Growing mandates for open data and civic transparency
- $15B+ municipal technology market

### Scalability Path
1. **Montgomery pilot** → Prove value with real city data
2. **Alabama expansion** → Replicate across state municipalities
3. **National platform** → Multi-city SaaS with shared intelligence
4. **International** → Adapt for global municipal governance

---

## 📄 License

Built for the GenAI Works Hackathon 2026.

---

## 👥 Team

**Team-theGump**

| Member | Role |
|--------|------|
| Larry Salinas | Developer |
| Kathiravan Kamatchi | Developer |

Built for GenAI Works Hackathon 2026 — Montgomery, AL
