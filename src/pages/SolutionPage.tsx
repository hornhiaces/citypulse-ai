import { motion } from 'framer-motion';

export default function SolutionPage() {
  return (
    <div className="max-w-4xl mx-auto print:max-w-none print:p-0">
      {/* Print-friendly 1-page solution description */}
      <div className="bg-card border border-border rounded-2xl p-8 print:border-none print:shadow-none print:rounded-none space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">City Pulse AI</h1>
          <p className="text-base text-muted-foreground mt-1">AI-Powered Municipal Intelligence Platform — Montgomery, AL</p>
          <p className="text-xs text-muted-foreground mt-1">GenAI Works Hackathon 2026 · <strong className="text-foreground">Team-theGump:</strong> Larry Salinas · Kathiravan Kamatchi</p>
        </motion.div>

        {/* Problem */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-1">🎯 Problem</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cities generate massive volumes of operational data — 311 service requests, 911 emergency calls, business licenses — but this data sits in silos. City leaders lack real-time intelligence to allocate resources effectively, and citizens have no window into how their city operates. Decisions are made on intuition rather than evidence.
          </p>
        </section>

        {/* Solution */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-1">💡 Solution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            City Pulse AI is a <strong className="text-foreground">production-ready civic intelligence platform</strong> that ingests real municipal datasets, analyzes them through a district scoring engine, and surfaces AI-powered insights via dual-mode dashboards — Executive Intelligence for city leaders and Public Transparency for citizens. Our RAG-powered AI briefing engine, built on <strong className="text-foreground">Google Gemini</strong> with <strong className="text-foreground">Supabase pgvector</strong>, lets users ask natural language questions and receive streaming, data-grounded responses.
          </p>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-2">⚙️ How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-1">1. Data Ingestion</h3>
              <p className="text-xs text-muted-foreground">Multi-file CSV upload with auto-detection, chunked parsing (500 rows/batch), deduplication, and audit logging across 311, 911, and business license datasets.</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-1">2. Intelligence Engine</h3>
              <p className="text-xs text-muted-foreground">District scoring across 5 dimensions (safety, emergency, economic, infrastructure, engagement). Vector embeddings enable RAG-powered AI briefings.</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-1">3. Dual Dashboards</h3>
              <p className="text-xs text-muted-foreground">9 specialized pages with real-time KPIs, heatmaps, trend charts, AI recommendations, and a citizen transparency portal with open data access.</p>
            </div>
          </div>
        </section>

        {/* Key Features & Impact */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">✨ Key Features</h2>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• <strong className="text-foreground">AI Briefing Engine</strong> — RAG + Gemini streaming responses</li>
              <li>• <strong className="text-foreground">District Risk Scoring</strong> — 5-dimensional analytics per district</li>
              <li>• <strong className="text-foreground">Interactive Heatmap</strong> — Geographic risk visualization</li>
              <li>• <strong className="text-foreground">Smart Recommendations</strong> — AI-prioritized action items</li>
              <li>• <strong className="text-foreground">Dual-Mode UI</strong> — Leadership intelligence + citizen transparency</li>
              <li>• <strong className="text-foreground">Auto-Detect Ingestion</strong> — Intelligent CSV pipeline</li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">📊 Impact & Commercialization</h2>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Faster resource allocation via data-driven scoring</li>
              <li>• Increased civic trust through radical transparency</li>
              <li>• Reduced emergency response gaps via early warning</li>
              <li>• <strong className="text-foreground">B2G SaaS model:</strong> $5K–50K/month per municipality</li>
              <li>• <strong className="text-foreground">19,000+</strong> US municipalities as target market</li>
              <li>• Scale: Montgomery → Alabama → National → Global</li>
            </ul>
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-2">🛠️ Technology</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">Supabase (PostgreSQL + Edge Functions + pgvector)</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">Google Gemini Flash (AI Reasoning)</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">React 18 + TypeScript</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">Tailwind CSS + shadcn/ui</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">Recharts + Framer Motion</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">OpenAI Embeddings</span>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Live Demo:</strong> <a href="https://city-pulse-aip.lovable.app" target="_blank" rel="noopener noreferrer" className="hover:underline">city-pulse-aip.lovable.app</a> · 
            <strong className="text-foreground ml-2">GitHub:</strong> <a href="https://github.com/hornhiaces/citypulse-ai" target="_blank" rel="noopener noreferrer" className="hover:underline">https://github.com/hornhiaces/citypulse-ai</a> ·
            <strong className="text-foreground ml-2">Pitch Video:</strong> <a href="https://www.loom.com/share/4460cfc186dd440381df0b60f09af0db" target="_blank" rel="noopener noreferrer" className="hover:underline">https://www.loom.com/share/4460cfc186dd440381df0b60f09af0db</a>
          </p>
        </div>
      </div>

      {/* Print button */}
      <div className="mt-4 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
