import { motion } from 'framer-motion';
import { getScoreBadgeClass } from '@/lib/mockData';
import type { DistrictScore } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';
import { useState } from 'react';

const districtPositions = [
  { x: 35, y: 20, w: 20, h: 18 },
  { x: 55, y: 15, w: 22, h: 20 },
  { x: 30, y: 40, w: 18, h: 18 },
  { x: 25, y: 10, w: 20, h: 16 },
  { x: 10, y: 35, w: 20, h: 22 },
  { x: 58, y: 38, w: 22, h: 18 },
  { x: 65, y: 60, w: 20, h: 18 },
  { x: 10, y: 58, w: 22, h: 20 },
  { x: 45, y: 62, w: 18, h: 18 },
];

const riskColor = (score: string) => {
  if (score === 'HIGH' || score === 'RISING') return 'rgba(239, 68, 68, 0.35)';
  if (score === 'MEDIUM') return 'rgba(245, 158, 11, 0.25)';
  return 'rgba(34, 197, 94, 0.2)';
};

interface CityHeatmapProps {
  districts?: DistrictScore[];
}

export function CityHeatmap({ districts }: CityHeatmapProps) {
  const { isLeadership } = useMode();
  const [selected, setSelected] = useState<number | null>(null);

  if (!districts?.length) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Geospatial Intelligence</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading district data…</div>
      </div>
    );
  }

  const selectedDistrict = selected !== null ? districts[selected] : null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {isLeadership ? 'Geospatial Intelligence' : 'City Conditions Map'}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Montgomery District Overview</p>

      <div className="relative w-full aspect-[16/10] bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {[20, 40, 60, 80].map(p => (
            <g key={p}>
              <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
            </g>
          ))}
        </svg>

        {districts.map((d, i) => {
          const pos = districtPositions[i];
          if (!pos) return null;
          return (
            <motion.div
              key={d.district}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`absolute rounded-lg border cursor-pointer transition-all ${
                selected === i ? 'border-primary z-10 ring-2 ring-primary/30' : 'border-border/30 hover:border-primary/50'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.w}%`,
                height: `${pos.h}%`,
                backgroundColor: riskColor(d.publicSafetyPressure),
              }}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              <div className="p-2 h-full flex flex-col justify-between">
                <span className="text-[10px] font-bold text-foreground">D{d.district}</span>
                <span className="text-[9px] text-muted-foreground truncate">{d.name}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedDistrict && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border/50"
        >
          <h4 className="text-sm font-semibold text-foreground">District {selectedDistrict.district}: {selectedDistrict.name}</h4>
          <p className="text-xs text-muted-foreground mb-3">{selectedDistrict.area} · Pop. {selectedDistrict.population.toLocaleString()}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'Safety', value: selectedDistrict.publicSafetyPressure },
              { label: 'Infrastructure', value: selectedDistrict.infrastructureStress },
              { label: 'Emergency', value: selectedDistrict.emergencyDemand },
              { label: 'Economy', value: selectedDistrict.economicActivity },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={getScoreBadgeClass(s.value)}>{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/40" />
          <span className="text-[10px] text-muted-foreground">High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/30" />
          <span className="text-[10px] text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/25" />
          <span className="text-[10px] text-muted-foreground">Low Risk</span>
        </div>
      </div>
    </div>
  );
}
