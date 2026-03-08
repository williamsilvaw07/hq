# Deploy to Hostinger Business

## Repo structure (Laravel standard)

The domain must serve **`public/`**, not the Laravel root. The repo has:

- **`public/`** – web-accessible folder (has `index.php`, assets). This is Laravel’s document root.
- **`public_html/`** – on shared hosting, the server’s document root is often `public_html`. It contains only an `.htaccess` that routes all requests into `public/`.

```
app/
bootstrap/
config/
database/
public/          ← web-accessible (index.php, .htaccess, build/)
public_html/     ← .htaccess only, routes into public/
resources/
routes/
storage/
vendor/           ← not in Git; composer install on server
.env              ← never commit; create on server
artisan
composer.json
composer.lock
```

**Important:** Set the domain document root to **`public_html/public`** (the `public` folder inside the repo). If your host only allows `public_html` as doc root, the included `public_html/.htaccess` will route everything into `public/`.

---

## 1. On Hostinger (hPanel)

- **Create a database:** Websites → your domain → MySQL Databases → Create. Note the DB name, username, password, and host (often `localhost`).
- **PHP:** Use PHP 8.1 or 8.2 (in Advanced → PHP Configuration).

## 2. Get the code on the server

**Option A – Git (if Hostinger gives you SSH/shell):**  
Clone your GitHub repo (e.g. into `domains/yourdomain.com/` or the path they show). Then:

1. **Backend:** `composer install --no-dev`
2. **Frontend (Fintech Tracker UI):** build and copy into `public/` so the home page serves the app:
   ```bash
   cd frontend
   npm ci
   npm run build
   cp -r out/* ../public/
   ```
   Set `NEXT_PUBLIC_API_URL=` (empty) in the build so the app calls the same domain (e.g. `https://williamhq.com/api`).

**Option B – Upload:**  
Upload the project (or a zip) via File Manager or FTP. Exclude: `vendor`, `node_modules`, `.env`, `.git`. Then run Composer and NPM via SSH or their “Run script” tool if available.

## 3. Point the domain to the app

Set the **document root** to the app’s **`public`** folder:

- Use **`public_html/public`** (the `public` folder inside the repo root). Do not use `public_html` alone.

## 4. Environment on the server

Create a `.env` on the server (copy from `.env.example`). Set at least:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://yourdomain.com`
- `APP_KEY=` (run `php artisan key:generate` once)
- `DB_HOST=...` (from step 1)
- `DB_DATABASE=...`
- `DB_USERNAME=...`
- `DB_PASSWORD=...`

Run:

```bash
php artisan key:generate
php artisan config:cache
php artisan migrate --force
php artisan storage:link
```

## 5. Permissions

Ensure `storage` and `bootstrap/cache` are writable by the web server (e.g. `chmod -R 775 storage bootstrap/cache`).

---

Your `.env` is not in Git; configure it only on the server.
