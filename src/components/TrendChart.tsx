import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyTrends } from '@/lib/mockData';

interface TrendChartProps {
  title: string;
  dataKey: string;
  color: string;
  description?: string;
  data?: Record<string, unknown>[];
  isLoading?: boolean;
  error?: Error | null;
}

export function TrendChart({ title, dataKey, color, description, data, isLoading, error }: TrendChartProps) {
  const chartData = data ?? monthlyTrends;
  const isEmpty = data && data.length === 0;
  const showMockData = !data;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-red-500">Error loading data: {error.message}</p>
        </div>
      ) : isEmpty ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available for this period</p>
        </div>
      ) : (
      <div className="h-48">
        {showMockData && (
          <p className="text-xs text-amber-600 mb-2">📊 Showing sample data (live data loading...)</p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 20% 55%)' }} axisLine={false} tickLine={false} />
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
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#gradient-${dataKey})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
