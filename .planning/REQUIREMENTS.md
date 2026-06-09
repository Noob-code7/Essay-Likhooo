# Requirements: AI Essay Examination Platform

**Defined:** 2026-06-09
**Core Value:** Ensure 100% reliable submission and storage of student essays immediately upon submit, without waiting for or depending on the speed or availability of AI evaluation.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: Student login using Student ID and Password.
- [x] **AUTH-02**: Admin login using Username and Password.

### Student Examination Flow

- [ ] **EXAM-01**: Student dashboard showing student details, assigned exam topic, and "Start Writing" button.
- [ ] **EXAM-02**: Essay writing page with topic, large text area, word/character count, and auto-save status.
- [ ] **EXAM-03**: Auto-save essay draft every 30 seconds to the database with a subtle status indicator.
- [ ] **EXAM-04**: Submission validation (100–2000 words, prevents empty submission) and confirmation dialog.
- [ ] **EXAM-05**: Post-submission editor lock (disabled text area).

### Submission Storage

- [ ] **SUB-01**: Direct database save on submit under 2 seconds, marking status as "Pending Evaluation".
- [ ] **SUB-02**: Submission success page with a prompt showing the "Pending" evaluation status.

### Background AI Evaluation

- [ ] **AI-01**: Asynchronous background AI worker to queue and evaluate submissions.
- [ ] **AI-02**: Google Gemini API prompt evaluation returning grammar (0-30), accuracy (0-30), quality (0-30), and overall (0-100) scores with constructive feedback.
- [ ] **AI-03**: Error handling with 3 retries for Gemini API before marking submission as "Failed".

### Admin Dashboard

- [ ] **ADM-01**: Admin dashboard summarizing total students, submissions, pending, evaluated, and average score.
- [ ] **ADM-02**: Admin dashboard submission table with status, scores, essay view, and retry triggers.
- [ ] **ADM-03**: Admin manual trigger to re-evaluate or retry failed evaluations.
- [ ] **ADM-04**: CSV export for results and download of essay submissions.

## v2 Requirements

(None yet)

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF Report Generation | Deferred to future release to manage MVP complexity |
| Typing Statistics & Word Goals | Non-critical for exam completion; focus on submission reliability |
| AI Evaluation History | Only latest score stored per submission for MVP |
| Admin Score Overrides | Out of scope for automated scoring MVP |
| Dark Mode | Focused on professional, minimal light theme |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| EXAM-01 | Phase 2 | Pending |
| EXAM-02 | Phase 2 | Pending |
| EXAM-03 | Phase 2 | Pending |
| EXAM-04 | Phase 2 | Pending |
| EXAM-05 | Phase 2 | Pending |
| SUB-01 | Phase 2 | Pending |
| SUB-02 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| ADM-01 | Phase 4 | Pending |
| ADM-02 | Phase 4 | Pending |
| ADM-03 | Phase 4 | Pending |
| ADM-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-09*
*Last updated: 2026-06-09 after initial definition*
