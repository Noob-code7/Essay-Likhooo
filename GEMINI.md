<!-- GSD:project-start source:PROJECT.md -->
## Project

**Project: AI Essay Examination Platform**

A modern, responsive web application for conducting essay examinations online. It allows students to write and submit essays with auto-saving, while an asynchronous background service evaluates submissions using the Google Gemini API. Administrators can monitor submissions, view evaluation scores and feedback, trigger manual evaluations, and export results.

**Core Value:** Ensure 100% reliable submission and storage of student essays immediately upon submit, without waiting for or depending on the speed or availability of AI evaluation.

### Constraints

- **Performance**: Submissions must complete and be saved to the database in under 2 seconds.
- **Security**: The Gemini API key must never be exposed to the client; all AI evaluations must occur server-side.
- **Database**: Database queries must be parameterized to prevent SQL injection.
- **Validation**: Minimum of 100 words and maximum of 2000 words for submissions.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
