# Reconix — Complete UI/UX & System Design Document
## Job Builder: Excel Upload + Manual Builder + Unified Pipeline

---

## 1. Overview & Design Philosophy

### The Core Problem This Solves
Peter's team currently manages a 4-sheet Excel workbook manually:
- `sheet1` — Raw aged payables export from Xero (30,000+ rows, messy)
- `Control check` — VLOOKUP-based balance verification (36 suppliers, ~$293K total)
- `Overpayments` — Clean: SupplierName | PaymentDate | OverpaymentAmount | BankAccount
- `Bills` — Clean: SupplierName | InvoiceDate | InvoiceReference | PayAmount (1,000+ rows)

They manually verify that `SUM(Bills.PayAmount per supplier) == Overpayments.OverpaymentAmount`
before doing anything in Xero. This is the control check. Our app must replicate and
harden this pattern, not replace it with something unfamiliar.

### Design Principle
**The UI should feel like the Excel workflow Peter already knows — but bulletproof.**
Same mental model (overpayments paired with bills, balanced per supplier), 
zero manual reconciliation, full audit trail.

---

## 2. Two Entry Points, One Pipeline

```
┌──────────────────────────┐    ┌──────────────────────────┐
│     MODE A               │    │     MODE B               │
│     Excel Upload         │    │     Manual Builder       │
│                          │    │                          │
│  Upload .xlsx →          │    │  Search supplier →       │
│  Auto-detect sheets →    │    │  Fetch live from Xero →  │
│  Field mapping (if       │    │  Drag bills to           │
│  columns differ) →       │    │  overpayment bucket →    │
│  Pre-flight validation   │    │  Set amounts inline      │
└────────────┬─────────────┘    └────────────┬─────────────┘
             └──────────────┬────────────────┘
                            ▼
             ┌──────────────────────────────┐
             │     UNIFIED VALIDATION       │
             │     ENGINE                   │
             │                              │
             │  • Balance check per         │
             │    supplier                  │
             │  • Xero lookup (invoice      │
             │    exists + AUTHORISED)      │
             │  • Duplicate detection       │
             │  • Negative amount flags     │
             │  • Floating point tolerance  │
             │  • Supplier fuzzy match      │
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │     REVIEW SCREEN            │
             │  Grouped by supplier,        │
             │  expandable, editable        │
             │  before submission           │
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │     JOB SUBMITTED            │
             │     PENDING APPROVAL         │
             │     → BullMQ Worker          │
             └──────────────────────────────┘
```

---

## 3. Job Builder — Step by Step

### Step 0: Job Type Selection

**URL:** `/jobs/new`

**UI:** Two large card options side by side

```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  📄  Invoice Reversal           │  │  💳  Overpayment Allocation      │
│                                 │  │                                 │
│  Bulk-create credit notes       │  │  Allocate overpayments against  │
│  against AP invoices with       │  │  outstanding bills with exact   │
│  FX-neutral reversal            │  │  supplier matching              │
│                                 │  │                                 │
│  [Select]                       │  │  [Select]                       │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

Once selected, the sub-type choice appears:

```
How would you like to build this job?

  ┌────────────────────────┐    ┌────────────────────────┐
  │  📂 Upload Excel       │    │  ✏️  Build Manually     │
  │                        │    │                        │
  │  Upload your .xlsx     │    │  Search and select     │
  │  file. We'll auto-     │    │  suppliers and bills   │
  │  detect your columns   │    │  directly from your    │
  │  or let you map them   │    │  Xero data             │
  └────────────────────────┘    └────────────────────────┘
```

---

### MODE A: Excel Upload Flow

#### Step A1 — File Upload

**UI Elements:**
- Large dropzone (drag-drop or click to browse)
- Accept: `.xlsx` only, max 25MB
- Shows file name + sheet count once uploaded
- "Remove" option before proceeding

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ⬆  Drag and drop your Excel file here                │
│      or click to browse                                 │
│                                                         │
│      Supported format: .xlsx — Max size: 25MB          │
│                                                         │
└─────────────────────────────────────────────────────────┘

After upload:
┌─────────────────────────────────────────────────────────┐
│  ✅  Q4_2025_Payment_Allocation_JNL1.xlsx               │
│     4 sheets detected                                   │
│                                                         │
│  Detected sheets:                                       │
│  ○ sheet1          — 30,063 rows  [Ignore]             │
│  ○ Control check   — 37 rows      [Ignore]             │
│  ● Overpayments    — 36 rows      [Use as Overpayments]│
│  ● Bills           — 1,044 rows   [Use as Bills]       │
│                                                         │
│  ℹ  We auto-detected Overpayments and Bills sheets     │
│     by matching sheet names and column headers.        │
└─────────────────────────────────────────────────────────┘
```

