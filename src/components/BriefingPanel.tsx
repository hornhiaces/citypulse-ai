import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useMode } from '@/lib/modeContext';
import { sampleBriefingQuestions } from '@/lib/mockData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const mockResponses: Record<string, string> = {
  'Where should Montgomery prioritize public safety resources?': `## Public Safety Resource Priority Analysis

### Summary
Based on analysis of 911 call data, 311 service requests, and district intelligence scores, Montgomery should prioritize public safety resources in **Districts 1, 2, and 5**.

### Key Findings
- **District 5 (Chisholm)** shows the highest convergence of risk signals: HIGH public safety pressure, RISING emergency demand (+18% MoM), and DECLINING citizen confidence
- **District 1 (Downtown Core)** has elevated emergency call volumes correlating with high economic activity zones — suggesting resource strain during business hours
- **District 2 (Capitol Heights)** shows RISING emergency demand with declining community confidence metrics

### Supporting Data Signals
- 911 call volume in District 5: 3,100 calls/month (+18% MoM)
- District 1 emergency response time: 5.8 min (above 4.2 min city average)
- Unresolved 311 complaints in priority districts: 847 active requests

### Recommended Actions
1. Increase patrol allocation to District 5 during peak hours (6PM-2AM)
2. Deploy community liaison officers in Districts 2 and 5
3. Establish a joint operations center for Districts 1-2 coordination

### Confidence Statement
**89% confidence** — Analysis based on 18,432 emergency calls, 2,847 service requests, and 9-district intelligence scoring model.`,

  'What issues are most common in my district?': `## Community Issues Overview

### Summary
The most common issues reported across Montgomery neighborhoods involve **road infrastructure, street lighting, and water/sewer services**. Here's what residents are experiencing.

### Key Findings
- **Potholes & Road Damage** is the #1 reported issue citywide (487 reports, 17.1% of all requests)
- **Street Lighting** concerns rank second (412 reports), particularly in Districts 2, 5, and 8
- **Water & Sewer** issues are concentrated in older infrastructure zones (Districts 1, 5, 8)

### What This Means for You
Your neighborhood's most pressing concerns depend on your district, but city-wide trends show:
- Road conditions are being addressed with a 73.4% resolution rate
- Average resolution time has improved by 12% to 6.3 days
- The city has resolved 1,923 community issues in the last 30 days

### How the City is Responding
- Road repair crews have been expanded in high-priority districts
- Street lighting upgrades are scheduled for Districts 2 and 5
- A new water infrastructure assessment program has begun

### Confidence Statement
Based on 2,847 active service requests and historical resolution data.`,
};

export function BriefingPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { mode, isLeadership } = useMode();

  const questions = isLeadership ? sampleBriefingQuestions.leadership : sampleBriefingQuestions.citizen;

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1500));

    const response = mockResponses[text] || `## Analysis: ${text}\n\n### Summary\nBased on Montgomery's municipal datasets, here is the intelligence assessment for your query.\n\n### Key Findings\n- District-level analysis shows varying signal patterns across the 9 monitored zones\n- Current data indicates operational attention needed in Districts 1, 2, 5, and 8\n- Signal convergence detected between 311 complaint patterns and emergency demand trends\n\n### Supporting Signals\n- 2,847 active 311 service requests\n- 18,432 emergency calls in the last 30 days\n- 12,891 active business licenses citywide\n\n### Recommended Actions\n1. Review district-specific intelligence scores for detailed breakdown\n2. Cross-reference with the geospatial intelligence map for spatial patterns\n3. Monitor trend indicators for emerging pressure points\n\n### Confidence Statement\n**76% confidence** — Based on available municipal datasets and signal correlation analysis.`;

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="glass-card flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <div className="p-1.5 rounded-lg bg-primary/10 h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
                  : 'prose prose-sm prose-invert max-w-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line" 
                       dangerouslySetInnerHTML={{ __html: msg.content.replace(/## (.*)/g, '<h3 class="text-sm font-bold text-foreground mt-3 mb-1">$1</h3>').replace(/### (.*)/g, '<h4 class="text-xs font-semibold text-foreground mt-2 mb-1">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>').replace(/^- (.*)/gm, '<li class="ml-3 text-muted-foreground">$1</li>').replace(/^\d+\. (.*)/gm, '<li class="ml-3 text-muted-foreground list-decimal">$1</li>') }} />
                ) : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="p-1.5 rounded-lg bg-secondary h-fit">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
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
