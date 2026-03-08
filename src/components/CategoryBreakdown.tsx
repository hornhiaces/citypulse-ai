import { serviceRequestCategories } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategoryBreakdownProps {
  data?: { category: string; count: number; percentage: number }[];
}

function CategoryBar({ cat, i, compact = false }: { cat: { category: string; count: number; percentage: number }; i: number; compact?: boolean }) {
  return (
    <motion.div
      key={cat.category}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.03 }}
    >
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground truncate mr-2">{cat.category}</span>
        <span className="font-mono text-foreground shrink-0">{cat.count}</span>
      </div>
      <div className={`${compact ? 'h-1' : 'h-1.5'} rounded-full bg-secondary overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cat.percentage}%` }}
          transition={{ delay: i * 0.03 + 0.15, duration: 0.5 }}
          className="h-full rounded-full bg-primary/70"
        />
      </div>
    </motion.div>
  );
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const categories = data || serviceRequestCategories;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">311 Request Categories</h3>
          {categories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary/80 gap-1 px-2"
              onClick={() => setOpen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              View All
            </Button>
          )}
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No category data available.</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-2 pr-1">
              {categories.map((cat, i) => (
                <CategoryBar key={cat.category} cat={cat} i={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>All 311 Request Categories</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <CategoryBar key={cat.category} cat={cat} i={i} compact />
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {categories.length} categories
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