**Auto-detection logic (backend):**
- Looks for sheet named `Overpayments` (case-insensitive) OR sheet with columns
  matching `[SupplierName, PaymentDate, OverpaymentAmount, BankAccount]`
- Looks for sheet named `Bills` (case-insensitive) OR sheet with columns
  matching `[SupplierName, InvoiceDate, InvoiceReference, PayAmount]`
- If found: pre-maps automatically, no mapper shown
- If not found or ambiguous: show field mapper

#### Step A2 — Field Mapper (Only shown if columns don't auto-match)

This screen only appears when:
- Peter uploads a file with different column names
- Or a different user uploads a custom-formatted file

**Layout:** Two-panel side by side

```
┌─────────────────────────────────────────────────────────────────┐
│  Map your columns                                               │
│  Drag columns from your file to the matching Reconix fields    │
├───────────────────────────┬─────────────────────────────────────┤
│  YOUR COLUMNS             │  RECONIX FIELDS                     │
│  (from Overpayments sheet)│                                     │
│                           │  Overpayments                       │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐   │
│  │ Supplier            │  │  │ SupplierName        [empty] │   │
│  └─────────────────────┘  │  └─────────────────────────────┘   │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐   │
│  │ Date of Payment     │  │  │ PaymentDate         [empty] │   │
│  └─────────────────────┘  │  └─────────────────────────────┘   │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐   │
│  │ Amount USD          │  │  │ OverpaymentAmount   [empty] │   │
│  └─────────────────────┘  │  └─────────────────────────────┘   │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐   │
│  │ Bank                │  │  │ BankAccount         [empty] │   │
│  └─────────────────────┘  │  └─────────────────────────────┘   │
│                           │                                     │
│                           │  Bills                              │
│  (from Bills sheet)       │  ┌─────────────────────────────┐   │
│  ┌─────────────────────┐  │  │ SupplierName        [empty] │   │
│  │ Supplier Name       │  │  └─────────────────────────────┘   │
│  └─────────────────────┘  │  ┌─────────────────────────────┐   │
│  ┌─────────────────────┐  │  │ InvoiceDate         [empty] │   │
│  │ Invoice Date        │  │  └─────────────────────────────┘   │
│  └─────────────────────┘  │  ┌─────────────────────────────┐   │
│  ┌─────────────────────┐  │  │ InvoiceReference    [empty] │   │
│  │ Reference           │  │  └─────────────────────────────┘   │
│  └─────────────────────┘  │  ┌─────────────────────────────┐   │
│  ┌─────────────────────┐  │  │ PayAmount           [empty] │   │
│  │ Pay Amount          │  │  └─────────────────────────────┘   │
│  └─────────────────────┘  │                                     │
└───────────────────────────┴─────────────────────────────────────┘

[ Preview first 5 rows ]               [ Continue → ]
```

**Behaviour:**
- Drag a source column → drop onto a Reconix field
- Dropped pill shows in the field slot with a remove ×
- Required fields highlighted in amber until mapped
- "Preview first 5 rows" shows a mini table of parsed data before continuing
- Mapping saved as a named template: "Save this mapping as a template"
  so next time with same file format, auto-applies

**Saved Mapping Templates:**
```
Saved mappings:
  ● Peter's Standard Format (used 12 times)    [Apply] [Delete]
  ● Legacy Format v1 (used 3 times)            [Apply] [Delete]
```

---

### Step A3 / B3 — Pre-Flight Validation (Unified for both modes)

This is the most important screen. Runs automatically after mapping confirmed.
Backend validates everything before a single Xero API call is made.

**Layout: Summary header + expandable supplier rows**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pre-flight Validation                                          │
│  Checking 36 suppliers · 1,044 bills against Xero             │
│                                                                 │
│  [████████████████████░░░░]  78%  Fetching invoices...        │
└─────────────────────────────────────────────────────────────────┘

