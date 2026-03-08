import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { AlertCircle } from 'lucide-react';

interface LicenseTrendChartProps {
  data?: {
    month: string;
    year: number;
    newLicenses: number;
    renewals: number;
    total: number;
  }[];
  isLoading?: boolean;
}

export function LicenseTrendChart({ data, isLoading }: LicenseTrendChartProps) {
  const hasData = data && data.length > 1;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-foreground">License Issuance Trends</h3>
        <p className="text-xs text-muted-foreground">Monthly new licenses vs renewals</p>
      </div>

      {isLoading ? (
        <div className="h-56 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-24 w-full max-w-[200px] bg-muted rounded" />
            <span className="text-xs text-muted-foreground">Loading data…</span>
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
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="grad-new" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(245 58% 60%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(245 58% 60%)" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="grad-renew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152 69% 45%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(152 69% 45%)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.8 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string, index: number) => {
                  const item = data![index];
                  const years = new Set(data!.map(d => d.year));
                  if (years.size > 1 && item?.year) return `${value} '${String(item.year).slice(-2)}`;
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.7 }} axisLine={false} tickLine={false} />
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
                    newLicenses: 'New Licenses',
                    renewals: 'Renewals',
                    total: 'Total',
                  };
                  return [value?.toLocaleString() ?? '—', labels[name] || name];
                }}
              />
              <Bar dataKey="renewals" fill="url(#grad-renew)" radius={[0, 0, 0, 0]} stackId="stack" barSize={20} />
              <Bar dataKey="newLicenses" fill="url(#grad-new)" radius={[4, 4, 0, 0]} stackId="stack" barSize={20} />
              <Line type="monotone" dataKey="total" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 2 }} />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = { newLicenses: 'New', renewals: 'Renewals', total: 'Total' };
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
