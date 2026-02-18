# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

2D vertical scrolling airplane shooter (shmup) with co-op networking. Licensed under MIT (Copyright 2026 Andrew Guo).

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Client**: HTML5 Canvas + Vite dev server
- **Server**: Node.js + WebSocket (ws library)
- **Architecture**: npm workspaces monorepo (`shared/`, `client/`, `server/`)

## Build & Run Commands

- `npm run dev` — Start client dev server (Vite, port 3000)
- `npm run dev:server` — Start WebSocket server (port 8080)
- `npm run build` — Build all packages
- `npm run build:shared` — Build shared package only
- `npm run test` — Run shared package tests (vitest)

## Architecture

### Monorepo Structure

- `shared/` — Deterministic simulation (zero DOM/Node deps): fixed-point math, ECS, all game systems
- `client/` — Browser renderer, input, UI screens, networking client
- `server/` — WebSocket room relay for lockstep co-op

### Key Design Decisions

1. **Determinism**: All simulation uses Q16.16 fixed-point math, LUT trig, seeded xorshift128 PRNG
2. **ECS**: Entities are IDs, components are typed Maps, systems are pure functions
3. **Lockstep co-op**: 60 tick/sec, 3-tick input delay, server is pure relay
4. **Data-driven**: Levels, enemies, bullets, bosses defined in JSON (`data/`)

### System Execution Order

Input → Movement → EnemyAI → Shooting → BulletPattern → Collision → Drop → Wave → Score → Boss → Cleanup

### Import Conventions

- Client imports from shared using `'shared/...'` path alias (resolved by Vite + tsconfig paths)
- Shared package uses `.js` extensions in imports (ESM)

### Deployment

- Docker: `docker compose up --build` (nginx on :80 + node on :8080)
- CI/CD: Tekton pipeline builds image, deploys to K8s with ingress at `2d-fighter.local.playquota.com`
