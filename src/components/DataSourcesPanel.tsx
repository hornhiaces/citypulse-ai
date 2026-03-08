import { motion } from 'framer-motion';
import { Database, ExternalLink, CheckCircle2, Clock, FileText, Shield, Building2, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.ElementType> = {
  '311': FileText,
  '911': Shield,
  'Business': Building2,
};

function getIcon(name: string) {
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return Icon;
  }
  return Database;
}

interface DatasetInfo {
  name: string;
  description: string | null;
  record_count: number | null;
  status: string | null;
  last_ingested_at: string | null;
  source_url: string | null;
}

export function DataSourcesPanel() {
  const { data: datasets } = useQuery({
    queryKey: ['dataset-catalog-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dataset_catalog')
        .select('name, description, record_count, status, last_ingested_at, source_url')
        .eq('status', 'complete')
        .order('name');
      if (error) throw error;
      // Deduplicate by name (keep first)
      const seen = new Set<string>();
      return (data || []).filter(d => {
        if (seen.has(d.name)) return false;
        seen.add(d.name);
        return true;
      }) as DatasetInfo[];
    },
  });

  if (!datasets?.length) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Data Sources</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-auto">
          {datasets.length} active datasets
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">All intelligence is derived from official City of Montgomery open data</p>

      <div className="space-y-2.5">
        {datasets.map((ds, i) => {
          const Icon = getIcon(ds.name);
          const lastIngested = ds.last_ingested_at
            ? new Date(ds.last_ingested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : null;

          return (
            <motion.div
              key={ds.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-primary/10 shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{ds.name}</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                </div>
                {ds.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{ds.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {lastIngested && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      Last updated: {lastIngested}
                    </span>
                  )}
                  {ds.source_url && ds.source_url.endsWith('.csv') ? (
                    <span className="flex items-center gap-2">
                      <a
                        href={ds.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        View
                      </a>
                      <a
                        href={ds.source_url}
                        download
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        <Download className="h-2.5 w-2.5" />
                        Download CSV
                      </a>
                    </span>
                  ) : ds.source_url ? (
                    <a
                      href={ds.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      Source
                    </a>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
