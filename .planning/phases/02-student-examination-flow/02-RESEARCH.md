# Phase 2: Student Examination Flow - Technical Research

**Date:** 2026-06-09
**Status:** Complete

---

## 1. Database Schema Enhancements

To implement draft saving and prevent multiple duplicate submissions, the existing Supabase schema needs a minor adjustment.

### Schema Modifications
1. **Status check constraint:** Alter the check constraint on `submissions.status` to include `'draft'` as a valid state.
2. **Uniqueness constraint:** Add a unique index/constraint on `submissions(student_id, exam_id)` to ensure each student can have only one submission record (draft or final) per exam.

### Migration File (`supabase/migrations/20260609_add_draft_status.sql`):
```sql
-- Remove old check constraint if it exists
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add new check constraint allowing 'draft'
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('draft', 'pending', 'evaluating', 'completed', 'failed'));

-- Set default status to 'draft'
ALTER TABLE submissions ALTER COLUMN status SET DEFAULT 'draft';

-- Add unique constraint on (student_id, exam_id)
ALTER TABLE submissions ADD CONSTRAINT submissions_student_exam_unique UNIQUE (student_id, exam_id);
```

---

## 2. API Design

We need three server-side Next.js route handlers to support the examination workflow:

### A. Fetch Active Submission (`GET /api/submissions/active`)
- **Authorization:** Student JWT cookie required.
- **Action:** Queries `submissions` for `student_id = <logged_in_id>` and `exam_id = <active_exam_id>`.
- **Response:**
  - `200 OK`: Returns the submission object (draft or final) if it exists, or `null` if none.
  - `401 Unauthorized`: If not logged in.

### B. Auto-Save Draft (`POST /api/submissions/auto-save`)
- **Authorization:** Student JWT cookie required.
- **Body:** `{ essayText: string }`
- **Action:**
  - Validates that the active exam exists.
  - Queries existing submission. If status is NOT `'draft'` (e.g. `'pending'`), returns `403 Forbidden` (Locked).
  - Performs an upsert: sets `essay_text = body.essayText`, `word_count = countWords(body.essayText)`, and `status = 'draft'`.
- **Response:**
  - `200 OK`: `{ success: true, savedAt: string }`
  - `403 Forbidden`: If essay is already submitted.

### C. Final Submission (`POST /api/submissions/submit`)
- **Authorization:** Student JWT cookie required.
- **Body:** `{ essayText: string }`
- **Action:**
  - Checks if word count is between 100 and 2000.
  - Queries existing submission. If status is NOT `'draft'`, returns `403 Forbidden` (Locked).
  - Updates the submission: `essay_text = body.essayText`, `word_count = countWords(body.essayText)`, `status = 'pending'`, `submitted_at = now()`.
- **Response:**
  - `200 OK`: `{ success: true, status: 'pending' }`
  - `400 Bad Request`: If word count is outside range.

---

## 3. Frontend Architecture

### Live Counts
- Word counter must split by whitespace (`\s+`) and filter out empty elements to accurately reflect actual words (e.g. ignoring multiple spaces or newlines).
- Character counter shows raw length.

### Auto-Save Behavior
- Use a `useEffect` interval (every 30 seconds).
- Maintain a local state `lastSavedText` to avoid making redundant API calls if the student hasn't typed since the last save.
- Render a status text indicator:
  - "Saving draft..." during active save.
  - "Draft saved at HH:MM:SS" on success.
  - "Connection lost. Retrying save..." on request failure.

### Editor Lock & Routing Guard
- On mount, `/write` fetches current status. If status is `'pending'`, it immediately redirects to `/submit-success`.
- After final submit is confirmed and completed, the user is redirected to `/submit-success`.

---

## 4. Validation Architecture

### Automated Verification
1. Schema files contain SQL syntax check.
2. Endpoint unit tests to assert word counts, unauthorized access, and locking behaviors.
3. Live build check passes.
