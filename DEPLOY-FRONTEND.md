# Deploy frontend to Hostinger

Deploy the built Next.js app to **public_html/public/** on your server. Use the **local script** when you have frontend changes (no GitHub Actions required).

## Option A: Deploy from your Mac (recommended)

When you change the frontend, run from the repo root:

```bash
./deploy-frontend.sh
```

### One-time setup

1. **Install sshpass** (for password-based SFTP): `brew install sshpass`
2. **Create `.env.deploy`** in the repo root (copy from `.env.deploy.example`), set `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`. Or export them before running the script.
3. **Enable SSH/SFTP** on Hostinger: hPanel → **Advanced** → **SSH Access** → enable. Port **65002** is used automatically.

The script builds the frontend, creates `public_html/public` on the server if needed, then uploads `frontend/out/` there.

## Option B: GitHub Actions (manual only)

The workflow does **not** run on push. To run by hand: **Actions** → **Build and deploy frontend** → **Run workflow**. Add secrets `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD` in repo Settings → Secrets.

---

## If the deploy fails

- **Build fails**: Fix the error shown; run `./deploy-frontend.sh` again.
- **Upload fails (No such file or directory)**: The script runs `mkdir -p public_html/public` on the server first; if it still fails, create that folder in Hostinger File Manager.
- **Connection refused / Permission denied**: Check FTP_HOST (use server hostname from hPanel), enable SSH in Hostinger, and confirm FTP_USERNAME / FTP_PASSWORD.
