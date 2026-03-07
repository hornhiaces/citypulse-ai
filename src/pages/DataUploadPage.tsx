import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Files } from 'lucide-react';
import { toast } from 'sonner';

type DatasetType = '311' | '911' | 'business_licenses';

interface FileUpload {
  id: string;
  file: File;
  detectedType: DatasetType | null;
  detectionDone: boolean;
  status: 'queued' | 'parsing' | 'uploading' | 'done' | 'error';
  progress: number;
  totalRows: number;
  insertedRows: number;
  errors: string[];
}

const CHUNK_SIZE = 500;

const DATASET_LABELS: Record<DatasetType, string> = {
  '311': '311 Service Requests',
  '911': '911 Emergency Calls',
  'business_licenses': 'Business Licenses',
};

function detectDatasetFromHeaders(headers: string[]): DatasetType | null {
  const lower = headers.map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
  const sigs: Record<DatasetType, string[]> = {
    '311': ['requestid', 'requesttype', 'district', 'department', 'createdate'],
    '911': ['callcategory', 'callcount', 'phoneserviceprovidertype', 'callorigin', 'fid'],
    'business_licenses': ['paccnumber', 'custcompanyname', 'pvnumber', 'pvexpire', 'scname'],
  };
  let best: DatasetType | null = null;
  let bestScore = 0;
  for (const [ds, keys] of Object.entries(sigs) as [DatasetType, string[]][]) {
    const score = keys.filter(k => lower.some(h => h.includes(k))).length;
    if (score > bestScore) { bestScore = score; best = ds; }
  }
  return bestScore >= 2 ? best : null;
}