Summary cards:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  36          │ │  34          │ │  1           │ │  1           │
│  Suppliers   │ │  ✅ Ready    │ │  ⚠️ Warning  │ │  ❌ Error    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│  1,044       │ │  $293,757.07 │
│  Bills       │ │  Total Value │
└──────────────┘ └──────────────┘
```

**Per-Supplier Validation Table:**

```
  Supplier              Bills   Amount      Balance Check    Xero Match    Status
  ─────────────────────────────────────────────────────────────────────────────
▶ Aljazeera              57    $2,840.69   ✅ Balanced       ✅ All found  Ready
▶ Amazing Places...      10    $6,575.02   ✅ Balanced       ✅ All found  Ready
▶ Apartment Therapy      18    $627.59     ✅ Balanced       ✅ All found  Ready
▶ Aljazeera (dup?)        -         -      ⚠️ 1 negative    ✅ All found  Warning
▶ Drone TV              180   $127,624.85  ✅ Balanced       ❌ 2 missing  Error
  ─────────────────────────────────────────────────────────────────────────────
```

**Expanding a row** shows the individual bills:

```
▼ Aljazeera                                                        ⚠️ Warning
  
  Overpayment:  $2,840.69  ·  Payment Date: 30 Jan 2026  ·  AIB Dollar Account

  Bills (57):
  
  Invoice Ref       Invoice Date    Pay Amount    Xero Status    Flag
  ─────────────────────────────────────────────────────────────────
  Si-8469 / 2      03 Mar 2025      $25.36       ✅ AUTHORISED
  Si-8929 / 4      05 Aug 2025      $17.80       ✅ AUTHORISED
  Si-8969 / 3      21 Aug 2025      $43.24       ✅ AUTHORISED
  Mo-Ja25-LME / 2  21 Aug 2025      -$0.02       ✅ AUTHORISED   ⚠️ Negative
  ...
  
  ────────────────────────────────────────────────────────────
  Bills Total:  $2,840.69    Overpayment:  $2,840.69    Diff: $0.00  ✅
```

**Validation Rules Engine:**

| Check | Logic | Result |
|---|---|---|
| Balance check | `abs(SUM(bills.PayAmount) - overpayment.OverpaymentAmount) < 0.01` | Error if fails (0.01 tolerance for float precision) |
| Negative amounts | Any `PayAmount < 0` | Warning — show row, allow proceed with acknowledgement |
| Zero amounts | Any `PayAmount == 0` | Warning — likely a data entry error |
| Xero invoice exists | GET `/Invoices?where=InvoiceNumber=="X"&&Date==DateTime(...)` | Error if not found |
| Xero invoice status | `Status == AUTHORISED` | Error if PAID, VOIDED, DELETED |
| Xero invoice amount | `abs(xero.AmountDue - bill.PayAmount) > 0.01` | Warning — amount mismatch, require acknowledgement |
| Already allocated | Check existing allocations on the overpayment | Warning — skip or show as duplicate |
| Supplier match | Xero Contact exists with exact name | Warning if fuzzy match < 90%, Error if no match |
| Overpayment exists | GET `/Overpayments/{id}` with `RemainingCredit > 0` | Error if exhausted |
| Duplicate in job | Same `InvoiceReference` appears twice in upload | Error — flag both rows |

**Action buttons at bottom:**
```
[ ← Back ]          [ Download Validation Report ]     [ Proceed with X ready suppliers → ]
                                                        (disabled if any Errors remain)
```

**Handling Warnings vs Errors:**
- **Errors** = hard block. Cannot proceed until resolved. User must fix the Excel or remove the row.
- **Warnings** = soft block. User must explicitly acknowledge each warning with a checkbox:
  ```
  ☐ I acknowledge 1 negative amount row for Aljazeera (-$0.02). 
    This will be included in the allocation.
  ☐ I acknowledge 2 amount mismatches. Xero amounts differ from Excel.
  ```

---

### MODE B: Manual Builder Flow

#### Step B1 — Add Suppliers

```
┌─────────────────────────────────────────────────────────────────┐
│  Build Overpayment Allocation Job                               │
│                                                                 │
│  Add Supplier                                                   │
│  ┌────────────────────────────────────────────┐ [Add Supplier] │
│  │ 🔍  Search supplier name...                │               │
│  └────────────────────────────────────────────┘               │
│                                                                 │
│  Search results (live from your Xero contacts):               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Aljazeera                    Has overpayments: ✅ $2,840  │ │
│  │ Amazing Places On Our Planet Has overpayments: ✅ $6,575  │ │
│  │ Apartment Therapy            Has overpayments: ✅ $627    │ │
│  │ 1026 Ventures                Has overpayments: ❌ None    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

