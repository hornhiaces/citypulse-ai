import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, Legend,
} from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface ServiceRequestTrendChartProps {
  data?: {
    month: string;
    requests311: number;
    resolved: number;
    open: number;
    resolutionRate: number;
  }[];
  isLoading?: boolean;
  isError?: boolean;
  showForecast?: boolean;
}

export function ServiceRequestTrendChart({ data, isLoading, isError, showForecast }: ServiceRequestTrendChartProps) {
  const hasData = data && data.length > 1;

  // Compute summary stats
  const latestMonth = hasData ? data[data.length - 1] : null;
  const prevMonth = hasData && data.length > 1 ? data[data.length - 2] : null;
  const volumeChange = latestMonth && prevMonth && prevMonth.requests311 > 0
    ? Math.round(((latestMonth.requests311 - prevMonth.requests311) / prevMonth.requests311) * 100)
    : 0;

  // Append forecast if requested
  const chartData = (() => {
    if (!hasData || !showForecast) return data || [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last3 = data.slice(-3);
    const avgTotal = Math.round(last3.reduce((s, d) => s + d.requests311, 0) / 3);
    const avgResolved = Math.round(last3.reduce((s, d) => s + d.resolved, 0) / 3);
    const slope = (last3[2].requests311 - last3[0].requests311) / 2;

    const lastMonth = data[data.length - 1].month;
    const lastIdx = monthNames.indexOf(lastMonth);

    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const mIdx = (lastIdx + i) % 12;
      const projected = Math.max(0, Math.round(avgTotal + slope * i));
      const projResolved = Math.round(avgResolved * (projected / (avgTotal || 1)));
      forecast.push({
        month: monthNames[mIdx],
        requests311: undefined as number | undefined,
        resolved: undefined as number | undefined,
        open: undefined as number | undefined,
        resolutionRate: undefined as number | undefined,
        forecastTotal: projected,
        forecastResolved: projResolved,
      });
    }

    // Bridge point
    const bridge = {
      ...data[data.length - 1],
      forecastTotal: data[data.length - 1].requests311,
      forecastResolved: data[data.length - 1].resolved,
    };

    return [
      ...data.slice(0, -1).map(d => ({ ...d, forecastTotal: undefined, forecastResolved: undefined })),
      bridge,
      ...forecast,
    ];
  })();

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">311 Service Request Volume</h3>
          <p className="text-xs text-muted-foreground">Monthly submissions with resolution breakdown</p>
        </div>
        {hasData && latestMonth && (
          <div className="flex items-center gap-2">
            {volumeChange !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${volumeChange > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {volumeChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{volumeChange > 0 ? '+' : ''}{volumeChange}% MoM</span>
              </div>
            )}
            <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {latestMonth.resolutionRate}% resolved
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-56 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-24 w-full max-w-[200px] bg-muted rounded" />
            <span className="text-xs text-muted-foreground">Loading data…</span>
          </div>
        </div>
      ) : isError ? (
        <div className="h-56 flex-1 min-h-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-medium">Failed to load data</span>
          </div>
        </div>
      ) : !hasData ? (
        <div className="h-56 flex-1 min-h-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">No data available</span>
          </div>
        </div>
      ) : (
        <div className="h-56 flex-1 min-h-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="grad-resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152 69% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-open" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string, index: number) => {
                  const item = chartData[index] as any;
                  const years = new Set(chartData.map((d: any) => d.year).filter(Boolean));
                  if (years.size > 1 && item?.year) return `${value} '${String(item.year).slice(-2)}`;
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={(label: string, payload: any[]) => {
                  const year = payload?.[0]?.payload?.year;
                  return year ? `${label} ${year}` : label;
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    resolved: 'Resolved',
                    open: 'Open/In Progress',
                    requests311: 'Total',
                    forecastTotal: 'Forecast Total',
                    forecastResolved: 'Forecast Resolved',
                  };
                  return [value?.toLocaleString() ?? '—', labels[name] || name];
                }}
              />
              <Area type="monotone" dataKey="resolved" stackId="1" stroke="hsl(152 69% 45%)" fill="url(#grad-resolved)" strokeWidth={0} />
              <Area type="monotone" dataKey="open" stackId="1" stroke="hsl(38 92% 50%)" fill="url(#grad-open)" strokeWidth={0} />
              <Line type="monotone" dataKey="requests311" stroke="hsl(245 58% 60%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(245 58% 60%)' }} activeDot={{ r: 5 }} />
              {showForecast && (
                <>
                  <Line type="monotone" dataKey="forecastTotal" stroke="hsl(245 58% 60%)" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
                  <Bar dataKey="forecastResolved" fill="hsl(152 69% 45%)" fillOpacity={0.15} radius={[4, 4, 0, 0]} barSize={20} />
                </>
              )}
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    resolved: 'Resolved',
                    open: 'Open',
                    requests311: 'Total',
                    forecastTotal: 'Forecast',
                    forecastResolved: 'Forecast Resolved',
                  };
                  return labels[value] || value;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
