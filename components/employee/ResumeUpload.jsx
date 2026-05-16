'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload, FileText, Loader2, CheckCircle2, X, Brain,
  Scan, Sparkles, AlertCircle, RefreshCw, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/resume/utils';

const STEPS = [
  { id: 'read', label: 'Reading PDF document', icon: FileText },
  { id: 'extract', label: 'Extracting text content', icon: Scan },
  { id: 'ai', label: 'Analyzing with Claude AI', icon: Brain },
  { id: 'structure', label: 'Structuring results', icon: Sparkles },
];

// Steps 0 and 1 advance on timer; step 2 waits for the API; step 3 advances after API resolves
const STEP_DELAYS = [700, 500, null, 500];

export default function ResumeUpload({ onParsed }) {
  const [phase, setPhase] = useState('idle'); // idle | ready | parsing | done | error
  const [file, setFile] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!file) { setBlobUrl(null); return; }
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name?.endsWith('.pdf')) {
      toast.error('Only PDF files are supported');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    if (f.size < 512) {
      toast.error('File appears to be empty');
      return;
    }
    setFile(f);
    setPhase('ready');
    setCurrentStep(-1);
    setErrorMsg('');
    setShowPreview(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    accept(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setFile(null);
    setPhase('idle');
    setCurrentStep(-1);
    setErrorMsg('');
    setShowPreview(false);
  };

  const handleParse = async () => {
    if (!file) return;
    setPhase('parsing');
    setCurrentStep(0);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('resume', file);

    // Fire API immediately so it runs concurrently with the step animations
    apiRef.current = fetch('/api/resume/parse', { method: 'POST', body: formData });

    // Animate steps 0 → 1 on timers
    await delay(STEP_DELAYS[0]);
    setCurrentStep(1);
    await delay(STEP_DELAYS[1]);
    setCurrentStep(2); // AI step — holds until API resolves

    try {
      const res = await apiRef.current;
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || 'Failed to parse resume');
        setPhase('error');
        return;
      }

      setCurrentStep(3);
      await delay(STEP_DELAYS[3]);

      setPhase('done');
      toast.success('Resume parsed — review the extracted data below');
      onParsed?.(json.data, json.metadata);
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setPhase('error');
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <DropZone
            key="idle"
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => accept(e.target.files[0])}
            />
            <motion.div
              animate={dragOver ? { scale: 1.08 } : { scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <Upload className={cn('w-8 h-8 transition-colors', dragOver ? 'text-primary' : 'text-primary/70')} />
            </motion.div>
            <p className="font-semibold text-base">
              {dragOver ? 'Release to upload' : 'Drop your resume here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse — PDF format, up to 10MB
            </p>
            <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />PDF only</span>
              <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />Claude AI</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />~15s analysis</span>
            </div>
          </DropZone>
        )}

        {(phase === 'ready' || phase === 'done') && file && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <FileCard
              file={file}
              done={phase === 'done'}
              onRemove={reset}
              onPreview={blobUrl ? () => setShowPreview((v) => !v) : null}
              showPreview={showPreview}
            />

            <AnimatePresence>
              {showPreview && blobUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-b border-border">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">PDF Preview</span>
                    </div>
                    <iframe
                      src={blobUrl}
                      title="Resume preview"
                      className="w-full h-72 block"
                      style={{ border: 'none' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'parsing' && (
          <motion.div
            key="parsing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <FileCard file={file} parsing />
            <ParseSteps currentStep={currentStep} />
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-destructive/25 bg-destructive/5 p-8 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Parsing failed</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{errorMsg}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhase('ready')}
                className="gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                Upload different file
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'ready' && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={handleParse} className="w-full" size="lg">
            <Brain className="w-4 h-4" />
            Parse with Claude AI
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropZone({ children, dragOver, onDragOver, onDragLeave, onDrop, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer select-none',
        dragOver
          ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]'
          : 'border-border hover:border-primary/50 hover:bg-secondary/30'
      )}
    >
      {children}
    </motion.div>
  );
}

function FileCard({ file, done, parsing, onRemove, onPreview, showPreview }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/20">
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
        done ? 'bg-emerald-100 dark:bg-emerald-900/30'
          : parsing ? 'bg-primary/10'
          : 'bg-secondary'
      )}>
        {done
          ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          : parsing
            ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
            : <FileText className="w-5 h-5 text-muted-foreground" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          {done && ' · Parsed successfully'}
          {parsing && ' · Analyzing...'}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onPreview && !parsing && (
          <button
            onClick={onPreview}
            className={cn(
              'p-1.5 rounded-lg transition-colors text-muted-foreground',
              showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-secondary hover:text-foreground'
            )}
            title="Toggle preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {onRemove && !parsing && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ParseSteps({ currentStep }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentStep;
        const active = i === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              i < STEPS.length - 1 && 'border-b border-border',
              active && 'bg-primary/5'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all',
              done ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : active ? 'bg-primary/15'
                : 'bg-secondary'
            )}>
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : active ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
            </div>

            <span className={cn(
              'text-sm flex-1 transition-colors',
              done ? 'text-muted-foreground/60 line-through'
                : active ? 'text-foreground font-medium'
                : 'text-muted-foreground/50'
            )}>
              {step.label}
            </span>

            {active && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-primary font-medium shrink-0"
              >
                {i === 2 ? 'Waiting for Claude...' : 'In progress...'}
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
