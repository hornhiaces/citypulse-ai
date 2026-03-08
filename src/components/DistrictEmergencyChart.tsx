import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';

interface DistrictEmergencyChartProps {
  data?: { district: string; calls: number; change: number }[];
  isLoading?: boolean;
  isError?: boolean;
}

export function DistrictEmergencyChart({ data, isLoading, isError }: DistrictEmergencyChartProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-1">Emergency Demand by District</h3>
      <p className="text-xs text-muted-foreground mb-4">Estimated call volume with demand change %</p>

      {isLoading ? (
        <div className="flex-1 min-h-[200px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-24 w-full max-w-[200px] bg-muted rounded" />
            <span className="text-xs text-muted-foreground">Loading data…</span>
          </div>
        </div>
      ) : isError ? (
        <div className="flex-1 min-h-[200px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-medium">Failed to load district data</span>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex-1 min-h-[200px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">No district data available</span>
            <span className="text-[10px] text-muted-foreground">Emergency data has not been ingested yet</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis
                dataKey="district"
                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', opacity: 0.8 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.7 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600, marginBottom: '2px' }}
                itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value: number, name: string) => [value.toLocaleString(), name === 'calls' ? 'Est. Calls' : name]}
                labelFormatter={(label) => label}
                cursor={{ fill: 'hsl(var(--accent) / 0.15)' }}
              />
              <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.change > 10 ? 'hsl(350 72% 55%)' : entry.change > 0 ? 'hsl(38 92% 50%)' : 'hsl(152 69% 45%)'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
