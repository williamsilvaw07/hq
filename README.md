# William HQ — Fintech Tracker

williamhq.com: **Fintech Tracker** — mobile-first financial tracking (budgets, transactions, categories, workspaces).

## Stack

- **App**: Single Next.js app (App Router) with API route handlers — UI and API in one codebase.
- **Database**: MySQL (Prisma ORM). Set `DATABASE_URL` in `.env.local`.
- **Auth**: JWT (Bearer) + optional NextAuth credentials provider. Password reset via email (nodemailer).

## Repo structure

```
frontend/                 ← Next.js app (UI + API)
  app/
    api/                  ← API route handlers
    (dashboard)/
  lib/
    auth.ts               ← JWT create/verify, password hash
    prisma.ts             ← Prisma client
    workspace-auth.ts     ← Workspace membership checks
  prisma/
    schema.prisma        ← MySQL schema
  public/
```

## Local development

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local: set DATABASE_URL (MySQL), NEXTAUTH_SECRET, NEXTAUTH_URL
npm install
npx prisma generate
# If DB is empty: npx prisma db push   (or run prisma migrate deploy)
npm run dev
```

Visit http://localhost:3001 (or the port in `package.json`). All `/api/*` routes are served by Next.js.

## Deploy (single Node.js app)

1. **Build** (standalone output):

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

   This produces `.next/standalone/` and `.next/static/`. Copy the standalone folder, `frontend/.next/static`, and `frontend/public` to the server.

2. **Run on server**:

   ```bash
   cd frontend/.next/standalone
   cp -r ../../.next/static .next/
   cp -r ../../public ./
   DATABASE_URL="mysql://..." NEXTAUTH_SECRET="..." NEXTAUTH_URL="https://your-domain.com" node server.js
   ```

3. **nginx** (reverse proxy to the Node process, one app):

   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   HTML and `/api` are served by the same Node server.

4. **Migrations**: On the server (or in CI), run `npx prisma migrate deploy` (or `prisma db push` for dev) from the `frontend` directory with `DATABASE_URL` set.

## Environment variables

- `DATABASE_URL` — MySQL connection string (Prisma).
- `NEXTAUTH_SECRET` — Min 32 characters (JWT and NextAuth).
- `NEXTAUTH_URL` — App URL (e.g. `https://williamhq.com`).
- `NEXT_PUBLIC_APP_URL` — Base URL for emails (password reset, invites).
- Optional: `SMTP_*` / `MAIL_FROM` for sending mail; if unset, reset/invite links are logged only.
