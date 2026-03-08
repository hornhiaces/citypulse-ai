import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMode } from '@/lib/modeContext';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const INSIGHT_PROMPT = `You are a municipal intelligence analyst. Based on the data you have access to, provide a concise "Key Insights This Week" summary for Montgomery, AL. Format as 4-6 bullet points using • characters. Each bullet should be a specific, data-driven observation about 311 service requests, 911 emergency calls, business licenses, or district conditions. Be specific with percentages and district numbers when possible. Do NOT use markdown headers or bold text. Just return the bullet points, one per line.`;

function highlightContent(text: string): React.ReactNode[] {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    // Highlight percentages, district references, numbers with context
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

export function AiInsightPanel() {
  const { mode } = useMode();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const hasFetched = useRef(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setContent('');

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-briefing`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: INSIGHT_PROMPT }],
          mode,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { setError('Rate limited — try again shortly.'); setLoading(false); return; }
        if (resp.status === 402) { setError('AI credits exhausted.'); setLoading(false); return; }
        setError('Failed to generate insights.'); setLoading(false); return;
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
              setContent(accumulated);
            }
          } catch { /* partial */ }
        }
      }
      setLoading(false);
    } catch (e) {
      console.error('AI insight error:', e);
      setError('Could not reach AI service.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchInsights();
    }
  }, []);

  // Show only first 3 bullet points in compact view
  const briefContent = content
    ? content.split('\n').filter(l => l.trim()).slice(0, 3).join('\n')
    : '';

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Insight Summary</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { hasFetched.current = false; fetchInsights(); }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(true)}
                disabled={!content}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !content && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {briefContent && (
              <div className="space-y-1.5">
                {highlightContent(briefContent)}
                {content.split('\n').filter(l => l.trim()).length > 3 && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-[11px] text-primary hover:underline cursor-pointer mt-1"
                  >
                    +{content.split('\n').filter(l => l.trim()).length - 3} more insights
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 mt-3 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Generated by Gemini + RAG
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insight Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {content && highlightContent(content)}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-4 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Generated by Gemini + RAG
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
