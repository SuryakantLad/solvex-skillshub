'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STARTER_PROMPTS = [
  'Find senior React developers with 5+ years experience',
  'Show me available backend engineers who know Python and AWS',
  'Who are our top machine learning experts?',
  'Find full-stack developers with TypeScript experience',
];

function CandidateChip({ candidate }) {
  return (
    <div className="inline-flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 text-sm">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
        {(candidate.name ?? '?')[0]}
      </div>
      <div className="min-w-0">
        <p className="font-medium truncate leading-none">{candidate.name}</p>
        <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
      </div>
      {candidate.availability?.isAvailable && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Available" />
      )}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isAI = msg.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isAI ? 'items-start' : 'items-start flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white',
        isAI
          ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
          : 'bg-gradient-to-br from-slate-500 to-slate-700'
      )}>
        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      <div className={cn('flex flex-col gap-2 max-w-[75%]', isAI ? 'items-start' : 'items-end')}>
        {/* Text bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm',
          isAI
            ? 'bg-secondary text-foreground rounded-tl-sm'
            : 'bg-primary text-primary-foreground rounded-tr-sm'
        )}>
          {msg.content}
        </div>

        {/* Candidate results */}
        {isAI && msg.searchResults && msg.searchResults.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.searchResults.slice(0, 8).map((c) => (
              <CandidateChip key={c._id} candidate={c} />
            ))}
            {msg.searchResults.length > 8 && (
              <span className="text-xs text-muted-foreground px-2 py-2">
                +{msg.searchResults.length - 8} more
              </span>
            )}
          </div>
        )}

        {/* Follow-up suggestions */}
        {isAI && msg.followUpSuggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.followUpSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => msg.onSuggestion?.(s)}
                className="flex items-center gap-1 text-xs bg-background border border-border rounded-full px-3 py-1 hover:border-primary/40 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCandidates, setCurrentCandidates] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/search/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history, currentCandidates }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (data.searchResults) setCurrentCandidates(data.searchResults);

      const aiMsg = {
        role: 'assistant',
        content: data.message,
        searchResults: data.searchResults,
        followUpSuggestions: data.followUpSuggestions,
        onSuggestion: sendMessage,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, currentCandidates]);

  function reset() {
    setMessages([]);
    setCurrentCandidates([]);
    setInput('');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="shrink-0 mb-4">
        <PageHeader
          title="AI Chat Search"
          description="Find candidates through natural conversation."
          action={
            messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                New chat
              </Button>
            )
          }
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">TalentGraph AI</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Search your talent pool using plain English. I remember the context as you refine.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-sm bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 rounded-xl px-4 py-3 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble key={`msg-${i}`} msg={{ ...msg, onSuggestion: sendMessage }} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-border mt-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about your talent pool…"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by Gemini 2.5 Flash · Context is maintained within this session
        </p>
      </div>
    </div>
  );
}
