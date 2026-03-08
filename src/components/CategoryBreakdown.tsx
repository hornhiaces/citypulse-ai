import { serviceRequestCategories } from '@/lib/mockData';
import { motion } from 'framer-motion';

interface CategoryBreakdownProps {
  data?: { category: string; count: number; percentage: number }[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Explicit data state detection
  const hasLiveData = Array.isArray(data) && data.length > 0;
  const isEmptyData = Array.isArray(data) && data.length === 0;

  // Use live data if available, otherwise fallback to mock data
  const categories = hasLiveData ? data : serviceRequestCategories;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">311 Request Categories</h3>
      {isEmptyData ? (
        <p className="text-sm text-muted-foreground">📊 No category data available.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{cat.category}</span>
                <span className="font-mono text-foreground">{cat.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                  className="h-full rounded-full bg-primary/70"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
