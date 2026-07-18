# Takreem Jaffery — Portfolio

A two-part project:

```
frontend/   Vite + vanilla JS + Three.js — the actual site
backend/    Express API for the contact form (optional, separate deploy)
```

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Open the printed `localhost` URL. Light/dark mode, scroll animations, and the
hero graphic all work immediately. The contact form will show a friendly
error until the backend is running too (see `backend/README.md`) — everything
else on the page works without it.

## Why two folders

GitHub Pages only hosts static files, so `frontend/` is what actually gets
published there. `backend/` exists only to handle the contact form and needs
a separate small host (Render, Railway, etc. — see `backend/README.md`) if
you want that form to send real email. If you don't care about the form,
you can ignore `backend/` entirely and just delete the form markup in
`frontend/index.html`.

## Deploying the frontend to GitHub Pages

**Option A — GitHub Actions (recommended, already set up):**

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages → Build and deployment → Source**,
   and select **GitHub Actions**.
3. Push to `main` — `.github/workflows/deploy.yml` builds `frontend/` and
   publishes `frontend/dist` automatically. Check the **Actions** tab for
   progress and the live URL.

**Option B — manual:**

```bash
cd frontend
npm install
npm run build      # outputs frontend/dist
npx gh-pages -d dist
```

(`gh-pages` pushes the `dist` folder to a `gh-pages` branch; enable Pages for
that branch in repo settings if you go this route.)

## Stack

- **Vite** for dev server + bundling
- **Three.js** for the hero graphic (a small rotating graph representing how
  the stack fits together — web, mobile, cloud, AI/ML, data — with an
  animated "shipping" pulse and a drifting particle field)
- Plain CSS with custom properties for the light/dark theme, no framework
- **Express** (backend/) for the contact form endpoint only

## Editing content

All the resume content lives directly in `frontend/index.html` — experience,
projects, skills, education. Colors and type scale are CSS custom properties
at the top of `frontend/src/style.css` if you want to adjust the palette.
