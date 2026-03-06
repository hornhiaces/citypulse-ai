import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // 1. Gather all data for document generation
    const [{ data: scores }, { data: signals }, { data: requests }, { data: calls }, { data: licenses }, { data: recs }] = await Promise.all([
      supabase.from("district_scores").select("*").order("district"),
      supabase.from("district_signals").select("*").order("district"),
      supabase.from("service_requests_311").select("*"),
      supabase.from("calls_911_monthly").select("*"),
      supabase.from("business_licenses").select("*"),
      supabase.from("ai_recommendations").select("*"),
    ]);

    // 2. Create document chunks for embedding
    const documents: { content: string; metadata: any; source_table: string }[] = [];

    // District overview documents
    for (const score of (scores || [])) {
      const distSignals = (signals || []).filter(s => s.district === score.district);
      const distRequests = (requests || []).filter(r => r.district === score.district);
      const distCalls = (calls || []).filter(c => c.district === score.district);
      const distLicenses = (licenses || []).filter(l => l.district === score.district);

      const doc = `District ${score.district} - ${score.district_name} (${score.area})
Population: ${score.population?.toLocaleString() || "Unknown"}
Public Safety Pressure: ${score.public_safety_pressure} | Infrastructure Stress: ${score.infrastructure_stress}
Emergency Demand: ${score.emergency_demand} | Economic Activity: ${score.economic_activity}
Citizen Confidence: ${score.citizen_confidence} | Overall Risk Score: ${score.overall_risk_score}/100
Active 311 Requests: ${distRequests.filter(r => r.status === "open" || r.status === "in_progress").length}
Total 311 Requests: ${distRequests.length}
High Priority Issues: ${distRequests.filter(r => r.priority === "high").length}
Recent 911 Call Volume: ${distCalls.reduce((s, c) => s + (c.call_count || 0), 0)}
Active Business Licenses: ${distLicenses.filter(l => l.status === "active").length}
Top Issue Categories: ${[...new Set(distRequests.map(r => r.category))].slice(0, 5).join(", ")}`;

      documents.push({ content: doc, metadata: { district: score.district, type: "district_overview" }, source_table: "district_scores" });
    }

    // 311 category summary
    const categoryMap: Record<string, number> = {};
    (requests || []).forEach(r => { categoryMap[r.category] = (categoryMap[r.category] || 0) + 1; });
    const categoryDoc = `Montgomery 311 Service Request Summary
Total Active Requests: ${(requests || []).length}
Open Requests: ${(requests || []).filter(r => r.status === "open").length}
In Progress: ${(requests || []).filter(r => r.status === "in_progress").length}
Resolved: ${(requests || []).filter(r => r.status === "resolved").length}
Category Breakdown:
${Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).map(([cat, count]) => `- ${cat}: ${count} requests (${Math.round(count / (requests || []).length * 100)}%)`).join("\n")}
High Priority Requests: ${(requests || []).filter(r => r.priority === "high").length}
Districts with Most Issues: ${(() => {
  const distMap: Record<number, number> = {};
  (requests || []).forEach(r => { if (r.district) distMap[r.district] = (distMap[r.district] || 0) + 1; });
  return Object.entries(distMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d, c]) => `D${d}(${c})`).join(", ");
})()}`;

    documents.push({ content: categoryDoc, metadata: { type: "311_summary" }, source_table: "service_requests_311" });

    // 911 summary
    const monthGroups: Record<string, number> = {};
    (calls || []).forEach(c => { const key = `${c.month} ${c.year}`; monthGroups[key] = (monthGroups[key] || 0) + (c.call_count || 0); });
    const callDoc = `Montgomery 911 Emergency Call Summary
Monthly Call Volumes:
${Object.entries(monthGroups).map(([m, c]) => `- ${m}: ${c} calls`).join("\n")}
Districts with Highest Call Volume: ${(() => {
  const distMap: Record<number, number> = {};
  (calls || []).filter(c => c.month === "Mar" && c.year === 2025).forEach(c => { if (c.district) distMap[c.district] = (distMap[c.district] || 0) + (c.call_count || 0); });
  return Object.entries(distMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d, c]) => `D${d}(${c} calls)`).join(", ");
})()}
Districts with Rising Trends: ${(calls || []).filter(c => (c.change_pct || 0) > 10 && c.month === "Mar").map(c => `D${c.district}(+${c.change_pct}%)`).join(", ")}
Average Response Time Range: ${(() => {
  const times = (calls || []).filter(c => c.avg_response_minutes).map(c => c.avg_response_minutes!);
  return times.length ? `${Math.min(...times).toFixed(1)} - ${Math.max(...times).toFixed(1)} minutes` : "N/A";
})()}`;

    documents.push({ content: callDoc, metadata: { type: "911_summary" }, source_table: "calls_911_monthly" });

    // Business license summary
    const bizDoc = `Montgomery Business License Summary
Total Licenses: ${(licenses || []).length}
Active: ${(licenses || []).filter(l => l.status === "active").length}
Expired: ${(licenses || []).filter(l => l.status === "expired").length}
Suspended: ${(licenses || []).filter(l => l.status === "suspended").length}
Business Categories: ${[...new Set((licenses || []).map(l => l.category).filter(Boolean))].join(", ")}
Districts with Most Active Businesses: ${(() => {
  const distMap: Record<number, number> = {};
  (licenses || []).filter(l => l.status === "active").forEach(l => { if (l.district) distMap[l.district] = (distMap[l.district] || 0) + 1; });
  return Object.entries(distMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d, c]) => `D${d}(${c})`).join(", ");
})()}`;

    documents.push({ content: bizDoc, metadata: { type: "business_summary" }, source_table: "business_licenses" });

    // Recommendations summary
    if (recs && recs.length > 0) {
      const recDoc = `Montgomery AI Recommendations
Active Recommendations: ${recs.length}
${recs.map(r => `- [${r.priority?.toUpperCase()}] ${r.title}: ${r.description} (Confidence: ${Math.round((r.confidence || 0) * 100)}%, Districts: ${(r.districts || []).join(", ")})`).join("\n")}`;

      documents.push({ content: recDoc, metadata: { type: "recommendations" }, source_table: "ai_recommendations" });
    }

    // 3. Generate embeddings using Lovable AI
    // Clear existing vector documents
    await supabase.from("vector_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    let embedded = 0;
    for (const doc of documents) {
      // Use Lovable AI to get embedding
      const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: doc.content,
          model: "text-embedding-3-small",
        }),
      });

      if (embResponse.ok) {
        const embData = await embResponse.json();
        const embedding = embData.data?.[0]?.embedding;

        if (embedding) {
          const { error } = await supabase.from("vector_documents").insert({
            content: doc.content,
            metadata: doc.metadata,
            embedding: embedding,
            source_table: doc.source_table,
            chunk_index: 0,
          });
          if (!error) embedded++;
          else console.error("Insert error:", error);
        }
      } else {
        const errText = await embResponse.text();
        console.error("Embedding error:", embResponse.status, errText);
        // Fallback: store without embedding
        await supabase.from("vector_documents").insert({
          content: doc.content,
          metadata: doc.metadata,
          source_table: doc.source_table,
          chunk_index: 0,
        });
        embedded++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, documents_created: documents.length, embedded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Embedding error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
