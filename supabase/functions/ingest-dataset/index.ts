import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins - Configure for your deployment
const ALLOWED_ORIGINS = [
  "https://citypulse-ai.vercel.app",
  "https://montgomery-safecity.gov",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed =>
    allowed === origin || (allowed.includes("*") && origin.includes(allowed.split("*")[0]))
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

// Rate limiting store (simple in-memory - consider using Deno KV for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  clientId: string,
  maxRequests = 100,
  windowMs = 3600000 // 1 hour
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

function getClientId(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("authorization") || "anonymous";
}

// Auto-detect dataset type from CSV column headers
const HEADER_SIGNATURES: Record<string, string[]> = {
  "311": ["case_id", "caseid", "sr_number", "service_request", "subcategory", "resolution_days"],
  "911": ["call_count", "callcount", "avg_response", "priority_1", "priority_2", "priority_3", "call_type", "calltype"],
  "business_licenses": ["license_number", "licensenumber", "business_name", "businessname", "business_type", "businesstype", "expiry_date", "expirydate"],
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

// Normalize month values to 3-letter abbreviations (Jan, Feb, Mar, ...)
const MONTH_MAP: Record<string, string> = {
  "1": "Jan", "01": "Jan", "jan": "Jan", "january": "Jan",
  "2": "Feb", "02": "Feb", "feb": "Feb", "february": "Feb",
  "3": "Mar", "03": "Mar", "mar": "Mar", "march": "Mar",
  "4": "Apr", "04": "Apr", "apr": "Apr", "april": "Apr",
  "5": "May", "05": "May", "may": "May",
  "6": "Jun", "06": "Jun", "jun": "Jun", "june": "Jun",
  "7": "Jul", "07": "Jul", "jul": "Jul", "july": "Jul",
  "8": "Aug", "08": "Aug", "aug": "Aug", "august": "Aug",
  "9": "Sep", "09": "Sep", "sep": "Sep", "september": "Sep",
  "10": "Oct", "oct": "Oct", "october": "Oct",
  "11": "Nov", "nov": "Nov", "november": "Nov",
  "12": "Dec", "dec": "Dec", "december": "Dec",
};

function normalizeMonth(m: unknown): string {
  if (!m) return "Jan";
  const key = String(m).toLowerCase().trim();
  return MONTH_MAP[key] || String(m).slice(0, 3).replace(/^(.)/, c => c.toUpperCase());
}

interface IngestPayload {
  dataset?: "311" | "911" | "business_licenses";
  columns?: string[];
  records: Record<string, unknown>[];
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limiting
    const clientId = getClientId(req);
    const rateLimit = checkRateLimit(clientId, 100, 3600000);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    // Validate Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate request size (10MB max)
    const contentLength = req.headers.get("content-length");
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum 10MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json()) as IngestPayload;
    let dataset = body.dataset;
    const records = body.records;

    // Validate records is an array
    if (!Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: "records must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit records per request
    const maxRecords = 10000;
    if (records.length > maxRecords) {
      return new Response(
        JSON.stringify({ error: `Maximum ${maxRecords} records per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    let upserted = 0;
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
      else upserted = data.length;
    }

    if (dataset === "911") {
      const cleaned = records.map((r: any) => ({
        month: normalizeMonth(r.month || r.Month || r.MONTH),
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
      else upserted = data.length;
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
      else upserted = data.length;
    }

    // Update dataset catalog — use upsert to handle missing rows,
    // and pass this chunk's count so the frontend can accumulate totals
    const catalogName = dataset === "311" ? "311 Service Requests" : dataset === "911" ? "911 Emergency Calls" : "Business Licenses";
    await supabase
      .from("dataset_catalog")
      .update({ last_ingested_at: new Date().toISOString(), status: errors.length ? "error" : "complete" })
      .eq("name", catalogName);

    return new Response(
      JSON.stringify({ success: true, dataset, inserted: upserted, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Log full error internally for debugging
    console.error("Ingest error:", {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      clientId: getClientId(req),
    });

    // Return generic error to client
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function normalizeStatus(s: string | undefined): string {
  if (!s) return "open";
  const lower = s.toLowerCase().trim();
  if (lower.includes("close")) return "closed";
  if (lower.includes("resolve") || lower.includes("complete")) return "resolved";
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
