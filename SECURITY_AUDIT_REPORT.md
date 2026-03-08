# Security Audit Report: CityPulse AI

**Date:** March 8, 2026
**Status:** DEPLOYED WITH CRITICAL VULNERABILITIES
**Risk Level:** 🔴 CRITICAL

---

## Executive Summary

The CityPulse AI application has **14 critical to moderate security vulnerabilities** that require immediate attention. The most severe issues are:

1. **Credentials exposed in git repository** (CRITICAL)
2. **Dependency vulnerabilities** including XSS in React Router (HIGH)
3. **Overly permissive CORS** allowing requests from any origin (HIGH)
4. **Missing input validation** on CSV uploads and API endpoints (MODERATE)
5. **Sensitive data logging** without access controls (MODERATE)

---

## Critical Findings

### 1. 🔴 CRITICAL: Hardcoded Secrets in Git Repository

**Location:** `.env` file committed to git history
**Impact:** Supabase credentials are publicly exposed

**Exposed Secrets:**
- `VITE_SUPABASE_PROJECT_ID`: `zliaiwjmlznjdkxudtfh`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: JWT token visible
- `VITE_SUPABASE_URL`: Database connection string

**Evidence:**
```bash
git log shows .env committed in commit 4ba47a1378192be2588f13cbad869f5fc2d34e7b
```

**Risk:**
- Attacker can access your entire Supabase database
- Can read all municipal data (311 requests, 911 calls, business licenses)
- Can modify or delete data
- Can escalate to service role key compromise

**Immediate Actions Required:**
1. ✅ **Rotate all Supabase API keys immediately**
2. ✅ **Remove .env from git history** (use `git filter-branch` or BFG Repo-Cleaner)
3. ✅ **Add .env to .gitignore** (currently missing!)
4. ✅ **Audit Supabase access logs** for unauthorized access

**Fix:**
```bash
# 1. Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 2. Remove from git history (using BFG Repo-Cleaner)
bfg --delete-files .env

# 3. Force push
git push origin --force

# 4. Rotate all keys in Supabase dashboard
# Settings > API > Generate new keys
```

---

### 2. 🔴 CRITICAL: Missing .env in .gitignore

**Location:** `.gitignore`
**Issue:** `.env` file is NOT in the ignore list

**Current .gitignore:**
```
# Does NOT include .env patterns
logs
*.log
node_modules
dist
.vscode
```

**Fix:**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

### 3. 🔴 HIGH: CORS Misconfiguration - Allows All Origins

**Location:** Supabase Edge Functions
- `supabase/functions/ai-briefing/index.ts:5`
- `supabase/functions/generate-embeddings/index.ts:4`
- `supabase/functions/ingest-dataset/index.ts:5`
- `supabase/functions/compute-scores/index.ts` (assumed)

**Current Code:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ❌ DANGEROUS
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Risk:**
- Any website can call your edge functions
- Unauthorized data exfiltration
- DOS attacks (rate limit abuse)
- Credential interception

**Fix:**
```typescript
const ALLOWED_ORIGINS = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(req.headers.get("origin") || "")
    ? (req.headers.get("origin") || "")
    : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};
```

---

### 4. 🔴 HIGH: Dependency Vulnerabilities (npm audit)

**14 vulnerabilities found:**

| Package | Severity | Issue |
|---------|----------|-------|
| @remix-run/router | HIGH | XSS via Open Redirects (CVE) |
| react-router-dom | HIGH | Depends on vulnerable @remix-run/router |
| rollup | HIGH | Arbitrary File Write via Path Traversal |
| glob | HIGH | CLI Command Injection |
| minimatch | HIGH | ReDoS - Multiple variants |
| ajv | MODERATE | ReDoS with $data option |
| esbuild | MODERATE | Unauthorized requests to dev server |
| js-yaml | MODERATE | Prototype Pollution |
| lodash | MODERATE | Prototype Pollution in _.unset |
| @tootallnate/once | HIGH | Control Flow Scoping |

**Fix:**
```bash
# Run audit fix (non-breaking)
npm audit fix

# For breaking changes, update dependencies manually
npm update react-router-dom --save
npm update lodash --save
npm update js-yaml --save
```

---

### 5. 🟠 HIGH: No Input Validation on CSV Upload

**Location:** `supabase/functions/ingest-dataset/index.ts:58-91`

