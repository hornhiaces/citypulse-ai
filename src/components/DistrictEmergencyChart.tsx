import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { districtEmergencyData } from '@/lib/mockData';

interface DistrictEmergencyChartProps {
  data?: { district: string; calls: number; change: number }[];
}

export function DistrictEmergencyChart({ data }: DistrictEmergencyChartProps) {
  const chartData = data || districtEmergencyData;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-1">Emergency Calls by District</h3>
      <p className="text-xs text-muted-foreground mb-4">30-day volume with month-over-month change</p>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="district" tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 8%)',
                border: '1px solid hsl(222 30% 16%)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(210 40% 96%)',
              }}
            />
            <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.change > 10 ? 'hsl(350 72% 55%)' : entry.change > 0 ? 'hsl(38 92% 50%)' : 'hsl(152 69% 45%)'} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
