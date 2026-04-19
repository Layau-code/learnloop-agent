# LearnLoop Agent

Local-first learning workflow agent that turns study materials and conversations into a personal knowledge base with context-aware QA, reflection, and adaptive planning.

## Why this project

Most learning tools help you collect content or chat with a model, but they do not reliably close the loop between:

- material ingestion
- context-aware questioning
- knowledge distillation
- daily reflection
- adaptive planning

LearnLoop Agent is designed to make that loop explicit and durable.

## Core direction

The current version is scoped around a single-user, local-first learning workflow:

1. ingest study materials
2. parse and structure them
3. ask questions with current-study context
4. distill useful outputs into reusable knowledge
5. generate daily reflection and next-step plans

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

This means the project has moved beyond planning and into implementation, but the main product workflows are still being built.

## Planned V1 capabilities

- material ingestion for `Markdown / TXT / PDF / URL / manual notes`
- searchable knowledge base
- context-aware study QA with citations
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
  - dashboard
  - knowledge base
  - study workbench
  - reflection and planning
  - settings

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
- OpenAI API key

### Start locally

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Set `OPENAI_API_KEY` in `.env`

3. Start the stack:

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
- frontend navigation shell

Next priorities:

1. materials API and parser pipeline
2. ingest workflow wiring
3. knowledge base APIs
4. study QA workflow
5. reflection and planning workflow

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
