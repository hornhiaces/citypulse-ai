import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/lib/modeContext';

interface ForecastItem {
  label: string;
  dataType: '911' | '311';
  currentAvg: number;
  forecastAvg: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

function highlightContent(text: string) {
  const parts = text.split(/(\d+%|District \d+|spike|increase|decrease|decline|rise|drop|surge|critical|high|growing|stable)/gi);
  return parts.map((part, i) => {
    if (/\d+%/.test(part)) return <mark key={i} className="bg-primary/15 text-primary rounded px-0.5">{part}</mark>;
    if (/District \d+/i.test(part)) return <mark key={i} className="bg-accent/20 text-accent-foreground rounded px-0.5">{part}</mark>;
    if (/spike|increase|rise|surge|growing|critical|high/i.test(part)) return <mark key={i} className="bg-destructive/15 text-destructive rounded px-0.5">{part}</mark>;
    if (/decrease|decline|drop|stable/i.test(part)) return <mark key={i} className="bg-emerald-500/15 text-emerald-400 rounded px-0.5">{part}</mark>;
    return part;
  });
}

export function ForecastSummarySection() {
  const { isLeadership } = useMode();
  const [expanded, setExpanded] = useState(false);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    computeForecasts();
  }, []);

  async function computeForecasts() {
    setLoading(true);
    try {
      // Fetch 911 data
      const { data: calls911 } = await supabase
        .from('calls_911_monthly')
        .select('month, call_count, year')
        .order('year')
        .order('month');

      // Fetch 311 data
      const { data: requests311 } = await supabase
        .from('service_requests_311')
        .select('created_date, category');

      const items: ForecastItem[] = [];

      // 911 forecast
      if (calls911?.length) {
        const monthlyTotals: Record<string, number> = {};
        calls911.forEach(c => {
          monthlyTotals[c.month] = (monthlyTotals[c.month] || 0) + (c.call_count || 0);
        });
        const vals = Object.values(monthlyTotals);
        const last3 = vals.slice(-3);
        const avg = last3.reduce((a, b) => a + b, 0) / last3.length;
        const slope = last3.length >= 2 ? (last3[last3.length - 1] - last3[0]) / (last3.length - 1) : 0;
        const forecastVal = Math.round(avg + slope * 2);
        const current = last3[last3.length - 1] || 0;
        const pct = current > 0 ? Math.round(((forecastVal - current) / current) * 100) : 0;
        items.push({
          label: '911 Emergency Calls',
          dataType: '911',
          currentAvg: Math.round(current),
          forecastAvg: forecastVal,
          changePercent: pct,
          direction: pct > 2 ? 'up' : pct < -2 ? 'down' : 'stable',
        });
      }

      // 311 forecast by month
      if (requests311?.length) {
        const monthCounts: Record<number, number> = {};
        requests311.forEach(r => {
          const m = new Date(r.created_date).getMonth();
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        });
        const vals = Object.values(monthCounts);
        const last3 = vals.slice(-3);
        const avg = last3.reduce((a, b) => a + b, 0) / (last3.length || 1);
        const slope = last3.length >= 2 ? (last3[last3.length - 1] - last3[0]) / (last3.length - 1) : 0;
        const forecastVal = Math.round(avg + slope * 2);
        const current = last3[last3.length - 1] || 0;
        const pct = current > 0 ? Math.round(((forecastVal - current) / current) * 100) : 0;
        items.push({
          label: '311 Service Requests',
          dataType: '311',
          currentAvg: Math.round(current),
          forecastAvg: forecastVal,
          changePercent: pct,
          direction: pct > 2 ? 'up' : pct < -2 ? 'down' : 'stable',
        });
      }

      setForecasts(items);

      // Get AI explanation
      const prompt = `Based on Montgomery AL municipal data: 911 calls trending ${items[0]?.direction || 'stable'} (${items[0]?.changePercent || 0}% change), 311 requests trending ${items[1]?.direction || 'stable'} (${items[1]?.changePercent || 0}% change). Provide a 3-4 sentence predictive summary for ${isLeadership ? 'city leadership' : 'citizens'} about what to expect in the coming months. Be specific about districts and categories where possible.`;

      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-briefing', {
        body: { messages: [{ role: 'user', content: prompt }], mode: isLeadership ? 'leadership' : 'citizen' },
      });

      if (fnError) throw fnError;

      if (fnData instanceof ReadableStream) {
        const reader = fnData.getReader();
        const decoder = new TextDecoder();
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                text += json.choices?.[0]?.delta?.content || '';
              } catch {}
            }
          }
        }
        setAiSummary(text);
      }
    } catch (e) {
      console.error('Forecast error:', e);
      setAiSummary('Forecast analysis is currently being computed. Check back shortly for AI-powered predictions.');
    } finally {
      setLoading(false);
    }
  }

  const DirectionIcon = ({ dir }: { dir: string }) => {
    if (dir === 'up') return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (dir === 'down') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const briefSummary = aiSummary.split('. ').slice(0, 2).join('. ') + (aiSummary.includes('. ') ? '.' : '');

  return (
    <>
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <CardTitle className="text-base font-semibold text-foreground">
              {isLeadership ? 'Predictive Intelligence' : 'City Forecast'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { fetched.current = false; computeForecasts(); }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(true)}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {forecasts.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border/50 bg-background/50 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                  <DirectionIcon dir={f.direction} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">{f.forecastAvg.toLocaleString()}</span>
                  <span className={`text-xs font-medium ${f.direction === 'up' ? 'text-destructive' : f.direction === 'down' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {f.changePercent > 0 ? '+' : ''}{f.changePercent}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Current avg: {f.currentAvg.toLocaleString()} → Projected: {f.forecastAvg.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>

          {!loading && aiSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2"
            >
              {highlightContent(briefSummary)}
            </motion.div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Computing forecast…
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              {isLeadership ? 'Predictive Intelligence — Full Report' : 'City Forecast — Detailed View'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {forecasts.map(f => (
              <div key={f.label} className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                  <DirectionIcon dir={f.direction} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-foreground">{f.forecastAvg.toLocaleString()}</span>
                  <span className={`text-sm font-semibold ${f.direction === 'up' ? 'text-destructive' : f.direction === 'down' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {f.changePercent > 0 ? '+' : ''}{f.changePercent}% projected
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {f.currentAvg.toLocaleString()}/month</span>
                  <span>Forecast: {f.forecastAvg.toLocaleString()}/month</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">AI Analysis</h4>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {highlightContent(aiSummary)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
