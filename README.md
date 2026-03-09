
# William HQ — Fintech Tracker

williamhq.com: **Fintech Tracker** — mobile-first financial tracking with Next.js frontend and Laravel API.

## Stack

- **Frontend**: Next.js (App Router), TailwindCSS, shadcn/ui — built as static export, served from Laravel `backend/public`
- **Backend**: Laravel API (auth, workspaces, transactions, budgets, WhatsApp webhooks) in `backend/`
- **Database**: PostgreSQL (or MySQL per `.env`)
- **Queue**: Redis (optional)

## Repo structure

```
backend/             ← Laravel API (Fintech Tracker backend)
  app/
  bootstrap/
  config/
  database/
  public/            ← Laravel web root + built frontend (index.html, _next/, etc.)
  public_html/       ← Optional Hostinger helper (.htaccess → public/)
  routes/
  storage/
  artisan
  composer.json
  composer.lock
frontend/            ← Next.js app (Fintech Tracker UI)
```

## Local development

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 in .env.local
npm install
npm run dev
```

Visit http://localhost:3000 — the Next.js app will proxy `/api` to the Laravel backend.

## Deploy (williamhq.com)

1. Clone the repo on the server, then run `composer install --no-dev`.
2. **Build the frontend** and copy the static export into `backend/public/`:

   ```bash
   cd frontend
   npm ci
   npm run build
   cp -r out/* ../backend/public/
   ```

   Set `NEXT_PUBLIC_API_URL=` (empty) so the app uses the same origin (e.g. `https://williamhq.com/api`).

3. Set the domain document root to **`backend/public`** (or, if your host requires `public_html` as the root, point it to `public_html` and use `backend/public_html/.htaccess` to rewrite into `public/`).
4. Create `.env` on the server (copy from `.env.example`), run `php artisan key:generate`, `migrate`, `storage:link`.

The home page at williamhq.com is the Fintech Tracker app; the Laravel API is under `/api`.
