'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MAX_FILES = 20;

function StatusIcon({ status }) {
  if (status === 'created') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'updated') return <RefreshCw className="w-4 h-4 text-blue-500" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-destructive" />;
  if (status === 'skipped') return <AlertCircle className="w-4 h-4 text-amber-500" />;
  if (status === 'processing') return <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

function StatusBadge({ status }) {
  const variants = {
    created: 'bg-green-500/10 text-green-600',
    updated: 'bg-blue-500/10 text-blue-600',
    error: 'bg-destructive/10 text-destructive',
    skipped: 'bg-amber-500/10 text-amber-600',
    processing: 'bg-muted text-muted-foreground',
    pending: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', variants[status] ?? variants.pending)}>
      {status}
    </span>
  );
}

export default function BulkImportPage() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const pdfs = [...newFiles].filter((f) => f.type === 'application/pdf');
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const unique = pdfs.filter((f) => !existing.has(f.name));
      return [...prev, ...unique].slice(0, MAX_FILES);
    });
  }, []);

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function clearAll() {
    setFiles([]);
    setResults([]);
    setSummary(null);
  }

  async function handleUpload() {
    if (!files.length || uploading) return;

    setUploading(true);
    setResults([]);
    setSummary(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('resumes', f));

    try {
      const res = await fetch('/api/resume/bulk', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResults(data.results ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setResults([{ fileName: 'batch', status: 'error', reason: err.message }]);
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  const hasResults = results.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Resume Import"
        description="Upload up to 20 PDFs at once. AI parses each resume and creates or updates employee profiles."
        action={
          hasResults && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          )
        }
      />

      {/* Drop zone */}
      {!hasResults && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors select-none',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/40'
          )}
        >
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
            dragging ? 'bg-primary/20' : 'bg-secondary'
          )}>
            <Upload className={cn('w-8 h-8 transition-colors', dragging ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div className="text-center">
            <p className="font-semibold">Drop PDF resumes here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse · max {MAX_FILES} files · 10 MB each</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      )}

      {/* File queue */}
      {files.length > 0 && !hasResults && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {files.length} file{files.length !== 1 ? 's' : ''} queued
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                >
                  Add more
                </Button>
                <Button size="sm" onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing…</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1.5" /> Import All</>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-secondary group">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload in progress */}
      {uploading && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <RefreshCw className="w-3 h-3 text-white animate-spin" />
            </span>
          </div>
          <div>
            <p className="font-semibold">Processing {files.length} resume{files.length !== 1 ? 's' : ''}…</p>
            <p className="text-sm text-muted-foreground mt-1">
              AI is parsing each PDF. This may take {Math.ceil(files.length * 8)} – {Math.ceil(files.length * 15)} seconds.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {hasResults && !uploading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Created', value: summary.created, color: 'text-green-600', bg: 'bg-green-500/10' },
                  { label: 'Updated', value: summary.updated, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                  { label: 'Skipped', value: summary.skipped, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                  { label: 'Errors', value: summary.errors, color: 'text-destructive', bg: 'bg-destructive/10' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn('rounded-xl px-4 py-3', bg)}>
                    <p className={cn('text-2xl font-bold', color)}>{value}</p>
                    <p className={cn('text-xs font-medium', color)}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Per-file results */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
                  {results.map((r, i) => (
                    <div key={`result-${i}`} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-secondary">
                      <StatusIcon status={r.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{r.fileName}</span>
                          {r.name && <span className="text-xs text-muted-foreground">→ {r.name}</span>}
                        </div>
                        {r.reason && <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={clearAll}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import more
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
