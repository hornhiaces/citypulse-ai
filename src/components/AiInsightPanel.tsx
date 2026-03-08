import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMode } from '@/lib/modeContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const INSIGHT_PROMPT = `You are a municipal intelligence analyst. Based on the data you have access to, provide a concise "Key Insights This Week" summary for Montgomery, AL. Format as 4-6 bullet points using • characters. Each bullet should be a specific, data-driven observation about 311 service requests, 911 emergency calls, business licenses, or district conditions. Be specific with percentages and district numbers when possible. Do NOT use markdown headers or bold text. Just return the bullet points, one per line.`;

export function AiInsightPanel() {
  const { mode } = useMode();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Insight Summary</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { hasFetched.current = false; fetchInsights(); }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !content && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {content && (
            <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-3 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Generated by Gemini + RAG
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
