import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, User, Bot, Sparkles, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl, getMatchScoreColor } from '@/lib/utils';
import { chatSearch } from '@/services/searchService';
import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  'Find Python developers available right now',
  'Who has React and Node.js experience?',
  'Show me senior engineers in the Engineering department',
  'Find candidates with machine learning skills',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text = input) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : m.rawText ?? '' }));
      const data = await chatSearch(text, history);
      setMessages((prev) => [...prev, { role: 'assistant', ...data }]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Chat failed');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput('');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="AI Chat Search" description="Have a conversation to find the right talent." />
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />New chat
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Start a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">Ask me to find candidates using natural language</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2.5 rounded-xl text-xs text-left bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`flex-1 max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary rounded-tl-sm'}`}>
                  {typeof msg.content === 'string' ? msg.content : msg.message ?? ''}
                </div>

                {/* Search results */}
                {msg.results?.length > 0 && (
                  <div className="space-y-2 w-full">
                    {msg.results.slice(0, 5).map((r) => (
                      <Link key={r.employee?._id} to={`/hr/directory/${r.employee?._id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-secondary/50 transition-all">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={getAvatarUrl(r.employee?.name)} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{getInitials(r.employee?.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{r.employee?.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.employee?.title}</p>
                          </div>
                          {r.matchScore !== undefined && (
                            <span className={`text-xs font-bold shrink-0 ${getMatchScoreColor(r.matchScore)}`}>{r.matchScore}%</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Follow-up suggestions */}
                {msg.suggestions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)}
                        className="px-2.5 py-1 rounded-full text-[10px] bg-secondary border border-border hover:bg-primary/10 hover:text-primary transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-secondary text-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Input
          placeholder="Ask about candidates, skills, availability…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