Selecting a supplier with an overpayment expands it inline:

#### Step B2 — Per-Supplier Bill Selection

```
┌─────────────────────────────────────────────────────────────────┐
│  Aljazeera                                          [Remove]    │
│                                                                 │
│  Overpayment: $2,840.69  ·  AIB Dollar Account                 │
│  Remaining Credit: $2,840.69                                    │
│                                                                 │
│  Outstanding Bills (fetched from Xero):                        │
│                                                                 │
│  ☑  Invoice Ref      Date           Amount Due   Allocate      │
│  ─────────────────────────────────────────────────────────────  │
│  ☑  Si-8469/2       03 Mar 2025      $25.36      $25.36  [✎]  │
│  ☑  Si-8929/4       05 Aug 2025      $17.80      $17.80  [✎]  │
│  ☑  Si-8969/3       21 Aug 2025      $43.24      $43.24  [✎]  │
│  ☐  Si-8974/1       21 Aug 2025     $243.74      $  ___  [✎]  │
│  ─────────────────────────────────────────────────────────────  │
│  [ Select All ]  [ Clear ]                                      │
│                                                                 │
│  Bills total:   $2,792.30                                       │
│  Overpayment:   $2,840.69                                       │
│  Remaining:     $48.39   ⚠️  Underfilled                       │
│                                                                 │
│  [ + Add Another Supplier ]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Manual builder balance states:**
```
Bills total < Overpayment  →  ⚠️ "Underfilled — $48.39 of overpayment unallocated"
Bills total = Overpayment  →  ✅ "Perfectly balanced"
Bills total > Overpayment  →  ❌ "Overfilled — reduce amounts before proceeding"
```

**The [✎] edit button** on each row opens an inline amount editor:
```
Si-8469/2  ·  Amount Due: $25.36
Allocate: [ $25.36 ]  (max $25.36)
           ✅ Full payment
```

---

### Step 4 — Review & Submit (Unified)

Both modes land here. This is the last screen before job creation.

```
┌─────────────────────────────────────────────────────────────────┐
│  Review Job                                                     │
│  Overpayment Allocation  ·  36 suppliers  ·  1,044 bills       │
│  Total value: $293,757.07                                       │
│                                                                 │
│  Company:  Video Elephant  [Change ▾]                          │
│  Xero Org: Video Elephant (tenant: 440143df-...)               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supplier                Bills   Amount       Status     │  │
│  │  ────────────────────────────────────────────────────    │  │
│  │  Aljazeera                57     $2,840.69    ✅ Ready   │  │
│  │  Amazing Places...        10     $6,575.02    ✅ Ready   │  │
│  │  Drone TV                180    $127,624.85   ✅ Ready   │  │
│  │  ...                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Processing order: Sequential per supplier, 2s delay between   │
│  Xero API calls to respect rate limits                         │
│                                                                 │
│  ⚠️  This action will create 1,044 allocations in Xero.        │
│     This cannot be undone from Reconix. Ensure you have        │
│     reviewed all items above.                                   │
│                                                                 │
│  Job name (optional):                                           │
│  ┌──────────────────────────────────────────────────┐         │
│  │  Q4 2025 Payment Allocation Run                  │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  [ ← Back to Validation ]          [ Submit for Approval → ]  │
└─────────────────────────────────────────────────────────────────┘
```

**On submit:**
- Job record created in DB with status `PENDING_APPROVAL`
- All job items written to `job_items` table
- Field mapping saved (for Excel mode)
- User redirected to `/jobs/{id}` detail page

---

## 4. Job Detail & Progress Page

**URL:** `/jobs/{id}`

```
┌─────────────────────────────────────────────────────────────────┐
│  Job: Q4 2025 Payment Allocation Run                           │
│  Overpayment Allocation  ·  Created by Peter Ryan  ·  2h ago  │
│                                                                 │
│  Status:  ● PENDING APPROVAL                                   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  1,044   │ │    0     │ │    0     │ │    0     │         │
│  │  Total   │ │  Done ✅ │ │ Skipped  │ │  Failed  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  [APPROVER ONLY]                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ✅ Approve Job          ❌ Reject Job                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Items                                           [Export CSV]  │
│  ─────────────────────────────────────────────────────────     │
│  Supplier          Invoice Ref    Amount    Status    Detail   │
│  Aljazeera         Si-8469/2      $25.36    Pending   —        │
│  Aljazeera         Si-8929/4      $17.80    Pending   —        │
│  ...                                                           │
└─────────────────────────────────────────────────────────────────┘
```

**While RUNNING** — live polling every 3 seconds:

```
│  Status:  ● RUNNING                                            │
│                                                                 │
│  [████████████████░░░░░░░░░░░░]  52%  542 / 1,044             │
│                                                                 │
│  Items                                                         │
│  Supplier          Invoice Ref    Amount    Status    Detail   │
│  Aljazeera         Si-8469/2      $25.36    ✅ Done            │
│  Aljazeera         Si-8929/4      $17.80    ✅ Done            │
│  Aljazeera         Mo-Ja25-LME    -$0.02    ⚠️ Skipped  [i]   │
│  Drone TV          DT-2025-001    $450.00   ❌ Failed   [i]   │
│  ...                              ...       ⏳ Pending         │
```

**[i] button on Failed row** opens a drawer:
```
Error Detail — Drone TV · DT-2025-001

