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

    // 1. Aggregate 311 data by district
    const { data: requests311 } = await supabase
      .from("service_requests_311")
      .select("district, category, status, priority");

    // 2. Aggregate 911 data by district (latest month)
    const { data: calls911 } = await supabase
      .from("calls_911_monthly")
      .select("district, call_count, change_pct, avg_response_minutes")
      .eq("month", "Mar")
      .eq("year", 2025);

    // 3. Aggregate business licenses by district
    const { data: licenses } = await supabase
      .from("business_licenses")
      .select("district, status");

    // Compute per-district signals
    const districts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const signals: any[] = [];
    const scores: any[] = [];

    for (const d of districts) {
      const d311 = (requests311 || []).filter(r => r.district === d);
      const d911 = (calls911 || []).filter(r => r.district === d);
      const dBiz = (licenses || []).filter(r => r.district === d);

      const openRequests = d311.filter(r => r.status === "open" || r.status === "in_progress").length;
      const highPriority311 = d311.filter(r => r.priority === "high").length;
      const totalCalls = d911.reduce((sum, r) => sum + (r.call_count || 0), 0);
      const callChange = d911.length > 0 ? d911[0].change_pct || 0 : 0;
      const avgResponse = d911.length > 0 ? d911[0].avg_response_minutes || 0 : 0;
      const activeLicenses = dBiz.filter(r => r.status === "active").length;
      const expiredLicenses = dBiz.filter(r => r.status === "expired" || r.status === "suspended").length;

      // Public Safety Pressure: based on 911 volume + change
      const safetyScore = Math.min(100, totalCalls / 5 + callChange * 2);
      const safetyLevel = safetyScore > 60 ? "HIGH" : safetyScore > 30 ? "MEDIUM" : "LOW";

      // Infrastructure Stress: based on 311 open requests + high priority
      const infraScore = Math.min(100, openRequests * 15 + highPriority311 * 20);
      const infraLevel = infraScore > 60 ? "HIGH" : infraScore > 30 ? "MEDIUM" : "LOW";

      // Emergency Demand: based on call change trend
      const emergencyLevel = callChange > 10 ? "RISING" : callChange > -3 ? "STABLE" : "LOW";

      // Economic Activity: based on active licenses
      const econScore = Math.min(100, activeLicenses * 30);
      const econLevel = econScore > 60 ? "STRONG" : econScore > 25 ? "MEDIUM" : "LOW";

      // Citizen Confidence: inverse of unresolved issues + call trends
      const confScore = Math.max(0, 100 - openRequests * 10 - Math.max(0, callChange) * 3);
      const confLevel = confScore > 65 ? "STRONG" : confScore > 35 ? "STABLE" : "DECLINING";

      // Overall risk score
      const riskScore = Math.round(
        safetyScore * 0.3 + infraScore * 0.25 + (callChange > 0 ? callChange * 2 : 0) * 0.2 +
        (100 - econScore) * 0.1 + (100 - confScore) * 0.15
      );

      // Build signals
      signals.push(
        { district: d, signal_type: "public_safety_pressure", signal_value: safetyScore, signal_level: safetyLevel, period: "2025-Q1", metadata: { total_calls: totalCalls, change_pct: callChange } },
        { district: d, signal_type: "infrastructure_stress", signal_value: infraScore, signal_level: infraLevel, period: "2025-Q1", metadata: { open_requests: openRequests, high_priority: highPriority311 } },
        { district: d, signal_type: "emergency_demand", signal_value: callChange, signal_level: emergencyLevel, period: "2025-Q1", metadata: { avg_response: avgResponse } },
        { district: d, signal_type: "economic_activity", signal_value: econScore, signal_level: econLevel, period: "2025-Q1", metadata: { active_licenses: activeLicenses, expired: expiredLicenses } },
        { district: d, signal_type: "citizen_confidence", signal_value: confScore, signal_level: confLevel, period: "2025-Q1", metadata: {} }
      );

      // Get existing district info
      const { data: existing } = await supabase
        .from("district_scores")
        .select("district_name, area, population")
        .eq("district", d)
        .single();

      scores.push({
        district: d,
        district_name: existing?.district_name || `District ${d}`,
        area: existing?.area || "",
        population: existing?.population || 0,
        public_safety_pressure: safetyLevel,
        infrastructure_stress: infraLevel,
        emergency_demand: emergencyLevel,
        economic_activity: econLevel,
        citizen_confidence: confLevel,
        overall_risk_score: riskScore,
      });
    }

    // Clear old computed signals and upsert
    await supabase.from("district_signals").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert new signals
    const { error: sigError } = await supabase.from("district_signals").insert(signals);
    if (sigError) console.error("Signal insert error:", sigError);

    // Upsert scores
    for (const score of scores) {
      await supabase
        .from("district_scores")
        .update({
          public_safety_pressure: score.public_safety_pressure,
          infrastructure_stress: score.infrastructure_stress,
          emergency_demand: score.emergency_demand,
          economic_activity: score.economic_activity,
          citizen_confidence: score.citizen_confidence,
          overall_risk_score: score.overall_risk_score,
        })
        .eq("district", score.district);
    }

    // Generate AI recommendations based on signals
    const recommendations = generateRecommendations(scores);

    return new Response(
      JSON.stringify({ success: true, districts_scored: scores.length, signals_generated: signals.length, recommendations: recommendations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scoring error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRecommendations(scores: any[]) {
  const recs: any[] = [];

  // Find high-risk districts
  const highSafety = scores.filter(s => s.public_safety_pressure === "HIGH");
  const highInfra = scores.filter(s => s.infrastructure_stress === "HIGH");
  const decliningConf = scores.filter(s => s.citizen_confidence === "DECLINING");
  const risingEmergency = scores.filter(s => s.emergency_demand === "RISING");

  if (highSafety.length > 0 && risingEmergency.length > 0) {
    const overlap = highSafety.filter(s => risingEmergency.some(r => r.district === s.district));
    if (overlap.length > 0) {
      recs.push({
        priority: "critical",
        title: `Deploy Additional Public Safety Resources to District${overlap.length > 1 ? "s" : ""} ${overlap.map(s => s.district).join(", ")}`,
        description: `${overlap.map(s => `District ${s.district} (${s.district_name})`).join(" and ")} show${overlap.length === 1 ? "s" : ""} converging signals of high public safety pressure, rising emergency demand, and potential citizen confidence decline.`,
        category: "Public Safety",
        districts: overlap.map(s => s.district),
        signals: ["High 911 call volume", "Rising emergency demand trend", "Elevated public safety pressure score"],
        confidence: 0.89,
      });
    }
  }

  if (highInfra.length > 0) {
    recs.push({
      priority: "critical",
      title: `Infrastructure Emergency Response for District${highInfra.length > 1 ? "s" : ""} ${highInfra.map(s => s.district).join(" & ")}`,
      description: `Infrastructure stress indicators in ${highInfra.map(s => s.district_name).join(" and ")} have reached critical thresholds based on 311 complaint patterns.`,
      category: "Infrastructure",
      districts: highInfra.map(s => s.district),
      signals: ["High open 311 request count", "Multiple high-priority infrastructure complaints", "Infrastructure stress score above threshold"],
      confidence: 0.92,
    });
  }

  if (decliningConf.length > 0) {
    for (const d of decliningConf) {
      if (!highSafety.some(s => s.district === d.district)) {
        recs.push({
          priority: "high",
          title: `Community Engagement Initiative for District ${d.district}`,
          description: `${d.district_name} shows declining citizen confidence. Proactive community engagement could prevent escalation.`,
          category: "Community",
          districts: [d.district],
          signals: ["Declining citizen confidence indicator", "Unresolved service requests", "Community satisfaction below threshold"],
          confidence: 0.78,
        });
      }
    }
  }

  return recs;
}
