# 🎤 City Pulse AI — Slide Deck Outline (8 Slides)

Use this outline to build slides in Google Slides, Canva, or Keynote.

---

## Slide 1: Title
**City Pulse AI**
*AI-Powered Municipal Intelligence for Smarter Cities*
- Montgomery, AL — GenAI Works Hackathon 2026
- **Team-theGump:** Larry Salinas · Kathiravan Kamatchi
- Live: city-pulse-aip.lovable.app

---

## Slide 2: The Problem
**Cities Are Data-Rich but Insight-Poor**
- 311 requests, 911 calls, business licenses → siloed spreadsheets
- Leaders lack real-time visibility into district conditions
- Citizens have zero transparency into city operations
- Resource allocation relies on intuition, not intelligence

*Visual: Icons showing disconnected data sources → question mark*

---

## Slide 3: Our Solution
**City Pulse AI — A Dual-Mode Intelligence Platform**
- **Ingests** real municipal datasets (311, 911, business licenses)
- **Analyzes** via district scoring engine (5 risk dimensions)
- **Generates** AI insights with RAG + Google Gemini
- **Presents** dual dashboards: Executive Intelligence + Public Transparency

*Visual: Screenshot of Overview dashboard*

---

## Slide 4: How Data Flows
**From Raw CSV to AI Intelligence**
```
CSV Upload → Auto-Detect → Chunk Parse → Normalize → Upsert
     ↓
District Scoring → Signal Aggregation → Heatmap
     ↓
Vector Embeddings → pgvector → RAG Pipeline → AI Briefing
```
- Auto-detection of dataset type from headers
- 500-row chunked processing with deduplication
- Audit logging with completion tracking

*Visual: Data pipeline diagram*

---

## Slide 5: Key Features
**Intelligence for Leaders, Transparency for Citizens**

| Leadership Mode | Citizen Mode |
|----------------|-------------|
| District risk scores | Neighborhood insights |
| AI strategic briefing | Plain language Q&A |
| ROI analysis | Open data portal |
| Action recommendations | Community metrics |

- Real-time KPIs across all datasets
- Interactive heatmap with district-level drill-down
- Streaming AI responses grounded in real data

*Visual: Side-by-side screenshots of both modes*

---

## Slide 6: Technology & Sponsored Tech
**Built on Production-Grade Infrastructure**

| Component | Technology |
|-----------|-----------|
| Frontend | React + TypeScript + Vite |
| **🏆 Backend** | **Supabase** (PostgreSQL + Edge Functions) |
| **🏆 Vector DB** | **Supabase pgvector** |
| **🏆 AI** | **Google Gemini Flash** (streaming reasoning) |
| Embeddings | OpenAI text-embedding-3-small |
| Visualization | Recharts + Framer Motion |

- 4 Edge Functions: ingest, score, embed, brief
- 10+ database views for analytics
- RAG pipeline with cosine similarity search

---

## Slide 7: Impact & Commercialization
**From Hackathon to Market**

**Impact:**
- Faster resource allocation through data-driven district scoring
- Increased civic trust through radical transparency
- Reduced response times via early warning signals

**Business Model:**
- B2G SaaS: $5K–50K/month per municipality
- 19,000+ US municipalities = massive TAM
- White-label citizen portal licensing

**Scale Path:**
Montgomery → Alabama → National → International

---

## Slide 8: Demo & Call to Action
**See It Live**

🔗 **city-pulse-aip.lovable.app**

Try it yourself:
1. Toggle between Leadership and Citizen modes
2. Ask the AI: "What districts need the most attention?"
3. Explore the district heatmap
4. Review AI-generated recommendations

*"Every city deserves to think smarter. Every citizen deserves to see how."*

**Team-theGump** — Larry Salinas · Kathiravan Kamatchi
