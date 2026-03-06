import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useMode } from '@/lib/modeContext';
import { sampleBriefingQuestions } from '@/lib/mockData';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-briefing`;

async function streamBriefing({
  messages,
  mode,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  mode: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, mode }),
  });

  if (!resp.ok) {
    if (resp.status === 429) {
      onError("Rate limit exceeded. Please wait a moment and try again.");
      return;
    }
    if (resp.status === 402) {
      onError("AI usage limit reached. Please add credits to continue.");
      return;
    }
    const errData = await resp.json().catch(() => ({}));
    onError(errData.error || "Failed to get AI response");
    return;
  }

  if (!resp.body) {
    onError("No response stream");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export function BriefingPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { mode, isLeadership } = useMode();
  const scrollRef = useRef<HTMLDivElement>(null);

  const questions = isLeadership ? sampleBriefingQuestions.leadership : sampleBriefingQuestions.citizen;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamBriefing({
        messages: newMessages,
        mode,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setLoading(false),
        onError: (error) => {
          toast.error(error);
          setLoading(false);
        },
      });
    } catch (e) {
      console.error("Briefing error:", e);
      toast.error("Failed to connect to AI service");
      setLoading(false);
    }
  };

  return (
    <div className="glass-card flex flex-col h-[600px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 rounded-xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {isLeadership ? 'Executive Intelligence Briefing' : 'Ask About Your City'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6">
              {isLeadership
                ? 'Ask strategic questions about Montgomery operations, resource allocation, and risk assessment.'
                : 'Ask questions about your neighborhood, city services, and community conditions.'
              }
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {questions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-xs p-3 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="p-1.5 rounded-lg bg-primary/10 h-fit mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
                  : ''
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground/90 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-xs [&_li]:text-muted-foreground [&_strong]:text-foreground [&_ul]:my-1 [&_ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="p-1.5 rounded-lg bg-secondary h-fit mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Analyzing municipal data...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isLeadership ? 'Ask about city operations...' : 'Ask about your neighborhood...'}
            className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