**Issue:** CSV data is ingested without validation:
```typescript
const body = (await req.json()) as IngestPayload;
let dataset = body.dataset;
const records = body.records;

// No validation of:
// - Record field types
// - Field lengths
// - Data ranges
// - Duplicate handling
```

**Risk:**
- Data type confusion attacks
- Buffer overflow via oversized strings
- Invalid coordinates (lat/long) causing calculation errors
- Duplicate key collisions

**Fix:**
```typescript
interface IngestPayload {
  dataset?: "311" | "911" | "business_licenses";
  columns?: string[];
  records: Record<string, unknown>[];
}

function validateRecord(record: Record<string, unknown>, dataset: string) {
  // Validate record types
  if (dataset === "311") {
    if (record.case_id && typeof record.case_id !== "string") throw new Error("Invalid case_id type");
    if (record.priority && !["low", "medium", "high"].includes(String(record.priority))) {
      throw new Error("Invalid priority value");
    }
    if (record.latitude && (typeof record.latitude !== "number" || record.latitude < -90 || record.latitude > 90)) {
      throw new Error("Invalid latitude");
    }
  }
  // Add similar validations for 911, business_licenses
}
```

---

### 6. 🟠 HIGH: Unsafe dangerouslySetInnerHTML in Chart Component

**Location:** `src/components/ui/chart.tsx:70`

**Current Code:**
```typescript
return (
  <style
    dangerouslySetInnerHTML={{
      __html: Object.entries(THEMES)
        .map(([theme, prefix]) => `...`)
        .join("\n"),
    }}
  />
);
```

**Risk:**
- While current implementation is safe (uses string template), this is a pattern that's dangerous
- If user-provided data ever makes it into the template, XSS vulnerability

**Fix:**
- Current code is safe because it only uses hardcoded theme strings
- Add JSDoc comment to document why it's safe:
```typescript
/**
 * Create CSS variables for chart theming.
 * Safe to use dangerouslySetInnerHTML because:
 * - Only uses hardcoded THEMES object keys
 * - No user input in __html
 * - Template includes validated color values from ChartConfig
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
```

---

### 7. 🟠 MODERATE: Unprotected Database Access via Edge Functions

**Location:** All Supabase Edge Functions use `SUPABASE_SERVICE_ROLE_KEY`

**Risk:**
- Service role key has full database permissions
- If function is compromised, entire database is at risk
- No row-level security enforcement in functions

**Current Code:**
```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // ❌ Unrestricted access
);
```

**Fix:**
1. Create a dedicated role for each function:
```sql
-- Create ingestion-only role
CREATE ROLE ingest_data WITH LOGIN;
GRANT INSERT, UPDATE ON "service_requests_311" TO ingest_data;
GRANT INSERT, UPDATE ON "calls_911_monthly" TO ingest_data;
GRANT INSERT, UPDATE ON "business_licenses" TO ingest_data;
GRANT SELECT, INSERT ON "vector_documents" TO ingest_data;
```

2. Use role-specific API key:
```typescript
const supabase = createClient(SUPABASE_URL, INGEST_API_KEY); // Use ingest-only key
```

---

### 8. 🟠 MODERATE: No Rate Limiting on Edge Functions

**Location:** All Supabase Edge Functions

**Risk:**
- DOS attacks via API flooding
- AI API quota exhaustion
- Uncontrolled costs

