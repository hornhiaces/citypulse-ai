# Database Schema & Ingestion Guide

## Overview

CityPulse AI stores three primary datasets about Los Angeles city services:

| Dataset | Table | Rows | Source | Update Frequency |
|---------|-------|------|--------|------------------|
| **311 Service Requests** | `service_requests_311` | 177,809 | LA City Portal | Daily |
| **911 Emergency Calls** | `calls_911_monthly` | 340 (monthly agg) | LAFD | Monthly |
| **Business Licenses** | `business_licenses` | 66,139 | LACP | Weekly |

---

## Core Tables

### 1. `service_requests_311`
**311 Service Request records from LA City's non-emergency line**

```sql
-- Key columns
case_id               TEXT PRIMARY KEY
service_type          TEXT              -- "Bulky Items", "Tree Maintenance", etc.
status                TEXT              -- "Open", "Closed", "In Progress"
created_at            TIMESTAMP         -- When service request was filed
closed_date           TIMESTAMP         -- When service request was resolved
location              TEXT              -- Address
latitude              DECIMAL(9, 6)     -- GPS coordinate
longitude             DECIMAL(9, 6)     -- GPS coordinate
council_district      INT               -- 1-15
resolution_days       INT               -- Time to resolve
updated_at            TIMESTAMP         -- When record was last updated
```

**Ingestion Status:** ✅ **99.9% Complete** (177,609 / 177,809 rows)
- Missing: 200 rows (Chunk 277, connection timeout)
- Decision: Accepted (>98% threshold)
- Last Updated: 2026-03-08

---

### 2. `calls_911_monthly`
**Aggregated 911 emergency call statistics by month**

```sql
-- Key columns
call_id               TEXT PRIMARY KEY
call_type             TEXT              -- "Medical Emergency", "Structure Fire", etc.
month                 DATE              -- First day of month
call_count            INT               -- Number of calls that month
avg_response_time     DECIMAL(5, 2)     -- Minutes
priority_1_count      INT               -- Critical priority calls
priority_2_count      INT               -- High priority calls
updated_at            TIMESTAMP         -- When record was last updated
```

**Ingestion Status:** ✅ **100% Complete** (85 / 85 rows)
- Last Updated: 2026-03-08

---

### 3. `business_licenses`
**Licensed businesses in Los Angeles**

```sql
-- Key columns
license_number        TEXT PRIMARY KEY
business_name         TEXT              -- Business name
business_type         TEXT              -- "Restaurant", "Retail", etc.
council_district      INT               -- 1-15
latitude              DECIMAL(9, 6)     -- GPS coordinate
longitude             DECIMAL(9, 6)     -- GPS coordinate
issue_date            DATE              -- When license was issued
expiry_date           DATE              -- When license expires
status                TEXT              -- "Active", "Inactive", "Expired"
updated_at            TIMESTAMP         -- When record was last updated
```

**Ingestion Status:** ✅ **100% Complete** (66,139 / 66,139 rows)
- Last Updated: 2026-03-08

---

## System Tables

### 4. `dataset_catalog`
**Tracks ingestion status and metadata for all datasets**

```sql
id                    UUID PRIMARY KEY
name                  TEXT              -- Dataset name (required for tracking)
status                TEXT              -- "pending", "complete", "error", "partial"
record_count          INT               -- Rows in the table
last_ingested_at      TIMESTAMP         -- When ingestion last attempted
ingestion_source      TEXT              -- "csv_upload", "api_sync", etc.
completion_rate       DECIMAL(5, 2)     -- Percentage (e.g., 99.89)
missing_rows          INT               -- Count of rows not ingested
error_details         TEXT              -- Error message if applicable
created_at            TIMESTAMP         -- When tracked
updated_at            TIMESTAMP         -- Last update
```

**Current Status:**
```
311 Service Requests    | Complete (Partial) | 177,609 rows | 99.89% | 200 missing
911 Emergency Calls     | Complete           | 85 rows      | 100%   | 0 missing
Business Licenses       | Complete           | 66,139 rows  | 100%   | 0 missing
```

---

