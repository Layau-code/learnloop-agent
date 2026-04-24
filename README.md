# LearnLoop Agent

Single-user, local-first learning workflow agent that turns study materials and conversations into a personal knowledge base with context-aware QA, reflection, and adaptive planning.

## Why this project

Most learning tools help you collect content or chat with a model, but they do not reliably close the loop between:

- material ingestion
- context-aware questioning
- knowledge distillation
- daily reflection
- adaptive planning

LearnLoop Agent is designed to make that loop explicit and durable.

This project is intended to be cloned and run locally by one user at a time. It is not being positioned as a hosted multi-user SaaS.

## Core direction

The current version is scoped around a single-user, local-first learning workflow:

1. ingest study materials
2. parse and structure them
3. ask questions with current-study context
4. distill useful outputs into reusable knowledge
5. generate daily reflection and next-step plans

Product assumptions in the current MVP:

- one primary user profile
- local Docker deployment
- bring-your-own model API key
- browser UI defaults to Simplified Chinese, with an English toggle available in the UI and persisted in the current browser

Implementation caveat:

- the current runtime uses a single default profile and no auth layer yet

## What is implemented today

The repository currently contains the implementation scaffold for the first engineering milestone:

- monorepo setup
- Docker Compose stack
- FastAPI backend shell
- Next.js frontend shell
- Alembic migration baseline
- core SQLAlchemy models
- repository layer
- workflow run infrastructure
- model adapter skeleton
- observability baseline
- browser-based study workbench for manual notes and URL ingestion
- pending distill draft approval flow
- knowledge base listing and search API/page
- browser-based study QA for the currently selected material using chunk-level evidence and inline chunk references
- ability to save useful assistant answers as pending knowledge drafts for approval
- Codex-style web shell that sends users directly into the study workflow, with a compact editor-style layout: stable sidebar, central conversation workspace, and right-side study context rail

This means the project has moved beyond planning and into implementation, but the main product workflows are still being built.

## Current web flow

The browser-based MVP can now demonstrate a small but real loop:

1. open the product and land directly in the `Study` workflow
2. create a study material from the `Study` page
3. run ingest and generate a distill draft
4. approve the draft into the knowledge base
5. browse the result in the `Knowledge` page
6. ask a question against the currently selected study material in the `Study` page
7. save a useful assistant answer as a pending draft, then approve it into the knowledge base

Current study QA boundary:

- selected material only
- chunk-level evidence selection
- inline chunk references on assistant messages
- saved answers go through the same human approval flow before entering the knowledge base
- no SSE, no cross-material retrieval, and no formal citations table yet

## Planned V1 capabilities

- material ingestion for `Markdown / TXT / PDF / URL / manual notes`
- searchable knowledge base
- context-aware study QA with stronger retrieval and richer citations
- distill draft approval and knowledge write-back
- daily reflection
- daily / weekly learning plan generation
- workflow status, checkpoints, and event logging

## Current architecture

### Backend

- `FastAPI` for REST endpoints and planned SSE support
- `SQLAlchemy + Alembic` for persistence and migrations
- `PostgreSQL + pgvector` for relational data and semantic retrieval foundations
- `Celery + Redis` for background task execution
- workflow-oriented runtime for long-running agent tasks

### Frontend

- `Next.js + TypeScript`
- app shell for:
  - knowledge base
  - study workbench
  - reflection and planning
  - settings
- a lightweight client-side locale layer for Simplified Chinese and English
- a Codex-inspired workspace layout with a compact sidebar, context rail, and central study conversation

### Agent layer

- workflow-driven architecture
- explicit run state
- checkpoints and resumability
- model access through a dedicated adapter layer

## Repository structure

```text
backend/
  app/
    api/
    core/
    db/
    models/
    repos/
    schemas/
    services/
    tasks/
    workflows/
  alembic/

frontend/
  app/
  components/
  features/
  lib/
```

## Quick start

### Prerequisites

- Docker
- Docker Compose
- Optional OpenAI API key

### Start locally

The recommended way to use this project is:

1. clone the repository locally
2. configure your own model API key if needed
3. run the stack on your machine

This repo is not designed around a shared hosted deployment model.

4. Copy the environment template:

```bash
cp .env.example .env
```

5. Optionally set `OPENAI_API_KEY` in `.env`

   If you keep the default local ports, the web frontend and API will already align through:

   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
   - `CORS_ORIGINS=http://localhost:3000`

   Without an OpenAI key, the current MVP still runs with deterministic fallback behavior for study QA and draft generation, while model-backed generation and embeddings stay disabled.

6. Start the stack:

```bash
docker compose up --build
```

### Default services

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Development status

The current implementation is still scaffold-first.

Already in place:

- repository structure
- database schema baseline
- workflow run models
- settings and workflow run endpoints
- materials endpoints and ingest service skeleton
- browser-based ingest, draft approval, knowledge browsing, selected-material study QA, and answer-to-draft saving

Next priorities:

1. richer material ingestion support for files and PDF parsing
2. richer study QA with stronger retrieval, richer citations, and multi-turn UX
3. reflection and planning workflow
4. improved approval UX and retrieval quality

## Roadmap

### Phase 1

- material ingestion
- knowledge distillation
- study QA
- reflection and planning

### Phase 2

- stronger answer quality and evaluation
- better deduplication and retrieval
- improved approval and write-back UX

### Phase 3

- interview preparation workflows
- richer review cards and mastery tracking
- broader multimodal extensions

## Notes

- This repository intentionally tracks code and lightweight public project information only.
- Local development planning documents are kept out of version control.
