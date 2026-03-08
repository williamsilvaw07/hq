# Deploy to Hostinger Business

## 1. On Hostinger (hPanel)

- **Create a database:** Websites → your domain → MySQL Databases → Create. Note the DB name, username, password, and host (often `localhost`).
- **PHP:** Use PHP 8.1 or 8.2 (in Advanced → PHP Configuration).

## 2. Get the code on the server

**Option A – Git (if Hostinger gives you SSH/shell):**  
Clone your GitHub repo into the account (e.g. `domains/yourdomain.com/` or the path they show), then run `composer install --no-dev` and `npm ci && npm run build` in the project folder.

**Option B – Upload:**  
Upload the project (or a zip) via File Manager or FTP. Exclude: `vendor`, `node_modules`, `.env`, `.git`. Then run Composer and NPM via SSH or their “Run script” tool if available.

## 3. Point the domain to the app

Set the **document root** to the app’s `public` folder, e.g.:

`/domains/yourdomain.com/public_html` → `/path/to/valentteworkflow/public`

(or move/copy contents of `public` into the existing `public_html` and adjust paths).

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
