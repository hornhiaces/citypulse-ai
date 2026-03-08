# Security Fixes Implementation Guide

This guide provides step-by-step code fixes for all vulnerabilities found in the security audit.

---

## 1. Fix .gitignore (CRITICAL - 2 minutes)

### File: `.gitignore`

**Current:**
```
# Logs
logs
*.log
npm-debug.log*
...
# Editor directories and files
.vscode/*
```

**Add these lines at the end:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env*.local

# Supabase
.supabase/secrets.json
```

---

## 2. Rotate Supabase Credentials (CRITICAL - 5 minutes)

### Steps in Supabase Dashboard:

1. Go to: **Settings → API**
2. Under "Project API Keys":
   - Click **Rotate** on the anon key
   - Click **Rotate** on the service role key
3. Copy new keys
4. Update `.env`:
```env
VITE_SUPABASE_PROJECT_ID="zliaiwjmlznjdkxudtfh"
VITE_SUPABASE_PUBLISHABLE_KEY="<NEW_ANON_KEY>"
VITE_SUPABASE_URL="https://zliaiwjmlznjdkxudtfh.supabase.co"
```

5. Create new `.env.example` (without secrets):
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
VITE_SUPABASE_URL="your_supabase_url"
```

---

## 3. Remove .env from Git History (CRITICAL - 10 minutes)

### Option A: Using BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
npm install -g bfg

# Clone a fresh copy to work on
git clone --mirror https://github.com/hornhiaces/citypulse-ai.git citypulse-ai.git

# Remove .env from all history
cd citypulse-ai.git
bfg --delete-files .env

# Refpack to clean up
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Update original repo
cd ..
git push https://github.com/hornhiaces/citypulse-ai.git +refs/heads/*:refs/heads/* +refs/tags/*:refs/tags/*
```

### Option B: Using git filter-branch

```bash
# Remove .env from all commits
git filter-branch --tree-filter 'rm -f .env' --prune-empty -f HEAD

# Remove from all branches
for branch in $(git branch -r | grep -v HEAD); do
  git filter-branch --tree-filter 'rm -f .env' --prune-empty -f $branch
done

