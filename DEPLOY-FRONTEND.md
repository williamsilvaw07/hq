# Deploy frontend (one-time setup)

After this setup, **every push to `main`** will automatically build the Next.js app and upload it to Hostinger via **SFTP** (same credentials as FTP; Hostinger uses port 65002 for SFTP).

## 1. Enable SSH/SFTP on Hostinger (if needed)

In hPanel → **Advanced** → **SSH Access**: ensure SSH/SFTP is enabled. You use the same FTP username and password for SFTP.

## 2. Add GitHub secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret.**

Add these **3** secrets (same as before):

| Secret            | Where to get it |
|-------------------|-----------------|
| `FTP_HOST`        | Hostinger hPanel → **FTP** or **SSH** → hostname (e.g. `server123.hostinger.com` or your server hostname; no `ftp://`). |
| `FTP_USERNAME`    | Your FTP username (e.g. `u752162317`). |
| `FTP_PASSWORD`    | Your FTP password. |

The workflow deploys to `public_html/public/` on the server. To use a different path, edit the `rsync` line in `.github/workflows/deploy-frontend.yml` (the part after `$SFTP_HOST:`).

## 3. Push to deploy

From then on:

- **Push to `main`** → workflow runs, builds with `NEXT_PUBLIC_API_URL=` (same-origin API), then uploads the contents of `frontend/out/` to your server.
- Or run it by hand: **Actions** tab → **Build and deploy frontend** → **Run workflow**.

You only need to run the build + upload on your Mac if you’re testing without pushing.

---

## If the workflow fails

1. **Open the failed run** → click the **deploy** job → see which step went red.
2. **"Install and build" failed**  
   - Check the log for `npm` or `next build` errors. Fix the issue locally and push again.
3. **"Deploy to Hostinger (SFTP)" failed**  
   - **Enable SSH**: In Hostinger hPanel → **Advanced** → **SSH Access**, make sure SSH/SFTP is enabled.
   - **FTP_HOST**: Use the **server hostname** from Hostinger (e.g. from SSH Access or FTP; often like `server123.hostinger.com`). Not `ftp.williamhq.com` if that was only for FTP.
   - **Port**: The workflow uses port **65002** (Hostinger SFTP). Change it in the workflow if your plan uses a different port.
   - **Path**: The workflow uploads to `public_html/public/`. Edit the `rsync` command in the workflow if your site path is different.
