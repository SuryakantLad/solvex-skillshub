import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { bulkImport } from '@/services/resumeService';
import { cn } from '@/lib/utils';

export default function BulkImportPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function addFiles(newFiles) {
    const pdfs = Array.from(newFiles).filter((f) => f.type === 'application/pdf');
    if (pdfs.length !== newFiles.length) toast.warning('Only PDF files are supported');
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const unique = pdfs.filter((f) => !existing.has(f.name));
      const combined = [...prev, ...unique].slice(0, 20);
      if (combined.length === 20) toast.info('Maximum 20 files reached');
      return combined;
    });
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleImport() {
    if (files.length === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await bulkImport(files);
      setResults(data);
      toast.success(`Imported ${data.results?.filter((r) => r.status !== 'error').length ?? 0} employees`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  }

  const created = results?.results?.filter((r) => r.status === 'created').length ?? 0;
  const updated = results?.results?.filter((r) => r.status === 'updated').length ?? 0;
  const errors = results?.results?.filter((r) => r.status === 'error').length ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Bulk Resume Import"
        description="Upload up to 20 PDF resumes at once. AI will parse and create employee profiles automatically."
      />

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/40 hover:bg-secondary/30'
        )}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Drop PDF resumes here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse • max 20 files</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-xs text-muted-foreground">
              Clear all
            </Button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium flex-1 truncate">{file.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Importing…' : `Import ${files.length} Resume${files.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* Loading progress */}
      {loading && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Processing resumes with AI…</p>
                <p className="text-xs text-muted-foreground">This may take up to a minute for large batches</p>
              </div>
            </div>
            <Progress value={undefined} className="h-1.5 animate-pulse" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{created}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{updated}</p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </CardContent>
            </Card>
            <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-1.5">
            {results.results?.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                {r.status === 'error'
                  ? <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                }
                <span className="text-xs font-medium flex-1 truncate">{r.fileName ?? r.name ?? `File ${i + 1}`}</span>
                <Badge variant={r.status === 'created' ? 'success' : r.status === 'updated' ? 'info' : 'destructive'} className="text-[10px] shrink-0">
                  {r.status}
                </Badge>
                {r.error && <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{r.error}</span>}
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={() => { setFiles([]); setResults(null); }} className="w-full">
            <Plus className="w-4 h-4" />
            Import More Resumes
          </Button>
        </motion.div>
      )}
    </div>
  );
}