export default function DataUploadPage() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const csvFiles = selected.filter(f => f.name.endsWith('.csv'));
    if (csvFiles.length < selected.length) {
      toast.warning(`${selected.length - csvFiles.length} non-CSV file(s) skipped`);
    }
    if (!csvFiles.length) return;

    const newFiles: FileUpload[] = csvFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      detectedType: null,
      detectionDone: false,
      status: 'queued',
      progress: 0,
      totalRows: 0,
      insertedRows: 0,
      errors: [],
    }));

    // Preview headers for detection
    newFiles.forEach(fu => {
      Papa.parse(fu.file, {
        header: true,
        preview: 1,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const detected = detectDatasetFromHeaders(headers);
          setFiles(prev => prev.map(f => f.id === fu.id ? { ...f, detectedType: detected, detectionDone: true } : f));
        },
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const processFile = async (fu: FileUpload) => {
    return new Promise<void>((resolve) => {
      setFiles(prev => prev.map(f => f.id === fu.id ? { ...f, status: 'parsing' } : f));

      Papa.parse(fu.file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const records = results.data as Record<string, unknown>[];
          const columns = results.meta.fields || [];
          const total = records.length;
          setFiles(prev => prev.map(f => f.id === fu.id ? { ...f, totalRows: total, status: 'uploading' } : f));

          let inserted = 0;
          const errors: string[] = [];
          const chunks = Math.ceil(total / CHUNK_SIZE);

          for (let i = 0; i < chunks; i++) {
            const chunk = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            try {
              const { data, error } = await supabase.functions.invoke('ingest-dataset', {
                body: {
                  ...(fu.detectedType ? { dataset: fu.detectedType } : {}),
                  columns,
                  records: chunk,
                },
              });
              if (error) errors.push(`Chunk ${i + 1}: ${error.message}`);
              else if (data?.errors?.length) errors.push(...data.errors.map((e: string) => `Chunk ${i + 1}: ${e}`));
              inserted += data?.inserted || 0;
            } catch (err) {
              errors.push(`Chunk ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
            }

            const progress = Math.round(((i + 1) / chunks) * 100);
            setFiles(prev => prev.map(f => f.id === fu.id ? { ...f, progress, insertedRows: inserted } : f));
          }

          setFiles(prev => prev.map(f => f.id === fu.id ? {
            ...f,
            status: errors.length && inserted === 0 ? 'error' : 'done',
            errors,
            insertedRows: inserted,
          } : f));

          resolve();
        },
        error: (err) => {
          setFiles(prev => prev.map(f => f.id === fu.id ? { ...f, status: 'error', errors: [err.message] } : f));
          resolve();
        },
      });
    });
  };

  const handleUploadAll = useCallback(async () => {
    const queued = files.filter(f => f.status === 'queued' && f.detectedType);
    const skipped = files.filter(f => f.status === 'queued' && !f.detectedType);

    if (!queued.length) {
      toast.error('No recognized dataset files to process. Remove unknown files or add valid CSVs.');
      return;
    }

    if (skipped.length) {
      toast.warning(`Skipping ${skipped.length} unrecognized file(s): ${skipped.map(f => f.file.name).join(', ')}`);
      setFiles(prev => prev.map(f => skipped.some(s => s.id === f.id) ? { ...f, status: 'error', errors: ['Unrecognized dataset type'] } : f));
    }

    setIsProcessing(true);
    for (const fu of queued) {
      await processFile(fu);
    }
    setIsProcessing(false);

    const doneFiles = files.filter(f => f.status === 'done' || queued.some(q => q.id === f.id));
    toast.success(`Finished processing ${queued.length} file(s)`);
  }, [files]);

  const statusIcon = (s: FileUpload['status']) => {
    if (s === 'queued') return <FileText className="h-4 w-4 text-muted-foreground" />;
    if (s === 'parsing' || s === 'uploading') return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    if (s === 'done') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const typeBadgeColor = (t: DatasetType | null) => {
    if (t === '311') return 'default';
    if (t === '911') return 'destructive';
    if (t === 'business_licenses') return 'secondary';
    return 'outline';
  };

  const queuedCount = files.filter(f => f.status === 'queued' && f.detectedType).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Ingestion"
        subtitle="Drop multiple CSV files at once. Dataset types are auto-detected from headers. Duplicate records are automatically updated."
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Files className="h-5 w-5 text-primary" />
            Upload Datasets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* File input - multi */}
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFilesSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click or drag to select one or more CSV files
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dataset type is auto-detected · Duplicates are upserted
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map(fu => (
                <div key={fu.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(fu.status)}
                      <span className="text-sm font-medium truncate">{fu.file.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {(fu.file.size / (1024 * 1024)).toFixed(1)} MB
                      </Badge>
                      {fu.detectedType ? (
                        <Badge variant={typeBadgeColor(fu.detectedType)} className="text-xs shrink-0">
                          {DATASET_LABELS[fu.detectedType]}
                        </Badge>
                      ) : fu.detectionDone ? (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">
                          Unknown type
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                          Detecting...
                        </Badge>
                      )}
                    </div>
                    {fu.status === 'queued' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(fu.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {(fu.status === 'uploading' || fu.status === 'done' || fu.status === 'error') && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {fu.status === 'uploading' && 'Processing...'}
                          {fu.status === 'done' && 'Complete'}
                          {fu.status === 'error' && 'Failed'}
                        </span>
                        <span>{fu.insertedRows.toLocaleString()} / {fu.totalRows.toLocaleString()} rows</span>
                      </div>
                      <Progress value={fu.progress} className="h-1.5" />
                      {fu.errors.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded p-2 max-h-20 overflow-y-auto mt-1">
                          {fu.errors.slice(0, 3).map((err, i) => (
                            <p key={i} className="text-xs text-destructive">{err}</p>
                          ))}
                          {fu.errors.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{fu.errors.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload all button */}
          {files.length > 0 && (
            <Button
              onClick={handleUploadAll}
              disabled={isProcessing || queuedCount === 0}
              className="w-full max-w-xs"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Ingest {queuedCount} File{queuedCount !== 1 ? 's' : ''}</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
