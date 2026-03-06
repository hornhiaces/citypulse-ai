import { useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BriefingPanel, type BriefingPanelHandle } from '@/components/BriefingPanel';
import { useMode } from '@/lib/modeContext';
import { sampleBriefingQuestions } from '@/lib/mockData';

export default function BriefingPage() {
  const { isLeadership } = useMode();
  const briefingRef = useRef<BriefingPanelHandle>(null);

  return (
    <>
      <PageHeader
        title={isLeadership ? 'AI Executive Briefing' : 'Ask About Montgomery'}
        subtitle={isLeadership ? 'RAG-powered intelligence analysis using Montgomery municipal datasets' : 'Get answers about your city using real municipal data'}
        badge="AI-Powered"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <BriefingPanel ref={briefingRef} />
        </div>
        <div className="space-y-3">
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3">Suggested Questions</h3>
            <div className="space-y-2">
              {(isLeadership ? sampleBriefingQuestions.leadership : sampleBriefingQuestions.citizen).map((q) => (
                <button
                  key={q}
                  onClick={() => briefingRef.current?.sendMessage(q)}
                  className="w-full text-left text-[11px] text-muted-foreground p-2 rounded-md bg-secondary/30 border border-border/30 cursor-pointer hover:border-primary/30 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-foreground mb-2">Data Sources</h3>
            <div className="space-y-1.5">
              {['311 Service Requests', '911 Emergency Calls', 'Business Licenses', 'District Intelligence Scores'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
