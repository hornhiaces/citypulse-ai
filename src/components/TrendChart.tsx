import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { monthlyTrends } from '@/lib/mockData';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  title: string;
  dataKey: string;
  color: string;
  description?: string;
  data?: Record<string, unknown>[];
  forecastMonths?: number;
}

function computeForecast(data: Record<string, unknown>[], dataKey: string, months = 3) {
  if (!data || data.length < 3) return { chartData: data || [], forecastStart: '', changePercent: 0 };

  const values = data.map(d => Number(d[dataKey]) || 0);
  const lastN = values.slice(-3);
  const avg = lastN.reduce((a, b) => a + b, 0) / lastN.length;

  // Simple linear trend from last 3 points
  const slope = (lastN[lastN.length - 1] - lastN[0]) / (lastN.length - 1);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lastMonth = String(data[data.length - 1]?.month || '');
  const lastIdx = monthNames.indexOf(lastMonth);

  const forecastStart = lastMonth;
  const forecastData: Record<string, unknown>[] = [];

  // Mark last actual point as bridge
  const bridgePoint = { ...data[data.length - 1], [`${dataKey}_forecast`]: Number(data[data.length - 1][dataKey]) || 0 };

  for (let i = 1; i <= months; i++) {
    const mIdx = (lastIdx + i) % 12;
    const projected = Math.max(0, Math.round(avg + slope * i));
    forecastData.push({
      month: monthNames[mIdx],
      [`${dataKey}_forecast`]: projected,
    });
  }

  const lastActual = values[values.length - 1];
  const lastForecast = Number(forecastData[forecastData.length - 1]?.[`${dataKey}_forecast`]) || lastActual;
  const changePercent = lastActual > 0 ? Math.round(((lastForecast - lastActual) / lastActual) * 100) : 0;

  const merged = [
    ...data.slice(0, -1).map(d => ({ ...d, [`${dataKey}_forecast`]: undefined })),
    bridgePoint,
    ...forecastData,
  ];

  return { chartData: merged, forecastStart, changePercent };
}

export function TrendChart({ title, dataKey, color, description, data, forecastMonths = 3 }: TrendChartProps) {
  const rawData = data || monthlyTrends;
  const { chartData, forecastStart, changePercent } = computeForecast(rawData as Record<string, unknown>[], dataKey, forecastMonths);
  const forecastKey = `${dataKey}_forecast`;
  const isUp = changePercent > 0;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {changePercent !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isUp ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <TrendingUp className={`w-3 h-3 ${!isUp ? 'rotate-180' : ''}`} />
            <span>{isUp ? '+' : ''}{changePercent}% forecast</span>
          </div>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      <div className="h-48 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`gradient-${forecastKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.12} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string) => {
                const label = name.includes('forecast') ? 'Forecast' : 'Actual';
                return [value, label];
              }}
            />
            {forecastStart && (
              <ReferenceLine x={forecastStart} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#gradient-${dataKey})`} strokeWidth={2} />
            <Area type="monotone" dataKey={forecastKey} stroke={color} fill={`url(#gradient-${forecastKey})`} strokeWidth={2} strokeDasharray="6 3" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
        <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
        <span className="text-[10px] text-muted-foreground">Actual</span>
        <div className="w-4 h-0.5 rounded border-t border-dashed" style={{ borderColor: color }} />
        <span className="text-[10px] text-muted-foreground">Forecast</span>
      </div>
    </div>
  );
}
