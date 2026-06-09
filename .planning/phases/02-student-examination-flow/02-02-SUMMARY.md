---
phase: 02-student-examination-flow
plan: 02
subsystem: exam-pipeline
tags: [nextjs, typescript, postgres, supabase, api-routes]
requires: [02-01]
provides:
  - "Database schema migration adding 'draft' status and unique index constraints"
  - "Active draft fetch GET route (/api/submissions/active)"
  - "Autosave POST draft upsert endpoint (/api/submissions/auto-save)"
  - "Submission post endpoint (/api/submissions/submit) implementing validation constraints"
  - "Client-side autosave trigger integration on a 30-second interval"
  - "Client-side submit dialog check and submission success landing page (/submit-success)"
  - "Redirection guards for dashboard and editor post-submission"
affects: [03-01]
tech-stack:
  added: []
  patterns: ["Delayable thenable MockQueryBuilder chaining", "Double-lock (client and server) post-submission editor lockout"]
key-files:
  created:
    - "supabase/migrations/20260609_add_draft_status.sql"
    - "src/app/api/submissions/active/route.ts"
    - "src/app/api/submissions/auto-save/route.ts"
    - "src/app/api/submissions/submit/route.ts"
    - "src/app/submit-success/page.tsx"
    - "scripts/test-phase2.ts"
  modified:
    - "src/app/page.tsx"
    - "src/lib/db.ts"
requirements-completed: ["EXAM-03", "EXAM-04", "EXAM-05", "SUB-01", "SUB-02"]
duration: 20min
completed: 2026-06-09
---

# Plan 2-2 Summary: Submissions Pipeline

**Implement SQL migration, Route API handlers, Success landing screen, autosave hooks, dashboard guards, and verification tests**

## Accomplishments
- Generated SQL migration `supabase/migrations/20260609_add_draft_status.sql` allowing `'draft'` status and enforcing uniqueness on student-exam pairs.
- Created route handlers for active state, autosaves, and submissions.
- Refactored `MockQueryBuilder` in `src/lib/db.ts` to fully support standard filter chaining.
- Implemented `/submit-success` page showing pulsing "Pending Evaluation" badge.
- Added client-side autosave timers and final submit confirmation dialogs.
- Created redirection guards on the dashboard and editor to prevent access if the exam is already submitted.
- Created and executed `scripts/test-phase2.ts` integration suite (all tests passed).
