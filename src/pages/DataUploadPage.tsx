import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DatasetType = '311' | '911' | 'business_licenses';

interface UploadState {
  file: File | null;
  dataset: DatasetType | '';
  status: 'idle' | 'parsing' | 'uploading' | 'done' | 'error';
  progress: number;
  totalRows: number;
  insertedRows: number;
  errors: string[];
}

const CHUNK_SIZE = 500;

export default function DataUploadPage() {
  const [state, setState] = useState<UploadState>({
    file: null,
    dataset: '',
    status: 'idle',
    progress: 0,
    totalRows: 0,
    insertedRows: 0,
    errors: [],
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setState(prev => ({ ...prev, file, status: 'idle', progress: 0, insertedRows: 0, errors: [] }));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!state.file || !state.dataset) {
      toast.error('Select a file and dataset type');
      return;
    }

    setState(prev => ({ ...prev, status: 'parsing', progress: 0 }));

    Papa.parse(state.file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const records = results.data as Record<string, unknown>[];
        const total = records.length;
        setState(prev => ({ ...prev, totalRows: total, status: 'uploading' }));

        let inserted = 0;
        const errors: string[] = [];
        const chunks = Math.ceil(total / CHUNK_SIZE);

        for (let i = 0; i < chunks; i++) {
          const chunk = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

          try {
            const { data, error } = await supabase.functions.invoke('ingest-dataset', {
              body: { dataset: state.dataset, records: chunk },
            });

            if (error) {
              errors.push(`Chunk ${i + 1}: ${error.message}`);
            } else if (data?.errors?.length) {
              errors.push(...data.errors.map((e: string) => `Chunk ${i + 1}: ${e}`));
            }

            inserted += data?.inserted || 0;
          } catch (err) {
            errors.push(`Chunk ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
          }

          const progress = Math.round(((i + 1) / chunks) * 100);
          setState(prev => ({ ...prev, progress, insertedRows: inserted }));
        }

        setState(prev => ({
          ...prev,
          status: errors.length && inserted === 0 ? 'error' : 'done',
          errors,
          insertedRows: inserted,
        }));

        if (inserted > 0) {
          toast.success(`Ingested ${inserted.toLocaleString()} of ${total.toLocaleString()} records`);
        }
      },
      error: (err) => {
        setState(prev => ({ ...prev, status: 'error', errors: [err.message] }));
        toast.error('Failed to parse CSV');
      },
    });
  }, [state.file, state.dataset]);

  const statusIcon = {
    idle: <Upload className="h-5 w-5 text-muted-foreground" />,
    parsing: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    uploading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    done: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Ingestion"
        subtitle="Upload large CSV datasets for processing. Files are parsed client-side and sent in chunks."
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Upload Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Dataset selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dataset Type</label>
            <Select
              value={state.dataset}
              onValueChange={(v) => setState(prev => ({ ...prev, dataset: v as DatasetType }))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select dataset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="311">311 Service Requests</SelectItem>
                <SelectItem value="911">911 Emergency Calls</SelectItem>
                <SelectItem value="business_licenses">Business Licenses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CSV File</label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer space-y-2 block">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {state.file ? state.file.name : 'Click to select a CSV file (no size limit)'}
                </p>
                {state.file && (
                  <Badge variant="secondary">
                    {(state.file.size / (1024 * 1024)).toFixed(1)} MB
                  </Badge>
                )}
              </label>
            </div>
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!state.file || !state.dataset || state.status === 'parsing' || state.status === 'uploading'}
            className="w-full max-w-xs"
          >
            {state.status === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Ingestion
              </>
            )}
          </Button>

          {/* Progress */}
          {(state.status === 'uploading' || state.status === 'done' || state.status === 'error') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {statusIcon[state.status]}
                  {state.status === 'uploading' && 'Processing chunks...'}
                  {state.status === 'done' && 'Ingestion complete'}
                  {state.status === 'error' && 'Ingestion failed'}
                </span>
                <span className="text-muted-foreground">
                  {state.insertedRows.toLocaleString()} / {state.totalRows.toLocaleString()} rows
                </span>
              </div>
              <Progress value={state.progress} className="h-2" />

              {state.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {state.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                  {state.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{state.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