# Force push all branches
git push origin --force --all
git push origin --force --tags
```

---

## 4. Fix CORS in All Edge Functions (HIGH - 15 minutes)

### File: `supabase/functions/ai-briefing/index.ts`

**Current (Lines 4-7):**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

**Replace with:**
```typescript
// Configure allowed origins
const ALLOWED_ORIGINS = [
  "https://citypulse-ai.vercel.app",
  "https://montgomery-safecity.gov", // Add your production domain
  // Localhost for development - only if needed
  // "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ... rest of function
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Apply the same fix to:**
- `supabase/functions/generate-embeddings/index.ts`
- `supabase/functions/ingest-dataset/index.ts`
- `supabase/functions/compute-scores/index.ts` (if exists)

---

## 5. Add Input Validation to CSV Upload (HIGH - 20 minutes)

### File: `supabase/functions/ingest-dataset/index.ts`

**Add validation functions before `serve()`:**

```typescript
// Validation helper functions
const MAX_STRING_LENGTH = 10000;
const MAX_RECORDS = 10000;

interface ValidatedRecord {
  [key: string]: any;
}

function validateRecordFor311(record: any): ValidatedRecord {
  return {
    case_id: validateString(record.case_id, 50),
    category: validateString(record.category || "Other", 100),
    subcategory: validateString(record.subcategory, 100),
    description: validateString(record.description, 5000),
    status: validateEnum(record.status, ["open", "closed", "resolved", "in_progress"]),
    priority: validateEnum(record.priority, ["low", "medium", "high"]),
    district: validateDistrict(record.district),
    address: validateString(record.address, 500),
    latitude: validateLatitude(record.latitude),
    longitude: validateLongitude(record.longitude),
    created_date: validateDate(record.created_date) || new Date().toISOString(),
    resolved_date: validateDate(record.resolved_date),
    resolution_days: validateNumber(record.resolution_days, 0, 10000),
    source: validateString(record.source || "import", 50),
  };
}

function validateRecordFor911(record: any): ValidatedRecord {
  return {
    month: validateMonth(record.month),
    year: validateNumber(record.year, 2000, new Date().getFullYear()),
    district: validateDistrict(record.district),
    call_type: validateString(record.call_type || "All", 50),
    call_count: validateNumber(record.call_count, 0, 100000),
    avg_response_minutes: validateNumber(record.avg_response_minutes, 0, 120),
    priority_1_count: validateNumber(record.priority_1_count, 0, 100000),
    priority_2_count: validateNumber(record.priority_2_count, 0, 100000),
    priority_3_count: validateNumber(record.priority_3_count, 0, 100000),
    change_pct: validateNumber(record.change_pct, -100, 100),
  };
}

function validateRecordForBusinessLicenses(record: any): ValidatedRecord {
  return {
    license_number: validateString(record.license_number, 50, true),
    business_name: validateString(record.business_name || "Unknown", 200),
    business_type: validateString(record.business_type, 100),
    category: validateString(record.category, 100),
    district: validateDistrict(record.district),
    address: validateString(record.address, 500),
    latitude: validateLatitude(record.latitude),
    longitude: validateLongitude(record.longitude),
    status: validateEnum(record.status, ["active", "expired", "suspended", "revoked"]),
    issue_date: validateDate(record.issue_date),
    expiry_date: validateDate(record.expiry_date),
  };
}

// Validation utility functions
function validateString(value: unknown, maxLength: number, required = false): string | null {
  if (!value) {
    return required ? null : null;
  }
  const str = String(value).trim();
  if (str.length > maxLength) {
    throw new Error(`String exceeds maximum length of ${maxLength}`);
  }
  return str.length > 0 ? str : null;
}

function validateNumber(value: unknown, min: number, max: number): number | null {
  if (!value) return null;
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  if (num < min || num > max) {
    throw new Error(`Number ${num} out of range [${min}, ${max}]`);
  }
  return num;
}

function validateEnum(value: unknown, allowed: string[]): string {
  const str = String(value).toLowerCase();
  if (!allowed.includes(str)) {
    throw new Error(`Invalid value: ${value}. Must be one of: ${allowed.join(", ")}`);
  }
  return str;
}

function validateDistrict(value: unknown): number | null {
  if (!value) return null;
  const num = parseInt(String(value).replace(/\D/g, ""));
  if (isNaN(num) || num < 1 || num > 9) {
    throw new Error(`Invalid district: ${value}. Must be 1-9`);
  }
  return num;
}

function validateLatitude(value: unknown): number | null {
  if (!value) return null;
  const num = Number(value);
  if (isNaN(num) || num < -90 || num > 90) {
    throw new Error(`Invalid latitude: ${value}. Must be between -90 and 90`);
  }
  return num;
}

function validateLongitude(value: unknown): number | null {
  if (!value) return null;
  const num = Number(value);
  if (isNaN(num) || num < -180 || num > 180) {
    throw new Error(`Invalid longitude: ${value}. Must be between -180 and 180`);
  }
  return num;
}

function validateMonth(value: unknown): string {
  if (!value) return "Jan";
  const str = String(value).toLowerCase();
  const monthNum = parseInt(str);

  const monthMap: Record<string, string> = {
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

  return monthMap[str] || monthMap[String(monthNum)] || "Jan";
}

function validateDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date.toISOString();
}
```

**Update the ingest handler (around line 96-120):**

```typescript
if (dataset === "311") {
  const cleaned = records.map((r: any) => {
    try {
      return validateRecordFor311(r);
    } catch (e) {
      errors.push(`Row validation error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }).filter(Boolean);

  if (cleaned.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid records found after validation", errors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabase
    .from("service_requests_311")
    .upsert(cleaned, { onConflict: "case_id", ignoreDuplicates: false })
    .select("id");
  if (error) errors.push(error.message);
  else upserted = data.length;
}
```

---

## 6. Add Content-Type & Size Validation (MODERATE - 10 minutes)

### File: `supabase/functions/ingest-dataset/index.ts`

**Add at the beginning of `serve()` handler (after OPTIONS check):**

```typescript
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Parse and validate body
    const body = (await req.json()) as IngestPayload;
    const records = body.records || [];

    if (!Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: "records must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (records.length > MAX_RECORDS) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_RECORDS} records per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ... rest of handler
  } catch (err) {
    // ... error handler
  }
});
```

---

## 7. Add Rate Limiting (MODERATE - 15 minutes)

### File: `supabase/functions/ingest-dataset/index.ts`

**Add before `serve()` declaration:**

```typescript
// Simple in-memory rate limiter (Deno KV would be better for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  clientId: string,
  maxRequests = 100,
  windowMs = 3600000 // 1 hour
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Get client ID from request (IP or auth header)
function getClientId(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("authorization") || "anonymous";
}
```

**Use in handler:**

```typescript
serve(async (req) => {
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
          "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    // ... rest of handler
  } catch (err) {
    // ...
  }
});
```

---

## 8. Secure Error Handling (MODERATE - 10 minutes)

### All Edge Functions

**Current pattern:**
```typescript
return new Response(
  JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

**Replace with:**
```typescript
// Log full error internally
console.error("Internal error:", {
  timestamp: new Date().toISOString(),
  error: e instanceof Error ? e.message : String(e),
  stack: e instanceof Error ? e.stack : undefined,
  clientId: getClientId(req),
});

// Return generic error to client
return new Response(
  JSON.stringify({ error: "An error occurred processing your request. Please try again later." }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

---

## 9. Fix npm Vulnerabilities (HIGH - 5 minutes)

### Command:

```bash
# Fix non-breaking vulnerabilities
npm audit fix

# For breaking changes, update individually
npm update react-router-dom --save
npm update rollup --save
npm update lodash --save
npm update js-yaml --save

# Verify
npm audit
```

---

## 10. Add RLS Policies in Supabase (MODERATE - 20 minutes)

### Steps in Supabase Dashboard:

1. Go to **SQL Editor**
2. Create new query
3. Paste and run:

```sql
-- Enable RLS on all tables
ALTER TABLE public.district_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_311 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls_911_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (but not modify) all public data
CREATE POLICY "read_all_public_data" ON public.district_scores
  FOR SELECT USING (true);

CREATE POLICY "read_all_public_data" ON public.service_requests_311
  FOR SELECT USING (true);

CREATE POLICY "read_all_public_data" ON public.calls_911_monthly
  FOR SELECT USING (true);

CREATE POLICY "read_all_public_data" ON public.business_licenses
  FOR SELECT USING (true);

-- Only allow logging queries
CREATE POLICY "insert_query_logs" ON public.ai_query_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create service role for data ingestion
CREATE ROLE ingestion_role NOINHERIT;
GRANT USAGE ON SCHEMA public TO ingestion_role;
GRANT INSERT, UPDATE ON public.service_requests_311 TO ingestion_role;
GRANT INSERT, UPDATE ON public.calls_911_monthly TO ingestion_role;
GRANT INSERT, UPDATE ON public.business_licenses TO ingestion_role;
GRANT INSERT ON public.ai_query_logs TO ingestion_role;
```

---

## 11. Secure Logging (MODERATE - 10 minutes)

### File: `supabase/functions/ai-briefing/index.ts`

**Current (Line 167-170):**
```typescript
// Log query
supabase.from("ai_query_logs").insert({
  query,
  mode: mode || "leadership",
}).then(() => {});
```

**Replace with:**
```typescript
// Log query only if authenticated (extract from auth header)
const authHeader = req.headers.get("authorization");
if (authHeader) {
  try {
    const token = authHeader.replace("Bearer ", "");
    // Verify token with Supabase
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      await supabase.from("ai_query_logs").insert({
        user_id: user.id,
        query: query.substring(0, 1000), // Limit query length
        mode: mode || "leadership",
        timestamp: new Date().toISOString(),
        ip_address: getClientId(req),
      }).then(() => {}).catch((err) => {
        console.error("Failed to log query:", err);
      });
    }
  } catch (e) {
    // Silently fail - don't break the response if logging fails
    console.error("Auth check failed:", e);
  }
}
```

---

## 12. Security Headers for Frontend

### For Vercel Deployment

**File: `vercel.json`** (create if doesn't exist)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://*.supabase.co https://ai.gateway.lovable.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
```

