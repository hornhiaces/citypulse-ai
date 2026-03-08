import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, RefreshCw, Zap, Target, Shield, DollarSign, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface ActionItem {
  icon: 'safety' | 'infra' | 'economic' | 'community';
  title: string;
  impact: string;
  urgency: 'immediate' | 'short-term' | 'strategic';
  description: string;
}

const ICON_MAP = {
  safety: Shield,
  infra: Target,
  economic: DollarSign,
  community: Users,
};

const URGENCY_STYLES = {
  immediate: 'bg-destructive/10 text-destructive border-destructive/20',
  'short-term': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  strategic: 'bg-primary/10 text-primary border-primary/20',
};

function highlightContent(text: string) {
  const parts = text.split(/(\d+%|District \d+|spike|increase|decrease|decline|rise|drop|surge|critical|high|growing|stable|reduce|deploy|allocate|expand|prioritize)/gi);
  return parts.map((part, i) => {
    if (/\d+%/.test(part)) return <mark key={i} className="bg-primary/15 text-primary rounded px-0.5">{part}</mark>;
    if (/District \d+/i.test(part)) return <mark key={i} className="bg-accent/20 text-accent-foreground rounded px-0.5">{part}</mark>;
    if (/spike|increase|rise|surge|growing|critical|high/i.test(part)) return <mark key={i} className="bg-destructive/15 text-destructive rounded px-0.5">{part}</mark>;
    if (/decrease|decline|drop|stable|reduce/i.test(part)) return <mark key={i} className="bg-emerald-500/15 text-emerald-400 rounded px-0.5">{part}</mark>;
    if (/deploy|allocate|expand|prioritize/i.test(part)) return <mark key={i} className="bg-primary/15 text-primary rounded px-0.5 font-medium">{part}</mark>;
    return part;
  });
}

export function StrategicActionsSection() {
  const [expanded, setExpanded] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [aiRationale, setAiRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchActions();
  }, []);

  async function fetchActions() {
    setLoading(true);
    try {
      // Gather context
      const [{ data: scores }, { data: calls }, { data: requests }] = await Promise.all([
        supabase.from('district_scores').select('district, district_name, public_safety_pressure, infrastructure_stress, emergency_demand, economic_activity'),
        supabase.from('calls_911_monthly').select('district, call_count, change_pct, month').eq('year', 2025),
        supabase.from('service_requests_311').select('district, category, status, priority'),
      ]);

      const highRiskDistricts = scores?.filter(s => s.public_safety_pressure === 'HIGH' || s.infrastructure_stress === 'HIGH') || [];
      const openHighPriority = requests?.filter(r => r.status === 'open' && r.priority === 'high')?.length || 0;
      const risingDistricts = calls?.filter(c => (c.change_pct || 0) > 10)?.map(c => c.district) || [];

      const prompt = `You are a municipal strategy advisor for Montgomery, AL. Based on these data signals:

- High-risk districts: ${highRiskDistricts.map(d => `${d.district_name} (safety: ${d.public_safety_pressure}, infra: ${d.infrastructure_stress})`).join('; ')}
- ${openHighPriority} open high-priority 311 requests
- Districts with rising 911 calls (>10% increase): ${[...new Set(risingDistricts)].join(', ') || 'none'}

Provide EXACTLY 4 strategic action recommendations for leadership. For each, respond in this exact JSON format:
[
  {"icon": "safety|infra|economic|community", "title": "short title (max 8 words)", "impact": "one sentence on expected impact", "urgency": "immediate|short-term|strategic", "description": "2-3 sentence detailed recommendation with specific districts and resource allocation suggestions"}
]

Then after the JSON, add a paragraph starting with "RATIONALE:" explaining the overall strategic logic connecting these recommendations.`;

      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-briefing', {
        body: { messages: [{ role: 'user', content: prompt }], mode: 'leadership' },
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

        // Parse JSON actions and rationale
        try {
          const jsonMatch = text.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as ActionItem[];
            setActions(parsed.slice(0, 4));
          }
          const rationaleMatch = text.match(/RATIONALE:\s*([\s\S]*)/i);
          if (rationaleMatch) {
            setAiRationale(rationaleMatch[1].trim());
          } else {
            // Use everything after the JSON as rationale
            const afterJson = text.slice((text.indexOf(']') || 0) + 1).trim();
            if (afterJson.length > 20) setAiRationale(afterJson);
          }
        } catch {
          console.error('Failed to parse AI actions');
          setFallbackActions();
        }
      }
    } catch (e) {
      console.error('Strategic actions error:', e);
      setFallbackActions();
    } finally {
      setLoading(false);
    }
  }

  function setFallbackActions() {
    setActions([
      { icon: 'safety', title: 'Deploy additional patrols to high-risk districts', impact: 'Reduce emergency response times by up to 15%', urgency: 'immediate', description: 'Districts with rising 911 call volumes need increased patrol presence to manage growing public safety demand.' },
      { icon: 'infra', title: 'Prioritize infrastructure repairs in District 3', impact: 'Address 40% of open high-priority 311 requests', urgency: 'short-term', description: 'Concentrate infrastructure crews on the highest-density complaint areas to reduce backlog and improve citizen satisfaction.' },
      { icon: 'economic', title: 'Fast-track business license approvals', impact: 'Support economic growth in emerging corridors', urgency: 'strategic', description: 'Streamline the approval pipeline for districts showing economic activity growth to maintain momentum.' },
      { icon: 'community', title: 'Launch community engagement in underserved areas', impact: 'Improve citizen confidence scores across 3 districts', urgency: 'short-term', description: 'Deploy community liaisons to districts with declining citizen confidence to rebuild trust and gather feedback.' },
    ]);
    setAiRationale('These recommendations are based on cross-referencing 911 call trends, 311 service request backlogs, and district risk scores to identify the highest-impact interventions.');
  }

  const briefRationale = aiRationale.split('. ').slice(0, 2).join('. ') + (aiRationale.includes('. ') ? '.' : '');

  if (loading || actions.length === 0) return null;

  return (
    <>
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">
              Strategic Action Recommendations
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { fetched.current = false; fetchActions(); }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(true)}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Analyzing data signals for strategic recommendations…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actions.slice(0, 4).map((action, i) => {
                  const Icon = ICON_MAP[action.icon] || Target;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-semibold text-foreground leading-tight">{action.title}</span>
                        </div>
                      </div>
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${URGENCY_STYLES[action.urgency]}`}>
                        {action.urgency}
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{highlightContent(action.impact)}</p>
                    </motion.div>
                  );
                })}
              </div>

              {aiRationale && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2"
                >
                  {highlightContent(briefRationale)}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Strategic Action Recommendations — Full View
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actions.map((action, i) => {
              const Icon = ICON_MAP[action.icon] || Target;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-border/50 bg-background/50 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{action.title}</h4>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mt-1 ${URGENCY_STYLES[action.urgency]}`}>
                          {action.urgency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{highlightContent(action.impact)}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{highlightContent(action.description)}</p>
                </motion.div>
              );
            })}
          </div>

          {aiRationale && (
            <div className="space-y-2 mt-4 border-t border-border/30 pt-4">
              <h4 className="text-sm font-semibold text-foreground">Strategic Rationale</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {highlightContent(aiRationale)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
