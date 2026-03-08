# Deploy frontend (one-time setup)

After this setup, **every push to `main`** will automatically build the Next.js app and upload it to Hostinger. No more manual build + upload on your Mac.

## 1. Add GitHub secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret.**

Add:

| Secret            | Where to get it |
|-------------------|-----------------|
| `FTP_HOST`        | Hostinger hPanel → **Files** (or **FTP accounts**) → hostname, e.g. `ftp.williamhq.com` or the one shown for your account. |
| `FTP_USERNAME`    | Your FTP username (often like `u752162317`). |
| `FTP_PASSWORD`    | Your FTP password. |
| *(none)* | The workflow uploads to `public_html/public`. If your FTP path is different, edit `.github/workflows/deploy-frontend.yml` and change the `server-dir` value. |

## 2. Push to deploy

From then on:

- **Push to `main`** → workflow runs, builds with `NEXT_PUBLIC_API_URL=` (same-origin API), then uploads the contents of `frontend/out/` to your server.
- Or run it by hand: **Actions** tab → **Build and deploy frontend** → **Run workflow**.

You only need to run the build + upload on your Mac if you’re testing without pushing.

---

## If the workflow fails

1. **Open the failed run** → click the **deploy** job → see which step went red.
2. **"Install and build" failed**  
   - Check the log for `npm` or `next build` errors. Fix the issue locally and push again.
3. **"Deploy to Hostinger (FTP)" failed**  
   - **FTP_HOST**: In Hostinger hPanel → FTP Accounts, use the **hostname** (e.g. `ftp.williamhq.com` or the one shown). No `ftp://` prefix.
   - **server-dir**: The workflow uses `public_html/public`. If your FTP account’s “Directory” in Hostinger is already set to `public_html`, change `server-dir` in `.github/workflows/deploy-frontend.yml` to just `public` and push.
   - **Logs**: The workflow uses `log-level: verbose`; the deploy step log will show the FTP error (e.g. connection refused, login failed, path not found).