### 5. `ai_query_logs`
**Audit trail for AI-powered recommendations and queries**

```sql
id                    UUID PRIMARY KEY
query_type            TEXT              -- "district_analysis", "trend_analysis", etc.
query_text            TEXT              -- User's question
response              TEXT              -- Generated response
execution_time_ms     INT               -- Query execution time
tokens_used           INT               -- LLM tokens consumed
user_id               UUID              -- User who made query
created_at            TIMESTAMP         -- When query was made
```

---

### 6. `ai_recommendations`
**Cached AI-generated recommendations for districts**

```sql
id                    UUID PRIMARY KEY
council_district      INT               -- 1-15
recommendation_type   TEXT              -- "311_trends", "business_growth", etc.
content               TEXT              -- Generated recommendation
confidence_score      DECIMAL(3, 2)     -- 0-1 confidence
generated_at          TIMESTAMP         -- When generated
expires_at            TIMESTAMP         -- When to refresh
```

---

### 7. `district_scores`
**Computed health scores for each council district**

```sql
council_district      INT PRIMARY KEY   -- 1-15
service_quality_score DECIMAL(3, 2)     -- 0-100
emergency_score       DECIMAL(3, 2)     -- 0-100
business_score        DECIMAL(3, 2)     -- 0-100
overall_score         DECIMAL(3, 2)     -- 0-100
updated_at            TIMESTAMP
```

---

### 8. `district_signals`
**Time-series indicators for district health monitoring**

```sql
id                    UUID PRIMARY KEY
council_district      INT               -- 1-15
signal_type           TEXT              -- "311_spike", "response_time_increase", etc.
severity              TEXT              -- "low", "medium", "high"
description           TEXT              -- Human-readable description
detected_at           TIMESTAMP
expires_at            TIMESTAMP         -- When signal becomes stale
```

---

### 9. `vector_documents`
**Embeddings for semantic search and RAG (Retrieval-Augmented Generation)**

```sql
id                    UUID PRIMARY KEY
content               TEXT              -- Document text
embedding             vector(1536)      -- OpenAI embedding
document_type         TEXT              -- "district_profile", "api_docs", etc.
source_table          TEXT              -- Which table this came from
source_id             TEXT              -- Record ID in source table
created_at            TIMESTAMP
```

---

## Data Flow & Ingestion

### Upload Process
```
CSV File → Papa Parse (Frontend)
         → Chunk (1000 rows each)
         → POST to Edge Function
         → Upsert to PostgreSQL
         → Update dataset_catalog
```

### Retry Logic
- **Connection errors:** Retry up to 3 times with exponential backoff (500ms, 1s, 2s)
- **Completion threshold:** Accept if ≥98% rows inserted
- **Partial files:** Logged to console with missing row details

### Deduplication
- **Method:** Composite keys + UPSERT
- **311:** `(case_id)`
- **911:** `(call_id)`
- **Licenses:** `(license_number)`

---

## Monitoring Data Quality

### Run Data Quality Checks
```bash
# Complete analysis
psql -U postgres -d citypulse -f scripts/monitor-partial-ingest.sql

# Or copy-paste into Supabase SQL Editor
```

### Key Metrics to Watch
1. **Completeness:** % of expected rows loaded
2. **Freshness:** Most recent record date
3. **Coverage:** % of records with GPS coordinates
4. **Integrity:** No NULL values in key fields
5. **Duplicates:** Ensure composite keys are unique

---

## Known Issues & Resolution

### Issue: 311 File at 99.9% Completion
**Problem:** Chunk 277 failed due to Supabase connection timeout
**Impact:** 200 rows (out of 177,809) from the tail end of the file not ingested
**Decision:** Accept with >98% threshold (standard industry practice)
**Monitoring:** Track in `dataset_catalog.completion_rate` and `console.warn` logs
**Next Steps:** Future optimization of Supabase connection pooling

---

## Related Documents
- [INGEST_MONITORING.md](./INGEST_MONITORING.md) - Real-time upload monitoring
- [DATA_INGEST_REPORT.md](./DATA_INGEST_REPORT.md) - Detailed ingestion report
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - RLS policies & security
