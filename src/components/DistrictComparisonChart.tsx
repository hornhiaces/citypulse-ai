import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DistrictScore, ScoreLevel } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';
import { useState } from 'react';

const scoreToNum: Record<string, number> = {
  HIGH: 90, RISING: 80, MEDIUM: 55, DECLINING: 40, STABLE: 50, LOW: 25, STRONG: 85,
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(350 72% 55%)',
  'hsl(160 60% 45%)',
  'hsl(45 90% 55%)',
];

interface DistrictComparisonChartProps {
  districts: DistrictScore[];
}

export function DistrictComparisonChart({ districts }: DistrictComparisonChartProps) {
  const { isLeadership } = useMode();
  const [selectedIds, setSelectedIds] = useState<number[]>(
    districts.slice(0, 3).map(d => d.district)
  );

  const toggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const dimensions = [
    { key: 'publicSafetyPressure', label: isLeadership ? 'Safety Pressure' : 'Safety' },
    { key: 'infrastructureStress', label: isLeadership ? 'Infra Stress' : 'Infrastructure' },
    { key: 'emergencyDemand', label: isLeadership ? 'Emergency Demand' : 'Emergencies' },
    { key: 'economicActivity', label: isLeadership ? 'Economic Activity' : 'Economy' },
    { key: 'citizenConfidence', label: isLeadership ? 'Citizen Confidence' : 'Confidence' },
  ];

  const selected = districts.filter(d => selectedIds.includes(d.district));

  const radarData = dimensions.map(dim => {
    const point: Record<string, string | number> = { dimension: dim.label };
    selected.forEach(d => {
      point[`D${d.district}`] = scoreToNum[d[dim.key as keyof DistrictScore] as string] || 50;
    });
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1">District Comparison</h3>
      <p className="text-xs text-muted-foreground mb-3">Select up to 4 districts to compare</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {districts.map(d => (
          <button
            key={d.district}
            onClick={() => toggle(d.district)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              selectedIds.includes(d.district)
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-secondary/50 border-border/50 text-muted-foreground hover:border-primary/30'
            }`}
          >
            D{d.district} {d.name}
          </button>
        ))}
      </div>

      {selected.length > 0 ? (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              {selected.map((d, i) => (
                <Radar
                  key={d.district}
                  name={`D${d.district} ${d.name}`}
                  dataKey={`D${d.district}`}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: '10px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">Select districts to compare</p>
      )}
    </motion.div>
  );
}
