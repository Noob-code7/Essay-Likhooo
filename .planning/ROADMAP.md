# Roadmap: AI Essay Examination Platform

## Overview

We will build the AI Essay Examination Platform in four sequential phases: starting with foundation and authentication setup, followed by the complete student workflow (essay writing, autosaving, and final submission), then setting up the asynchronous background AI worker using the Google Gemini API, and finally building the administrative dashboards and result-monitoring tools.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Establish directory structure, database schema, and student/admin login. (completed 2026-06-09)
- [ ] **Phase 2: Student Examination Flow** - Create student dashboard, essay writer page with auto-save, and submission.
- [ ] **Phase 3: Background AI Evaluation Service** - Configure Gemini API prompt evaluation queue and async execution.
- [ ] **Phase 4: Admin Dashboard & Actions** - Develop the administration dashboards, CSV exports, and essay download features.

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Set up Next.js app with TypeScript, initialize Supabase database schema, and implement Authentication for students and admins.
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02]
**Success Criteria** (what must be TRUE):
  1. Student and Admin authentication routes are fully functional.
  2. Supabase schema is deployed with students, exams, submissions, and ai_scores tables.
**Plans**: 1 plan

Plans:
- [x] 01-01: Set up project structure, Supabase client/schema, and login pages.

### Phase 2: Student Examination Flow
**Goal**: Build the complete student exam environment including dashboards, active text editors with auto-save, and a submission pipeline.
**Depends on**: Phase 1
**Requirements**: [EXAM-01, EXAM-02, EXAM-03, EXAM-04, EXAM-05, SUB-01, SUB-02]
**Success Criteria** (what must be TRUE):
  1. Student dashboard displays the active exam topic and instructions.
  2. Student can write an essay, view a word counter, and see a subtle auto-save status indicator every 30 seconds.
  3. Form validation triggers on too-short or too-long essays, and student must confirm before final submission.
  4. Student receives a redirect to a submission success page under 2 seconds, and the editor is disabled post-submit.
**Plans**: 2 plans

Plans:
- [x] 02-01: Build Student Dashboard and Essay Writer UI with word counter. (completed 2026-06-09)
- [x] 02-02: Implement essay auto-save and submission pipeline with validation. (completed 2026-06-09)

### Phase 3: Background AI Evaluation Service
**Goal**: Build an asynchronous processor queue to evaluate submissions using Gemini API server-side.
**Depends on**: Phase 2
**Requirements**: [AI-01, AI-02, AI-03]
**Success Criteria** (what must be TRUE):
  1. Submission insertion triggers an asynchronous queue job.
  2. Gemini API parses, evaluates, and updates the database with grammar, accuracy, quality, and overall scores and feedback.
  3. Failure handling retries 3 times before setting submission status to "Failed".
**Plans**: 1 plan

Plans:
- [x] 03-01: Implement background worker job, Gemini API connection, retry logic, and JSON score parsing. (completed 2026-06-09)

### Phase 4: Admin Dashboard & Actions
**Goal**: Build administrative dashboards to monitor results, view essays, manually retry failed evaluations, and export CSV/essay data.
**Depends on**: Phase 3
**Requirements**: [ADM-01, ADM-02, ADM-03, ADM-04]
**Success Criteria** (what must be TRUE):
  1. Admin dashboard shows status summary cards and live submissions table.
  2. Admin can click to view a student's essay text and manually trigger a re-evaluation.
  3. CSV results export works.
**Plans**: 1 plan

Plans:
- [x] 04-01: Build Admin Dashboard UI, CSV export features, and download/manual evaluation actions. (completed 2026-06-09)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 1/1 | Complete    | 2026-06-09 |
| 2. Student Examination Flow | 2/2 | Complete    | 2026-06-09 |
| 3. Background AI Evaluation Service | 1/1 | Complete    | 2026-06-09 |
| 4. Admin Dashboard & Actions | 1/1 | Complete    | 2026-06-09 |