Xero API Error:
  Code: 400
  Message: "The Invoice DT-2025-001 is in a PAID status and cannot be allocated"
  
Xero Request sent:
  PUT /Overpayments/{id}/Allocations
  { Invoice: { InvoiceID: "..." }, Amount: 450.00, Date: "2026-01-30" }

Timestamp: 30 Jan 2026 14:32:18 (Europe/Dublin)

[ Copy Error Details ]
```

---

## 5. Invoice Reversal — Same Pattern

Invoice Reversal uses the exact same flow but with different field requirements.

**Excel format expected:**

| Column | Required | Notes |
|---|---|---|
| SupplierName | Yes | Must match Xero contact |
| InvoiceReference | Yes | Must match Xero InvoiceNumber |
| InvoiceDate | Yes | Used for FX rate lookup — critical |
| InvoiceTotal | Yes | Gross amount |
| UnitPriceEx | Yes | Ex-tax amount for credit note line item |
| TaxAmount | Yes | Tax amount |
| CurrencyCode | No | Defaults to invoice's currency |
| ReversalDate | No | Defaults to invoice date (FX neutral) |

**Additional validation rules for Invoice Reversal:**

| Check | Logic |
|---|---|
| Invoice is AUTHORISED | Not PAID, VOIDED, DELETED |
| Invoice is AP type | `Type == ACCPAY` |
| Credit note doesn't exist | No existing `CN-{InvoiceReference}` in Xero |
| Amount matches | `abs(UnitPriceEx + TaxAmount - InvoiceTotal) < 0.01` |
| Date parse succeeds | All three date formats handled |
| FX rate warning | If ReversalDate != InvoiceDate, warn: "FX impact expected" |

**Manual builder for Invoice Reversal:**
- Search invoices by supplier, date range, amount range
- Shows `AmountDue`, `CurrencyCode`, `InvoiceDate` per row
- Select rows → amounts pre-filled from Xero → editable
- Same validation + review + submit pipeline

---

## 6. Company Switcher (Multi-Tenant)

Peter has 3 companies, each with its own Xero connection.
The active company scopes all data everywhere.

**Top navigation:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Reconix logo]   [Video Elephant ▾]        Jobs  Audit  ...   │
│                    ├── Video Elephant ✅                        │
│                    ├── VE Holdings                              │
│                    └── VE Media Ltd                             │
│                        [ + Connect New Company ]               │
└─────────────────────────────────────────────────────────────────┘
```

- Switching company clears all in-progress job builder state
- Shows confirmation: "Switch to VE Holdings? Your current draft will be saved."
- All API calls after switch include new `companyId` in context
- Job list, audit log, Xero data all re-scope immediately