**Fix:**
```typescript
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimit.get(clientId);

  if (!record || now > record.resetTime) {
    rateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

---

### 9. 🟠 MODERATE: Insecure Logging of Sensitive Queries

**Location:** `supabase/functions/ai-briefing/index.ts:167-170`

**Current Code:**
```typescript
// Log query - NO AUTHENTICATION CHECK
supabase.from("ai_query_logs").insert({
  query,
  mode: mode || "leadership",
}).then(() => {});
```

**Risk:**
- User queries (which may contain sensitive information) are logged
- No access control on query logs
- Could expose what leadership is asking about

**Fix:**
```typescript
// Only log queries from authenticated users
const authHeader = req.headers.get("authorization");
if (authHeader) {
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (user) {
    await supabase.from("ai_query_logs").insert({
      query,
      mode: mode || "leadership",
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

### 10. 🟡 MODERATE: No Content-Type Validation

**Location:** All Edge Functions

**Risk:**
- Accepts any content type
- Potential for DOS via large uploads

**Fix:**
```typescript
serve(async (req) => {
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optional: Check body size
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10_000_000) { // 10MB max
    return new Response(JSON.stringify({ error: "Request too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }
  // ... rest of handler
});
```

---

### 11. 🟡 MODERATE: Missing Authentication on Data Export Functions

**Location:** All data fetch functions assume frontend authentication

**Risk:**
- If frontend authentication is bypassed, backend has no protection
- Data queries execute without checking user permissions

**Fix:**
Implement RLS (Row Level Security) in Supabase:
```sql
-- Example RLS policy for district_scores
ALTER TABLE public.district_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON public.district_scores
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can do everything"
  ON public.district_scores
  USING (
    (SELECT auth.jwt() ->> 'claims' ->> 'user_role') = 'admin'
  );
```

---

### 12. 🟡 MODERATE: Error Messages Expose Internal Details

**Location:** Multiple error handlers
- `supabase/functions/ai-briefing/index.ts:161`
- `supabase/functions/generate-embeddings/index.ts:170`

**Current Code:**
```typescript
return new Response(
  JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

**Risk:**
- Stack traces expose implementation details
- File paths, library versions visible to attacker

**Fix:**
```typescript
console.error("API Error:", e); // Log full error internally

return new Response(
  JSON.stringify({
    error: "An error occurred processing your request. Please try again later."
  }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

---

### 13. 🟡 MODERATE: No HTTPS Enforcement

**Location:** All external API calls

**Risk:**
- Man-in-the-middle attacks on Lovable AI API calls
- API key interception

**Current Code:**
```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
  // Good: HTTPS is used
  // But no certificate pinning
});
```

**Fix:**
- Ensure all external calls use HTTPS (✅ Already done)
- Add certificate pinning if using Deno Node bridge
- Use only HTTPS in Vite config

---

### 14. 🟡 LOW: Missing Security Headers

**Location:** Frontend `index.html`

**Risk:**
- No Content Security Policy
- No X-Frame-Options
- No X-Content-Type-Options

**Current HTML:**
```html
<head>
  <meta charset="UTF-8" />
  <!-- Missing security headers -->
</head>
```

**Fix:**
Add middleware/headers to your deployment:

```
# For Vercel (vercel.json)
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
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self'; connect-src 'self' https:"
        }
      ]
    }
  ]
}
```

---

## Summary of Fixes by Priority

### 🚨 IMMEDIATE (Next 24 Hours)

| Issue | Fix Time | Action |
|-------|----------|--------|
| Rotate Supabase keys | 5 min | Go to Supabase dashboard → Settings → API |
| Remove .env from git | 10 min | Use BFG Repo-Cleaner or git filter-branch |
| Add .env to .gitignore | 2 min | Edit .gitignore |
| Fix CORS | 15 min | Update all edge functions |
| npm audit fix | 20 min | Run npm audit fix |

### ✅ SHORT TERM (This Week)

- [ ] Implement input validation for CSV uploads
- [ ] Set up RLS policies in Supabase
- [ ] Add rate limiting to edge functions
- [ ] Implement authentication checks on queries
- [ ] Sanitize error messages
- [ ] Add security headers to deployment

### 📋 MEDIUM TERM (This Sprint)

- [ ] Implement Content Security Policy
- [ ] Add request size limits
- [ ] Set up WAF rules
- [ ] Implement audit logging
- [ ] Security testing (OWASP Top 10)
- [ ] Penetration testing

---

## Verification Checklist

After applying fixes, verify:

```bash
# 1. Check no .env in git
git log --all --full-history -- ".env"

# 2. Run npm audit
npm audit

# 3. Check CORS headers
curl -H "Origin: https://attacker.com" https://your-edge-function.com

# 4. Verify .env is in .gitignore
grep -w ".env" .gitignore

# 5. Test rate limiting
for i in {1..200}; do curl https://your-api.com; done
```

---

## Additional Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/self-hosting/security)
- [React Security Vulnerabilities](https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)

---

## Next Steps

1. **Rotate credentials immediately**
2. **Create branch:** `claude/security-fixes-9h7Hr`
3. **Implement fixes in order of priority**
4. **Run security tests**
5. **Deploy updated version**
6. **Monitor for unauthorized access attempts**

---

*Report Generated: 2026-03-08*
*Review Status: REQUIRES IMMEDIATE ACTION*