---

## Implementation Checklist

- [ ] Fix .gitignore
- [ ] Rotate Supabase credentials
- [ ] Remove .env from git history
- [ ] Fix CORS in all edge functions
- [ ] Add input validation to CSV upload
- [ ] Add content-type & size validation
- [ ] Add rate limiting
- [ ] Fix error handling
- [ ] Run npm audit fix
- [ ] Add RLS policies
- [ ] Secure query logging
- [ ] Add security headers
- [ ] Test all changes
- [ ] Deploy to production
- [ ] Monitor for suspicious activity

---

## Testing Commands

```bash
# Test after .env fix
grep -r "VITE_SUPABASE_PUBLISHABLE_KEY" .env 2>/dev/null || echo "✓ No hardcoded keys in .env"

# Test CORS
curl -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://your-edge-function.com/ai-briefing

# Test rate limiting
for i in {1..150}; do
  curl -s https://your-edge-function.com/ingest-dataset -o /dev/null -w "%{http_code}\n"
done

# Audit npm
npm audit

# Check git for secrets
git log -p | grep -i "password\|secret\|token" || echo "✓ No secrets in git history"
```

---

## Production Deployment Checklist

Before deploying to production:

1. ✅ All credentials rotated
2. ✅ All code fixes applied
3. ✅ npm audit shows 0 high-severity vulnerabilities
4. ✅ .env is in .gitignore
5. ✅ CORS is properly configured
6. ✅ Rate limiting is enabled
7. ✅ RLS policies are in place
8. ✅ Security headers are configured
9. ✅ Error handling is secure
10. ✅ Logging is authenticated

---

*Implementation Guide Created: 2026-03-08*
*Expected Implementation Time: 2-3 hours*