---

## 7. Audit Log Page

**URL:** `/audit`

```
┌─────────────────────────────────────────────────────────────────┐
│  Audit Log  ·  Video Elephant                                   │
│                                                                 │
│  Filters: [ Date range ] [ User ] [ Action type ] [ Job ]      │
│                                [Export CSV]  [Export PDF]       │
│                                                                 │
│  Time                  User         Action                 Job  │
│  ─────────────────────────────────────────────────────────────  │
│  30 Jan 14:32:18       P.Ryan       XERO_ALLOCATION_CREATED     │
│  30 Jan 14:32:16       P.Ryan       XERO_ALLOCATION_CREATED     │
│  30 Jan 14:30:00       P.Ryan       JOB_APPROVED           [→] │
│  30 Jan 14:15:00       P.Ryan       JOB_CREATED            [→] │
│  30 Jan 14:15:00       P.Ryan       EXCEL_UPLOADED              │
│                                                                 │
│  Showing 1-50 of 1,094 entries          [ < Prev ]  [ Next > ] │
└─────────────────────────────────────────────────────────────────┘
```

**Expanding a row:**
```
XERO_ALLOCATION_CREATED

  Job:        Q4 2025 Payment Allocation Run (job_id: abc-123)
  Item:       Aljazeera · Si-8469/2 · $25.36
  User:       Peter Ryan (user_id: usr-456)
  IP:         82.x.x.x
  User Agent: Chrome 120 / macOS

  Xero Request:
  PUT https://api.xero.com/api.xro/2.0/Overpayments/{id}/Allocations
  {
    "Allocations": [{
      "Invoice": { "InvoiceID": "xxxx-xxxx" },
      "Amount": 25.36,
      "Date": "2026-01-30"
    }]
  }

  Xero Response:  200 OK
  { "Allocations": [{ "AllocationID": "yyyy", "Amount": 25.36 }] }
```

---

## 8. Validation Engine — Technical Spec

### Backend Service: `ValidationEngine`

```
ValidationEngine.validate(jobType, overpayments[], bills[])
  → ValidationReport {
      suppliers: SupplierValidation[],
      summary: {
        total: number,
        ready: number,
        warnings: number,
        errors: number,
        totalValue: number
      }
    }

SupplierValidation {
  supplierName: string,
  xeroContactId: string | null,
  xeroContactMatch: 'exact' | 'fuzzy' | 'none',
  overpayment: OverpaymentRow,
  bills: BillValidation[],
  balanceCheck: {
    billsTotal: number,
    overpaymentAmount: number,
    difference: number,         // abs < 0.01 = pass
    pass: boolean
  },
  status: 'ready' | 'warning' | 'error',
  warnings: ValidationIssue[],
  errors: ValidationIssue[]
}

ValidationIssue {
  code: string,          // 'NEGATIVE_AMOUNT', 'INVOICE_NOT_FOUND', etc.
  message: string,       // Human readable
  rowIndex?: number,
  invoiceRef?: string,
  severity: 'warning' | 'error'
}
```

### Floating Point Tolerance
Peter's control check already has float issues:
- `6575.0199999999995` instead of `6575.02`
- `7093.570000000003` instead of `7093.57`

**Rule:** All balance comparisons use `Math.abs(a - b) < 0.01` (1 cent tolerance).
Never use `===` for financial amounts. Store amounts as integers (cents) in DB.

### Xero Rate Limiting
- Xero allows 60 calls/minute per connection
- Validation fetches each invoice individually → 1,044 calls for this file
- Use batch fetching: `GET /Invoices?where=InvoiceNumber in ["X","Y","Z"]` (up to 100 per call)
- Validation of 1,044 bills = ~11 API calls, not 1,044
- Show progress bar during validation with estimated time

### Idempotency in Validation
Validation results cached in Redis for 10 minutes with key:
`validation:{companyId}:{sha256(sortedInvoiceRefs)}`
Re-uploading same file uses cached results instantly.

---

## 9. Excel Upload — Edge Cases Handled

