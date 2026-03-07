import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IngestPayload {
  dataset: "311" | "911" | "business_licenses";
  records: Record<string, unknown>[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { dataset, records } = (await req.json()) as IngestPayload;

    if (!dataset || !records?.length) {
      return new Response(JSON.stringify({ error: "Missing dataset or records" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let inserted = 0;
    let errors: string[] = [];

    if (dataset === "311") {
      const cleaned = records.map((r: any) => ({
        case_id: r.case_id || r.CaseID || null,
        category: r.category || r.Category || "Other",
        subcategory: r.subcategory || r.Subcategory || null,
        description: r.description || r.Description || null,
        status: normalizeStatus(r.status || r.Status),
        priority: normalizePriority(r.priority || r.Priority),
        district: parseDistrict(r.district || r.District),
        address: r.address || r.Address || null,
        latitude: parseFloat(r.latitude || r.Latitude) || null,
        longitude: parseFloat(r.longitude || r.Longitude) || null,
        created_date: r.created_date || r.CreatedDate || new Date().toISOString(),
        resolved_date: r.resolved_date || r.ResolvedDate || null,
        resolution_days: parseInt(r.resolution_days || r.ResolutionDays) || null,
        source: r.source || r.Source || "import",
      }));

      const { data, error } = await supabase.from("service_requests_311").insert(cleaned).select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    if (dataset === "911") {
      const cleaned = records.map((r: any) => ({
        month: r.month || r.Month,
        year: parseInt(r.year || r.Year),
        district: parseDistrict(r.district || r.District),
        call_type: r.call_type || r.CallType || "All",
        call_count: parseInt(r.call_count || r.CallCount) || 0,
        avg_response_minutes: parseFloat(r.avg_response_minutes || r.AvgResponse) || null,
        priority_1_count: parseInt(r.priority_1_count || r.P1) || 0,
        priority_2_count: parseInt(r.priority_2_count || r.P2) || 0,
        priority_3_count: parseInt(r.priority_3_count || r.P3) || 0,
        change_pct: parseFloat(r.change_pct || r.ChangePct) || 0,
      }));

      const { data, error } = await supabase.from("calls_911_monthly").insert(cleaned).select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    if (dataset === "business_licenses") {
      const cleaned = records.map((r: any) => ({
        license_number: r.license_number || r.LicenseNumber || null,
        business_name: r.business_name || r.BusinessName || "Unknown",
        business_type: r.business_type || r.BusinessType || null,
        category: r.category || r.Category || null,
        district: parseDistrict(r.district || r.District),
        address: r.address || r.Address || null,
        latitude: parseFloat(r.latitude || r.Latitude) || null,
        longitude: parseFloat(r.longitude || r.Longitude) || null,
        status: r.status || r.Status || "active",
        issue_date: r.issue_date || r.IssueDate || null,
        expiry_date: r.expiry_date || r.ExpiryDate || null,
      }));

      const { data, error } = await supabase.from("business_licenses").insert(cleaned).select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    // Update dataset catalog
    const catalogName = dataset === "311" ? "311 Service Requests" : dataset === "911" ? "911 Emergency Calls" : "Business Licenses";
    await supabase
      .from("dataset_catalog")
      .update({ record_count: inserted, last_ingested_at: new Date().toISOString(), status: errors.length ? "error" : "complete" })
      .eq("name", catalogName);

    return new Response(
      JSON.stringify({ success: true, inserted, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function normalizeStatus(s: string | undefined): string {
  if (!s) return "open";
  const lower = s.toLowerCase().trim();
  if (lower.includes("resolve") || lower.includes("close") || lower.includes("complete")) return "resolved";
  if (lower.includes("progress") || lower.includes("assign")) return "in_progress";
  return "open";
}

function normalizePriority(p: string | undefined): string {
  if (!p) return "medium";
  const lower = p.toLowerCase().trim();
  if (lower.includes("high") || lower.includes("urgent") || lower.includes("critical")) return "high";
  if (lower.includes("low") || lower.includes("minor")) return "low";
  return "medium";
}

function parseDistrict(d: unknown): number | null {
  if (!d) return null;
  const n = parseInt(String(d).replace(/\D/g, ""));
  return isNaN(n) || n < 1 || n > 9 ? null : n;
}
