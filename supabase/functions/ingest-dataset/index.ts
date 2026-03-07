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
        case_id: r.Request_ID || r.request_id || r.case_id || r.CaseID || r.OBJECTID?.toString() || null,
        category: r.Request_Type || r.request_type || r.category || r.Category || "Other",
        subcategory: r.Department || r.department || r.subcategory || null,
        description: r.Request_Type || r.description || r.Description || null,
        status: normalizeStatus(r.Status || r.status),
        priority: normalizePriority(r.priority || r.Priority),
        district: parseDistrict(r.District || r.district),
        address: r.Address || r.address || null,
        latitude: parseFloat(r.Latitude || r.latitude || r.Y) || null,
        longitude: parseFloat(r.Longitude || r.longitude || r.X) || null,
        created_date: r.Create_Date || r.created_date || r.CreatedDate || new Date().toISOString(),
        resolved_date: r.Close_Date || r.resolved_date || r.ResolvedDate || null,
        resolution_days: parseInt(r.resolution_days || r.ResolutionDays) || null,
        source: r.Origin || r.origin || r.source || "import",
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
        month: r.Month || r.month || "January",
        year: parseInt(r.Year || r.year) || new Date().getFullYear(),
        district: null, // Montgomery 911 data doesn't have district
        call_type: r.Call_Category || r.call_category || r.call_type || "All",
        call_count: parseInt(r.Call_Count_by_Phone_Service_Pro || r.Call_Count_By_Origin || r.call_count) || 0,
        avg_response_minutes: null,
        priority_1_count: 0,
        priority_2_count: 0,
        priority_3_count: 0,
        change_pct: 0,
      }));

      // 911 data lacks district, so just insert (no upsert needed)
      const { data, error } = await supabase
        .from("calls_911_monthly")
        .insert(cleaned)
        .select("id");
      if (error) errors.push(error.message);
      else inserted = data.length;
    }

    if (dataset === "business_licenses") {
      const cleaned = records.map((r: any) => ({
        license_number: r.pvNUMBER || r.pv_number || r.license_number || null,
        business_name: r.custCOMPANY_NAME || r.custcompany_name || r.business_name || "Unknown",
        business_type: r.scNAME || r.sc_name || r.business_type || null,
        category: r.pvrtDESC || r.pvscDESC || r.category || null,
        district: null, // Will need geocoding to assign district
        address: r.Full_Address || r.address || null,
        latitude: parseFloat(r.Y || r.latitude) || null,
        longitude: parseFloat(r.X || r.longitude) || null,
        status: r.pvrtCODE === "EXP" ? "expired" : "active",
        issue_date: r.pvEFFDATE || r.issue_date || null,
        expiry_date: r.pvEXPIRE || r.expiry_date || null,
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
