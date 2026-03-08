import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, ArrowRight, Loader2, Maximize2 } from 'lucide-react';
import { useMode } from '@/lib/modeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const exampleQuestions = {
  citizen: [
    'Why are there so many pothole complaints downtown?',
    'What neighborhoods have the most 311 complaints?',
    'How fast does the city respond to service requests?',
  ],
  leadership: [
    'Where is business growth happening?',
    'Which areas have the highest 911 call frequency?',
    'What districts need the most infrastructure investment?',
  ],
};

function highlightContent(text: string): React.ReactNode[] {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    const highlighted = line.replace(
      /(\d+\.?\d*%|\b(?:District|district)\s*\d+|↑|↓|HIGH|RISING|CRITICAL|increase|decrease|spike|drop|growth|decline)/gi,
      '<mark>$1</mark>'
    );
    return (
      <p
        key={i}
        className="text-sm text-muted-foreground leading-relaxed [&_mark]:bg-primary/15 [&_mark]:text-primary [&_mark]:font-medium [&_mark]:rounded [&_mark]:px-0.5"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  });
}

export function AskYourCity() {
  const { mode, isLeadership } = useMode();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAsked, setHasAsked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuery(question);
    setAnswer('');
    setError(null);
    setLoading(true);
    setHasAsked(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-briefing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: question }],
            mode,
          }),
          signal: controller.signal,
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) { setError('Rate limited — try again shortly.'); setLoading(false); return; }
        if (resp.status === 402) { setError('AI credits exhausted.'); setLoading(false); return; }
        setError('Failed to get answer.'); setLoading(false); return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { setError('No stream available.'); setLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setAnswer(accumulated);
            }
          } catch { /* partial */ }
        }
      }
      setLoading(false);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Ask Your City error:', e);
      setError('Could not reach AI service.');
      setLoading(false);
    }
  };

  const questions = isLeadership ? exampleQuestions.leadership : exampleQuestions.citizen;

  // Truncate answer to ~3 lines for compact view
  const briefAnswer = answer
    ? answer.split('\n').filter(l => l.trim()).slice(0, 3).join('\n')
    : '';
  const hasMore = answer ? answer.split('\n').filter(l => l.trim()).length > 3 : false;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden h-full">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ask Your City</h3>
                  <p className="text-[11px] text-muted-foreground">AI-powered civic intelligence</p>
                </div>
              </div>
              {hasAsked && answer && !loading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask(query)}
                placeholder="What do you want to know about Montgomery?"
                className="w-full h-10 pl-9 pr-12 rounded-lg border border-border/50 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:bg-primary/10"
                onClick={() => ask(query)}
                disabled={loading || !query.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            {/* Example questions */}
            <AnimatePresence mode="wait">
              {!hasAsked && (
                <motion.div
                  key="examples"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Try asking</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map(q => (
                      <button
                        key={q}
                        onClick={() => { setQuery(q); ask(q); }}
                        className="text-[11px] text-muted-foreground px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border/30 hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Brief Answer */}
            <AnimatePresence mode="wait">
              {hasAsked && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {briefAnswer && (
                    <div className="space-y-1.5">
                      {highlightContent(briefAnswer)}
                      {hasMore && (
                        <button
                          onClick={() => setExpanded(true)}
                          className="text-[11px] text-primary hover:underline cursor-pointer mt-1"
                        >
                          View full answer →
                        </button>
                      )}
                    </div>
                  )}
                  {loading && !answer && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Analyzing city data…</span>
                    </div>
                  )}
                  {!loading && answer && (
                    <button
                      onClick={() => { setHasAsked(false); setAnswer(''); setQuery(''); }}
                      className="mt-2 text-[11px] text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                    >
                      Ask another question
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[9px] text-muted-foreground/40 mt-3 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Powered by RAG + Gemini · Real municipal data
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expanded Dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Your City
            </DialogTitle>
          </DialogHeader>
          {query && (
            <p className="text-sm font-medium text-foreground bg-secondary/30 rounded-lg px-3 py-2 border border-border/30">
              {query}
            </p>
          )}
          <div className="space-y-2 mt-2">
            {answer && highlightContent(answer)}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-4 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Powered by RAG + Gemini
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
