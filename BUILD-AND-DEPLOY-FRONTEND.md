# Build Fintech Tracker frontend and deploy to williamhq.com

The server doesn't have Node/npm. Build on your **Mac**, then upload the built files.

## 1. On your Mac (Terminal)

Fix npm cache once (if you get permission errors):

```bash
sudo chown -R $(whoami) ~/.npm
```

Go to the project and build:

```bash
cd /Users/williamsilva/Documents/GitHub/hq/frontend
rm -rf node_modules .next out
npm install
NEXT_PUBLIC_API_URL= npm run build
```

(`NEXT_PUBLIC_API_URL=` empty = app will use https://williamhq.com/api)

You should get an **`out`** folder with `index.html`, `_next/`, etc.

## 2. Upload to Hostinger

Upload the **contents** of `out/` into the server folder:

**Server path:** `public_html/public/`  
Full path: `/home/u752162317/domains/williamhq.com/public_html/public/`

So on the server you must have:

- `public_html/public/index.html`
- `public_html/public/_next/` (folder with JS/CSS)

**Ways to upload:**

- **File Manager in hPanel:** go to `domains/williamhq.com/public_html/public/`. Zip the `out` folder on your Mac (so the zip contains `index.html` and `_next` at the top level), upload the zip, then extract in `public/`. Or upload the files/folders from `out/` directly into `public/`.
- **SFTP:** connect to `147.93.39.172` port `65002` (or the SFTP port Hostinger gives you), user `u752162317`, then upload the contents of `out/` into `domains/williamhq.com/public_html/public/`.

## 3. Check

Open https://williamhq.com — you should see the Fintech Tracker app (login/dashboard).
