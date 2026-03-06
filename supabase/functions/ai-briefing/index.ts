import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the latest user message for context retrieval
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const query = lastUserMsg?.content || "";

    // Retrieve relevant context via vector search or fallback to all documents
    let contextDocs: string[] = [];

    // Try embedding-based search first
    try {
      const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: query,
          model: "text-embedding-3-small",
        }),
      });

      if (embResponse.ok) {
        const embData = await embResponse.json();
        const queryEmbedding = embData.data?.[0]?.embedding;

        if (queryEmbedding) {
          // Use RPC for vector similarity search
          const { data: similar, error } = await supabase.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 6,
          });

          if (!error && similar?.length > 0) {
            contextDocs = similar.map((d: any) => d.content);
          }
        }
      }
    } catch (e) {
      console.error("Vector search error, using fallback:", e);
    }

    // Fallback: get all documents if vector search didn't return results
    if (contextDocs.length === 0) {
      const { data: allDocs } = await supabase
        .from("vector_documents")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(10);
      contextDocs = (allDocs || []).map((d: any) => d.content);
    }

    // If still no docs, fetch live data
    if (contextDocs.length === 0) {
      const [{ data: scores }, { data: requests }, { data: calls }] = await Promise.all([
        supabase.from("district_scores").select("*").order("district"),
        supabase.from("service_requests_311").select("category, status, priority, district").limit(100),
        supabase.from("calls_911_monthly").select("*").eq("month", "Mar").eq("year", 2025),
      ]);

      if (scores) contextDocs.push(`District Scores:\n${scores.map(s => `D${s.district} ${s.district_name}: Safety=${s.public_safety_pressure}, Infra=${s.infrastructure_stress}, Emergency=${s.emergency_demand}, Economy=${s.economic_activity}, Confidence=${s.citizen_confidence}, Risk=${s.overall_risk_score}`).join("\n")}`);
      if (requests) contextDocs.push(`311 Requests: ${requests.length} total, ${requests.filter(r => r.status === "open").length} open, ${requests.filter(r => r.priority === "high").length} high priority`);
      if (calls) contextDocs.push(`911 Calls (Mar 2025):\n${calls.map(c => `D${c.district}: ${c.call_count} calls (${(c.change_pct || 0) > 0 ? "+" : ""}${c.change_pct}%)`).join(", ")}`);
    }

    const context = contextDocs.join("\n\n---\n\n");

    const systemPrompt = mode === "citizen"
      ? `You are SafeCity AI, a friendly civic transparency assistant for Montgomery, Alabama. You help citizens understand their city's conditions using real municipal data.

Your role:
- Explain city conditions in clear, non-technical language
- Help citizens understand what's happening in their neighborhoods
- Provide transparent insights about city services and operations
- Be encouraging and solution-oriented

Always structure responses with:
## [Clear Title]
### Summary (1-2 sentences, plain language)
### Key Findings (bullet points citizens can understand)
### What This Means for You (practical implications)
### How the City is Responding (actions being taken)
### Data Sources (brief mention of what data this is based on)

Use the following Montgomery municipal data to answer questions:

${context}`
      : `You are SafeCity AI, an executive intelligence briefing system for Montgomery, Alabama city leadership. You provide strategic operational analysis using real municipal datasets.

Your role:
- Deliver actionable intelligence for city leadership decision-making
- Identify risk patterns, resource allocation needs, and emerging threats
- Cross-reference multiple data signals for operational recommendations
- Provide confidence assessments based on data quality and coverage

Always structure responses with:
## [Strategic Title]
### Summary (executive-level 1-2 sentence assessment)
### Key Findings (data-driven bullet points with specific numbers)
### Supporting Data Signals (cite specific metrics from the datasets)
### Recommended Actions (numbered, actionable operational steps)
### Confidence Statement (percentage + basis of analysis)

Use the following Montgomery municipal intelligence data to answer questions:

${context}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log query
    supabase.from("ai_query_logs").insert({
      query,
      mode: mode || "leadership",
    }).then(() => {});

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Briefing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
