import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ClipboardList, Phone, Clock, CheckCircle2, Building2, AlertTriangle, ThumbsUp } from 'lucide-react';
import type { KpiData } from '@/lib/mockData';

const iconMap: Record<string, React.ElementType> = {
  clipboard: ClipboardList,
  phone: Phone,
  clock: Clock,
  check: CheckCircle2,
  building: Building2,
  alert: AlertTriangle,
  'thumbs-up': ThumbsUp,
};

export function KpiCard({ data, index }: { data: KpiData; index: number }) {
  const Icon = iconMap[data.icon] || ClipboardList;
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const downIsGood = data.label.includes('Response') || data.label.includes('Time') || data.label.includes('Processing');
  const upIsBad = data.label.includes('Active 311') || data.label.includes('Open') || data.label.includes('Incidents');
  const trendPositive = (data.trend === 'down' && downIsGood) || (data.trend === 'up' && !upIsBad);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass-card p-5 group hover:glow-border transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {data.change !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-mono ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(data.change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{data.value}</p>
      <p className="text-xs text-muted-foreground mt-1">{data.label}</p>
    </motion.div>
  );
}
