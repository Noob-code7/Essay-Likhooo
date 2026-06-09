# Project: AI Essay Examination Platform

## What This Is

A modern, responsive web application for conducting essay examinations online. It allows students to write and submit essays with auto-saving, while an asynchronous background service evaluates submissions using the Google Gemini API. Administrators can monitor submissions, view evaluation scores and feedback, trigger manual evaluations, and export results.

## Core Value

Ensure 100% reliable submission and storage of student essays immediately upon submit, without waiting for or depending on the speed or availability of AI evaluation.

## Requirements

### Validated

- ✓ **AUTH-01**: Student login using Student ID and Password. — Validated in Phase 1
- ✓ **AUTH-02**: Admin login using Username and Password. — Validated in Phase 1

### Active
- [ ] **EXAM-01**: Student dashboard showing student details, assigned exam topic, and "Start Writing" button.
- [ ] **EXAM-02**: Essay writing page with topic, large text area, word/character count, and auto-save status.
- [ ] **EXAM-03**: Auto-save essay draft every 30 seconds to the database with a subtle status indicator.
- [ ] **EXAM-04**: Submission validation (100–2000 words, prevents empty submission) and confirmation dialog.
- [ ] **EXAM-05**: Post-submission editor lock (disabled text area).
- [ ] **SUB-01**: Direct database save on submit under 2 seconds, marking status as "Pending Evaluation".
- [ ] **SUB-02**: Submission success page with a prompt showing the "Pending" evaluation status.
- [ ] **AI-01**: Asynchronous background AI worker to queue and evaluate submissions.
- [ ] **AI-02**: Google Gemini API prompt evaluation returning grammar (0-30), accuracy (0-30), quality (0-30), and overall (0-100) scores with constructive feedback.
- [ ] **AI-03**: Error handling with 3 retries for Gemini API before marking submission as "Failed".
- [ ] **ADM-01**: Admin dashboard summarizing total students, submissions, pending, evaluated, and average score.
- [ ] **ADM-02**: Admin dashboard submission table with status, scores, essay view, and retry triggers.
- [ ] **ADM-03**: Admin manual trigger to re-evaluate or retry failed evaluations.
- [ ] **ADM-04**: CSV export for results and download of essay submissions.

### Out of Scope

- **PDF-01**: PDF report generation (deferred to future phase to control complexity).
- **STAT-01**: Typing statistics and detailed word goal progress (out of scope for MVP).
- **HIST-01**: AI evaluation history logging (only latest evaluation score is stored in `ai_scores` for MVP).
- **OVR-01**: Manual admin score overrides (out of scope for MVP).
- **DARK-01**: Dark mode (focusing on a minimal, professional light theme).

## Context

- Greenfield web application designed for high reliability.
- Uses Next.js with React & TypeScript.
- Uses Supabase PostgreSQL for persistent database storage.
- Uses Gemini API for evaluation.
- The system must prioritize data safety above all: Gemini downtime or slow API responses must never cause submission loss or user-facing delays.

## Constraints

- **Performance**: Submissions must complete and be saved to the database in under 2 seconds.
- **Security**: The Gemini API key must never be exposed to the client; all AI evaluations must occur server-side.
- **Database**: Database queries must be parameterized to prevent SQL injection.
- **Validation**: Minimum of 100 words and maximum of 2000 words for submissions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js & Supabase | Enables serverless architecture, Supabase Auth, and easy edge/serverless function database hooks. | — Pending |
| Async Edge Function / Serverless Cron Queue | Isolates Gemini API latency from user submission path. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-09 after initialization*