| Edge Case | Handling |
|---|---|
| Columns in different order | Auto-detect by header name, not position |
| Extra columns in Excel | Ignored silently |
| Missing required column | Show specific error: "Column 'InvoiceReference' not found" |
| Empty rows in middle | Skip silently |
| Date as Excel serial (45874) | Parse via Windows epoch formula |
| Date as string "21-Aug-25" | Multi-format parser |
| Date as string "21/08/2025" | Multi-format parser |
| Negative PayAmount | Warn, require acknowledgement, include |
| Zero PayAmount | Warn, exclude by default (user can include) |
| Duplicate InvoiceReference in file | Hard error, highlight both rows |
| Float precision (0.0199999) | Round to 2dp for display, use tolerance for comparison |
| BOM character in first column header | Strip before matching |
| Merged cells in header | Unmerge, use leftmost value |
| Multiple sheets named similarly | Prefer exact match, then fuzzy |
| File > 25MB | Reject with friendly message before upload |
| Password-protected Excel | Detect and reject with message |
| .xls (old format) | Reject, ask for .xlsx |
| .csv | Support for single-sheet simple cases |

---

## 10. Design Tokens (Xero-Adjacent Blue)

```css
/* Brand */
--color-primary:        #0078C8;   /* Xero blue */
--color-primary-dark:   #005A9E;
--color-primary-light:  #E8F4FC;
--color-accent:         #00B9E8;

/* Neutrals */
--color-bg:             #F8FAFC;
--color-surface:        #FFFFFF;
--color-surface-raised: #FFFFFF;
--color-border:         #E2E8F0;
--color-border-strong:  #CBD5E1;
--color-text-primary:   #0F1923;
--color-text-secondary: #475569;
--color-text-muted:     #94A3B8;

/* Semantic */
--color-success:        #16A34A;
--color-success-bg:     #F0FDF4;
--color-warning:        #D97706;
--color-warning-bg:     #FFFBEB;
--color-error:          #DC2626;
--color-error-bg:       #FEF2F2;
--color-info:           #0078C8;
--color-info-bg:        #E8F4FC;

/* Typography */
--font-display:         'DM Sans', sans-serif;   /* headings, labels */
--font-body:            'Inter', sans-serif;     /* body text */
--font-mono:            'JetBrains Mono', mono;  /* amounts, IDs, code */

/* Financial amounts always: */
/*   font-family: var(--font-mono)  */
/*   text-align: right              */
/*   tabular-nums                   */
```

---

## 11. Navigation Structure

```
/                         → Redirect to /jobs
/login                    → Login page
/register                 → Register + connect Xero

/jobs                     → Job list (paginated, filterable)
/jobs/new                 → Job builder (type select)
/jobs/new/upload          → Excel upload mode
/jobs/new/manual          → Manual builder mode
/jobs/{id}                → Job detail + progress + approval

/companies                → Connected Xero orgs
/companies/connect        → Xero OAuth flow

/audit                    → Audit log (ADMIN only)

/settings                 → Company settings, user management
/settings/users           → Invite users, set roles
/settings/mappings        → Saved Excel field mapping templates
```

---

## 12. Empty States & Error States

Every list or data view has a defined empty state:

```
Jobs list (no jobs yet):
  [icon]
  No jobs yet
  Upload an Excel file or build a job manually to get started.
  [ + New Job ]

Jobs list (filtered, no results):
  [icon]
  No jobs match your filters
  Try adjusting the date range or status filter.
  [ Clear filters ]

Validation (all errors):
  ❌ Cannot proceed
  3 suppliers have errors that must be resolved before this job can be submitted.
  Download the validation report to share with your team.
  [ Download Report ]  [ ← Back to fix ]
```

---

## 13. Responsive Behaviour

This is a **desktop-first** application. Peter's team uses it at desks.

- Minimum supported width: 1280px
- Tables do not collapse to cards — they scroll horizontally on smaller screens
- Mobile view (< 768px): read-only — view jobs and audit log, no job creation
- Tablet (768-1279px): view and approve jobs, no job builder

---

## 14. Accessibility

- All form fields have visible labels (not just placeholders)
- Error messages linked to fields via `aria-describedby`
- Focus management: after modal opens, focus moves to first interactive element
- Keyboard navigation: Tab through form, Enter to submit, Escape to cancel
- Colour is never the only indicator — icons + text always accompany status colours
- Financial amounts use `aria-label` with full context: `aria-label="$2,840.69 USD"`
