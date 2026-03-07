import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Auto-detect dataset type from CSV column headers
const HEADER_SIGNATURES: Record<string, string[]> = {
  "311": ["request_id", "requestid", "request_type", "requesttype", "department", "district", "create_date", "createdate"],
  "911": ["call_category", "callcategory", "call_count", "callcount", "phone_service_provider", "call_origin", "callorigin", "fid"],
  "business_licenses": ["paccnumber", "pacc_number", "custcompany_name", "custcompanyname", "pvnumber", "pv_number", "pvexpire", "pv_expire", "scname", "sc_name"],
};

function detectDataset(columns: string[]): string | null {
  const lower = columns.map(c => c.toLowerCase().replace(/[\s_-]+/g, "_").trim());
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [dataset, sigs] of Object.entries(HEADER_SIGNATURES)) {
    const score = sigs.filter(s => lower.some(c => c.includes(s.replace(/_/g, "")) || c.includes(s))).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dataset;
    }
  }
  return bestScore >= 2 ? bestMatch : null;
}

interface IngestPayload {
  dataset?: "311" | "911" | "business_licenses";
  columns?: string[];
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

    const body = (await req.json()) as IngestPayload;
    let dataset = body.dataset;
    const records = body.records;

    if (!records?.length) {
      return new Response(JSON.stringify({ error: "No records provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-detect if not specified
    if (!dataset) {
      const columns = body.columns || Object.keys(records[0]);
      const detected = detectDataset(columns);
      if (!detected) {
        return new Response(JSON.stringify({ error: "Could not auto-detect dataset type from headers", columns }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      dataset = detected as "311" | "911" | "business_licenses";
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    if (dataset === "311") {
      const cleaned = records.map((r: any) => ({
        case_id: r.case_id || r.CaseID || r.caseid || r.CASE_ID || null,
        category: r.category || r.Category || r.CATEGORY || "Other",
        subcategory: r.subcategory || r.Subcategory || r.SUBCATEGORY || null,
        description: r.description || r.Description || r.DESCRIPTION || null,
        status: normalizeStatus(r.status || r.Status || r.STATUS),
        priority: normalizePriority(r.priority || r.Priority || r.PRIORITY),
        district: parseDistrict(r.district || r.District || r.DISTRICT),
        address: r.address || r.Address || r.ADDRESS || null,
        latitude: parseFloat(r.latitude || r.Latitude || r.LATITUDE) || null,
        longitude: parseFloat(r.longitude || r.Longitude || r.LONGITUDE) || null,
        created_date: r.created_date || r.CreatedDate || r.created || r.CREATED_DATE || new Date().toISOString(),
        resolved_date: r.resolved_date || r.ResolvedDate || r.RESOLVED_DATE || null,
        resolution_days: parseInt(r.resolution_days || r.ResolutionDays || r.RESOLUTION_DAYS) || null,
        source: r.source || r.Source || r.SOURCE || "import",
      }));

      const { data, error } = await supabase
        .from("service_requests_311")
        .upsert(cleaned, { onConflict: "case_id", ignoreDuplicates: false })
        .select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    if (dataset === "911") {
      const cleaned = records.map((r: any) => ({
        month: r.month || r.Month || r.MONTH,
        year: parseInt(r.year || r.Year || r.YEAR),
        district: parseDistrict(r.district || r.District || r.DISTRICT),
        call_type: r.call_type || r.CallType || r.CALL_TYPE || "All",
        call_count: parseInt(r.call_count || r.CallCount || r.CALL_COUNT) || 0,
        avg_response_minutes: parseFloat(r.avg_response_minutes || r.AvgResponse || r.AVG_RESPONSE_MINUTES) || null,
        priority_1_count: parseInt(r.priority_1_count || r.P1 || r.PRIORITY_1_COUNT) || 0,
        priority_2_count: parseInt(r.priority_2_count || r.P2 || r.PRIORITY_2_COUNT) || 0,
        priority_3_count: parseInt(r.priority_3_count || r.P3 || r.PRIORITY_3_COUNT) || 0,
        change_pct: parseFloat(r.change_pct || r.ChangePct || r.CHANGE_PCT) || 0,
      }));

      const { data, error } = await supabase
        .from("calls_911_monthly")
        .upsert(cleaned, { onConflict: "month,year,district,call_type", ignoreDuplicates: false })
        .select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    if (dataset === "business_licenses") {
      const cleaned = records.map((r: any) => ({
        license_number: r.license_number || r.LicenseNumber || r.LICENSE_NUMBER || null,
        business_name: r.business_name || r.BusinessName || r.BUSINESS_NAME || "Unknown",
        business_type: r.business_type || r.BusinessType || r.BUSINESS_TYPE || null,
        category: r.category || r.Category || r.CATEGORY || null,
        district: parseDistrict(r.district || r.District || r.DISTRICT),
        address: r.address || r.Address || r.ADDRESS || null,
        latitude: parseFloat(r.latitude || r.Latitude || r.LATITUDE) || null,
        longitude: parseFloat(r.longitude || r.Longitude || r.LONGITUDE) || null,
        status: r.status || r.Status || r.STATUS || "active",
        issue_date: r.issue_date || r.IssueDate || r.ISSUE_DATE || null,
        expiry_date: r.expiry_date || r.ExpiryDate || r.EXPIRY_DATE || null,
      }));

      const { data, error } = await supabase
        .from("business_licenses")
        .upsert(cleaned, { onConflict: "license_number", ignoreDuplicates: false })
        .select("id");
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
      JSON.stringify({ success: true, dataset, inserted, errors }),
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
