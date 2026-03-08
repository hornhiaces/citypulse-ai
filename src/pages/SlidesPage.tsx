import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const SLIDES = [
  // Slide 1: Title
  {
    bg: 'bg-gradient-to-br from-primary/20 via-background to-accent/10',
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
          <span className="text-4xl">🏙️</span>
        </div>
        <h1 className="text-5xl font-bold text-foreground tracking-tight mb-3">City Pulse AI</h1>
        <p className="text-xl text-muted-foreground mb-6">AI-Powered Municipal Intelligence Platform</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">Montgomery, AL</span>
          <span>•</span>
          <span>GenAI Works Hackathon 2026</span>
        </div>
        <p className="mt-4 text-sm text-foreground font-medium">Team-theGump</p>
        <p className="text-xs text-muted-foreground">Larry Salinas · Kathiravan Kamatchi</p>
        <p className="mt-8 text-xs text-muted-foreground">city-pulse-aip.lovable.app</p>
      </div>
    ),
  },
  // Slide 2: Problem
  {
    bg: 'bg-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">The Problem</h2>
        <div className="space-y-5">
          {[
            { emoji: '📊', text: 'Cities generate thousands of data points daily — 311 requests, 911 calls, business licenses — but data sits in silos' },
            { emoji: '🔍', text: 'City leaders lack real-time visibility into district conditions and resource needs' },
            { emoji: '🚫', text: 'Citizens have zero transparency into how their city actually operates' },
            { emoji: '🎯', text: 'Resource allocation relies on intuition rather than data-driven intelligence' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="text-2xl shrink-0">{item.emoji}</span>
              <p className="text-lg text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // Slide 3: Solution
  {
    bg: 'bg-gradient-to-br from-primary/5 via-background to-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">Our Solution</h2>
        <p className="text-lg text-muted-foreground mb-8">A dual-mode intelligence platform serving leaders AND citizens</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: 'Ingest', desc: 'Auto-detect & parse 311, 911, and business license CSVs with chunked processing', icon: '📥' },
            { title: 'Analyze', desc: 'District scoring engine — 5 risk dimensions computed from real data', icon: '🧠' },
            { title: 'Generate', desc: 'RAG pipeline with Google Gemini — streaming AI insights grounded in data', icon: '⚡' },
            { title: 'Present', desc: 'Dual dashboards: Executive Intelligence + Public Transparency', icon: '📱' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="text-lg font-semibold text-foreground mt-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // Slide 4: Data Pipeline
  {
    bg: 'bg-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">How Data Flows</h2>
        <div className="space-y-3">
          {[
            { step: '1', label: 'CSV Upload', detail: 'Multi-file selection with auto-detection from column headers', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { step: '2', label: 'Chunk & Normalize', detail: '500-row batches → status/priority standardization → upsert with deduplication', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
            { step: '3', label: 'District Scoring', detail: '5 dimensions: safety, emergency, economic, infrastructure, engagement', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            { step: '4', label: 'Vector Embeddings', detail: 'OpenAI embeddings → Supabase pgvector for similarity search', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
            { step: '5', label: 'AI Briefing', detail: 'Query → embed → vector search → context + Gemini → streaming response', color: 'bg-primary/20 text-primary border-primary/30' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className={`shrink-0 w-10 h-10 rounded-full ${item.color} border flex items-center justify-center font-bold text-sm`}>{item.step}</span>
              <div className="flex-1">
                <span className="text-base font-semibold text-foreground">{item.label}</span>
                <span className="text-sm text-muted-foreground ml-2">— {item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // Slide 5: Key Features
  {
    bg: 'bg-gradient-to-br from-accent/5 via-background to-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-6">Key Features</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <h3 className="text-base font-semibold text-primary mb-3">🏛️ Leadership Mode</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Real-time KPI dashboard</li>
              <li>• District risk scoring (5D)</li>
              <li>• AI strategic briefing (RAG)</li>
              <li>• ROI quick wins analysis</li>
              <li>• Action recommendations</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary mb-3">👥 Citizen Mode</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Neighborhood safety insights</li>
              <li>• Plain language AI Q&A</li>
              <li>• Open data portal + downloads</li>
              <li>• District comparisons</li>
              <li>• Community trend tracking</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 p-4 bg-card border border-border rounded-xl">
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">9 specialized pages</strong> — Overview · AI Briefing · Heatmap · Safety · Infrastructure · Economic · ROI · Recommendations · Transparency</p>
        </div>
      </div>
    ),
  },
  // Slide 6: Tech Stack
  {
    bg: 'bg-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-6">Technology Stack</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">🏆 Sponsored Technologies</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">Supabase</p>
                <p className="text-xs text-muted-foreground">PostgreSQL · Edge Functions · pgvector · Storage · Auth</p>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Google Gemini Flash</p>
                <p className="text-xs text-muted-foreground">AI reasoning · Streaming responses · RAG integration</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'React 18 + TypeScript', desc: 'Frontend SPA with code splitting' },
              { name: 'Tailwind + shadcn/ui', desc: 'Design system with dark/light modes' },
              { name: 'Recharts + Framer Motion', desc: 'Charts and animations' },
              { name: 'React Query', desc: 'Server state with caching' },
              { name: 'Deno Edge Functions', desc: '4 serverless functions' },
              { name: 'OpenAI Embeddings', desc: 'text-embedding-3-small' },
            ].map((t, i) => (
              <div key={i} className="p-3 bg-card border border-border rounded-lg">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  // Slide 7: Impact & Commercial
  {
    bg: 'bg-gradient-to-br from-emerald-500/5 via-background to-background',
    content: (
      <div className="flex flex-col justify-center h-full px-12">
        <h2 className="text-3xl font-bold text-foreground mb-6">Impact & Commercialization</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">📊 Impact</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> Faster resource allocation via data-driven district scoring</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> Increased civic trust through radical transparency</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> Early warning signals reduce emergency response gaps</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span> AI recommendations eliminate analysis paralysis</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">💰 Business Model</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><strong className="text-foreground">B2G SaaS:</strong> $5K–50K/mo per municipality</li>
              <li><strong className="text-foreground">TAM:</strong> 19,000+ US municipalities</li>
              <li><strong className="text-foreground">White-label:</strong> Citizen portal licensing</li>
              <li><strong className="text-foreground">Scale:</strong> Montgomery → AL → National → Global</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  // Slide 8: Demo & CTA
  {
    bg: 'bg-gradient-to-br from-primary/15 via-background to-accent/10',
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-12">
        <h2 className="text-3xl font-bold text-foreground mb-6">See It Live</h2>
        <div className="px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 mb-8">
          <p className="text-xl font-mono text-primary">city-pulse-aip.lovable.app</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8 text-left max-w-lg">
          {[
            'Toggle Leadership ↔ Citizen modes',
            'Ask the AI a question about Montgomery',
            'Explore the district risk heatmap',
            'Review AI-generated recommendations',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
              {item}
            </div>
          ))}
        </div>
        <p className="text-lg text-muted-foreground italic">
          "Every city deserves to think smarter.<br />Every citizen deserves to see how."
        </p>
      </div>
    ),
  },
];

export default function SlidesPage() {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(SLIDES.length - 1, c + 1));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Slide viewer */}
      <div className={`w-full ${fullscreen ? 'fixed inset-0 z-[100] bg-background flex items-center justify-center' : 'aspect-[16/9] max-w-5xl'} rounded-xl overflow-hidden border border-border relative`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className={`absolute inset-0 ${SLIDES[current].bg}`}
          >
            {SLIDES[current].content}
          </motion.div>
        </AnimatePresence>

        {/* Controls overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-10">
          <button onClick={prev} disabled={current === 0} className="p-2 rounded-lg bg-card/80 backdrop-blur border border-border text-foreground disabled:opacity-30 hover:bg-card transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground font-mono bg-card/80 backdrop-blur px-3 py-1.5 rounded-lg border border-border">
            {current + 1} / {SLIDES.length}
          </span>
          <button onClick={next} disabled={current === SLIDES.length - 1} className="p-2 rounded-lg bg-card/80 backdrop-blur border border-border text-foreground disabled:opacity-30 hover:bg-card transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-card/80 backdrop-blur border border-border text-foreground hover:bg-card transition-colors">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 max-w-5xl w-full print:hidden">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`shrink-0 w-20 h-12 rounded-md border-2 transition-all text-xs font-medium ${
              i === current ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
