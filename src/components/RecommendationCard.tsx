import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Recommendation } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';

const priorityConfig = {
  critical: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  high: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  medium: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

export function RecommendationCard({ data, index }: { data: Recommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { isLeadership } = useMode();
  const config = priorityConfig[data.priority];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`glass-card p-5 border ${config.border} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono uppercase ${config.color}`}>{data.priority}</span>
            <span className="text-xs text-muted-foreground">· {data.category}</span>
            {isLeadership && (
              <span className="text-xs font-mono text-muted-foreground ml-auto">{Math.round(data.confidence * 100)}% confidence</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground">{data.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-border/50"
            >
              <p className="text-xs font-semibold text-muted-foreground mb-2">Supporting Signals</p>
              <ul className="space-y-1">
                {data.signals.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                {data.districts.map(d => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    District {d}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
    </motion.div>
  );
}
