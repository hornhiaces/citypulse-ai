import { motion } from 'framer-motion';
import { Play, Shield, Wrench, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMode } from '@/lib/modeContext';

const scenarios = [
  {
    id: 'safety-crisis',
    title: 'Safety Hotspot Analysis',
    description: 'Explore districts with high emergency demand and rising safety pressure',
    icon: Shield,
    route: '/safety',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'infra-stress',
    title: 'Infrastructure Stress Review',
    description: 'Identify districts with aging infrastructure and high 311 complaint volume',
    icon: Wrench,
    route: '/infrastructure',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'economic-growth',
    title: 'Economic Growth Zones',
    description: 'Find districts with strong business activity and growth potential',
    icon: TrendingUp,
    route: '/economic',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'citizen-transparency',
    title: 'Citizen Transparency View',
    description: 'Switch to citizen mode and explore the open data dashboard',
    icon: Users,
    route: '/transparency',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

export function DemoScenarios() {
  const navigate = useNavigate();
  const { isLeadership } = useMode();

  if (!isLeadership) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Play className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Demo Scenarios</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Quick-start guided analysis paths for stakeholder presentations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(s.route)}
            className="text-left p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${s.bg}`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{s.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
