# MyAgent

Monorepo scaffold for the learning knowledge distillation agent.

## Scope of this scaffold

This repository includes the initial implementation scaffold for the learning agent:

- monorepo structure
- Docker Compose
- FastAPI backend
- Next.js frontend
- Alembic migration baseline
- core SQLAlchemy models
- repository layer
- workflow run infrastructure
- model adapter skeleton
- observability skeleton

## Repository layout

```text
backend/   FastAPI, workflows, models, repos, tasks
frontend/  Next.js application shell
```

## Quick start

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY`
3. Start the stack:

```bash
docker compose up --build
```

## Current status

This is a working scaffold, not a feature-complete product. The next implementation focus is:

1. materials API and parser pipeline
2. ingest workflow wiring
3. knowledge base APIs
4. study QA workflow
