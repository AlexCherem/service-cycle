# Service Cycle

Monorepo for the Service Cycle product.

## Requirements

- Node.js 22
- pnpm 11
- Docker Desktop

## Workspace layout

- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/contracts` — shared API contracts; it will be added when the first business endpoint appears

## Local environment

Create local environment files once:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

The root `.env` configures Docker Compose. `apps/api/.env` configures NestJS and Prisma. Both real files are ignored by Git.

## Local database

Manage PostgreSQL from the repository root:

```bash
pnpm db:up
pnpm db:ps
pnpm db:logs
pnpm db:down
```

PostgreSQL is available to the host at `localhost:5433`. Inside its Docker container it still uses the standard port `5432`.

`db:down` removes the container and network, but keeps PostgreSQL data in the named Docker volume.

## Prisma

Useful commands from the repository root:

```bash
pnpm db:generate
pnpm db:validate
pnpm db:migrate
```

Run `db:generate` after changing `apps/api/prisma/schema.prisma`. Use `db:migrate` after adding or changing a database model during development.
