# Project Agents

This repository uses a small, project-scoped subagent setup for coordinated development in Codex.

## Scope

These agents are tuned for LearnLoop Agent, a browser-based learning workflow product built with:

- `Next.js + TypeScript` on the web frontend
- `Python + FastAPI + SQLAlchemy + Alembic` on the backend
- `PostgreSQL + pgvector + Redis + Celery` for persistence and background execution

The current product priority is the MVP web flow, not broad platform expansion.

## Sources Of Truth

Use these sources in order:

1. Current code
2. This `AGENTS.md`
3. `README.md`
4. If present locally, the private development pack under `开发执行包/`

If code conflicts with older planning text, prefer current code facts and update the docs.

## Global Development Rules

- Treat this as a browser-based web product, not a mobile app.
- Prefer the smallest vertical slice that keeps the main flow moving.
- Keep backend boundaries clear:
  - `api` handles HTTP only
  - `repos` handle persistence
  - `services` hold deterministic business logic
  - `workflows` describe orchestration
- Keep frontend boundaries clear:
  - `app/` holds route shells
  - `features/` holds page-level behavior
  - `lib/` holds typed API utilities
- Do not introduce large abstractions unless there is a concrete blocker.
- Do not overstate implementation status in docs.
- Every implementation pass should trigger a README sync check.
- Only the `coder` agent has write access by default.
- `reviewer`, `tester_qa`, `docs`, and `evolution` stay read-only by default.

## Frontend Skills

Project-level frontend skills live under:

- [frontend-design](.codex/skills/frontend-design/SKILL.md)
- [web-ui-polish](.codex/skills/web-ui-polish/SKILL.md)

Use them like this:

- Codex must read and apply [frontend-design](.codex/skills/frontend-design/SKILL.md) for new pages, new components, dashboards, shells, and larger UI builds.
- Codex must read and apply [web-ui-polish](.codex/skills/web-ui-polish/SKILL.md) for polishing existing UI, improving hierarchy, spacing, typography, surfaces, and overall visual quality.
- It is valid to use both in the same task:
  - `frontend-design` first for structure and direction
  - `web-ui-polish` second for refinement

Before coding any frontend change, first explain:

- which files will change
- component boundaries
- why the structure is clear and easy to extend

Frontend implementation rules:

- Prefer simple and explicit component structure
- Avoid unnecessary abstraction
- Keep responsiveness in scope
- Keep accessibility in scope
- Keep route files thin and place page behavior in `features/`
- Keep shared shell, locale, formatting, and API helpers in `components/` or `lib/` based on responsibility

## Agent Roles

### `planner_pm`

- Break requirements into executable units
- Freeze scope for the current task
- Define acceptance criteria and dependencies
- Does not write code

### `architect`

- Guards module boundaries and structural consistency
- Validates whether a proposed change fits the current system
- Does not directly implement features

### `coder`

- Implements scoped changes
- Keeps edits local and follows project conventions
- Must report touched files, change summary, and validation gaps

### `reviewer`

- Performs code review
- Focuses on correctness, regressions, security, and missing tests
- Does not own long-term redesign

### `tester_qa`

- Designs tests and regression coverage
- Works read-only by default; may propose exact tests for coder to add
- Focuses on verification, not refactoring

### `docs`

- Keeps README and related docs aligned with reality
- Works read-only by default; may propose exact doc diffs for coder to apply
- Must not invent capabilities

### `evolution`

- Checks maintainability, extensibility, and technical debt
- Works read-only by default
- Suggests only small-step follow-up improvements

## Handoff Order

Default collaboration sequence:

1. `planner_pm`
2. `architect`
3. `coder`
4. `reviewer`
5. `tester_qa`
6. `evolution`
7. `docs`

Handoff expectations:

- `planner_pm` defines scope, constraints, and done criteria
- `architect` approves module fit and boundary decisions
- `coder` implements the smallest valid change
- `reviewer` clears correctness blockers
- `tester_qa` validates minimum test coverage or explains the gap
- `evolution` checks long-term risk
- `docs` syncs public-facing and developer-facing documentation

## Definition Of Done

A task is done only when all of the following are true:

- The requested functionality is implemented
- Key architectural and product constraints are still intact
- At least the minimum necessary tests exist, or the absence of tests is explicitly justified
- Documentation is synchronized, including README when behavior or setup changed
- `reviewer` reports no must-fix blocking issue
- `evolution` reports no clear long-term blocker

## Working Style

- Prefer incremental progress over broad rewrites
- Optimize for maintainability and low regression risk
- Keep output concrete: changed files, risks, and next validation steps
- If something is ambiguous, narrow the scope instead of expanding the design
