import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          {badge}
        </span>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}
