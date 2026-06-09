# Phase 4: Admin Dashboard & Actions - Technical Research

**Date:** 2026-06-09
**Status:** Complete

---

## 1. Database Operations & In-Memory Merging

Since our mock query builder (`MockQueryBuilder`) does not support complex SQL operations like `INNER JOIN`, `GROUP BY`, or `AVG()`, we will retrieve the primary datasets individually and merge them in-memory in JavaScript. This approach is 100% compatible with both the local mock database and the live Supabase client.

### Data Retrieval Steps
1. Fetch all student records:
   ```typescript
   const { data: students } = await supabase.from('students').select('*');
   ```
2. Fetch all essay submissions:
   ```typescript
   const { data: submissions } = await supabase.from('submissions').select('*');
   ```
3. Fetch all AI scores:
   ```typescript
   const { data: scores } = await supabase.from('ai_scores').select('*');
   ```

### Metric Calculations
- **Total Students:** `students.length`
- **Submitted Essays:** `submissions.length`
- **Pending/Evaluating:** `submissions.filter(s => s.status === 'pending' || s.status === 'evaluating').length`
- **Completed:** `submissions.filter(s => s.status === 'completed').length`
- **Failed:** `submissions.filter(s => s.status === 'failed').length`
- **Average Score:**
  ```typescript
  const completedScores = scores.map(s => s.overall_score);
  const averageScore = completedScores.length > 0 
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length) 
    : 0;
  ```

---

## 2. Manual Re-evaluation API (`POST /api/admin/re-evaluate`)

When an administrator clicks the "Re-evaluate" or "Retry" action, the dashboard makes a POST request to this endpoint.

### Endpoint Implementation
- **Authorization:** Verifies that the JWT session role is `'admin'`.
- **Query Changes:**
  1. Deletes the existing `ai_scores` row matching the `submission_id` to ensure clean reporting:
     ```typescript
     await supabase.from('ai_scores').delete().eq('submission_id', submissionId);
     ```
  2. Resets the submission's status to `'pending'` and resets `retry_count` to 0:
     ```typescript
     await supabase.from('submissions').update({
       status: 'pending',
       retry_count: 0
     }).eq('id', submissionId);
     ```
- **Asynchronous Execution:** Once the database status changes back to `'pending'`, the background worker polling the database will automatically pick it up and run the evaluation logic again.

---

## 3. CSV Export API (`GET /api/admin/export-csv`)

Downloads a spreadsheet containing full submission details, scores, and essay text.

### CSV Formatting and Escaping
To prevent spreadsheet cells from breaking due to commas, double quotes, and newlines in essay text and feedback strings, standard CSV escaping must be applied:
```typescript
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Replace double quotes with two double quotes, and wrap the entire value in double quotes
  return `"${str.replace(/"/g, '""')}"`;
}
```

### Response Headers
To trigger a direct file download dialog in the browser:
- `Content-Type`: `text/csv; charset=utf-8`
- `Content-Disposition`: `attachment; filename=essay_results.csv`
