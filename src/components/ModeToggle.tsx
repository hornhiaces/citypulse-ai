import { useMode } from '@/lib/modeContext';
import { Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
      <button
        onClick={() => setMode('leadership')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'leadership' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {mode === 'leadership' && (
          <motion.div layoutId="mode-bg" className="absolute inset-0 rounded-md bg-primary" />
        )}
        <Shield className="h-3.5 w-3.5 relative z-10" />
        <span className="relative z-10">Leadership</span>
      </button>
      <button
        onClick={() => setMode('citizen')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'citizen' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {mode === 'citizen' && (
          <motion.div layoutId="mode-bg" className="absolute inset-0 rounded-md bg-primary" />
        )}
        <Users className="h-3.5 w-3.5 relative z-10" />
        <span className="relative z-10">Citizen</span>
      </button>
    </div>
  );
}
