# Backend — contact form API

A tiny Express server with one real endpoint: `POST /api/contact`, used by the
contact form on the site. GitHub Pages only serves static files, so this
piece has to be deployed separately if you want the form to work in
production (see below). Everything else on the site works with no backend
at all.

## Run locally

```bash
cd backend
npm install
cp .env.example .env   # optional — fill in SMTP details to actually send email
npm run dev
```

Server starts at `http://localhost:4000`. Without SMTP configured, submissions
are just printed to the console — good enough for local testing.

## Deploying

GitHub Pages can't run this. Pick any small Node host and point it at this
`backend` folder, for example:

- **Render** — new Web Service → connect the repo → root directory `backend` → build command `npm install` → start command `npm start`.
- **Railway** or **Fly.io** — similar process, both have free tiers.

Once deployed, set the environment variables from `.env.example` in your
host's dashboard, then update `CONTACT_API_URL` in
`frontend/src/main.js` to point at your deployed URL (e.g.
`https://your-backend.onrender.com/api/contact`) before rebuilding the
frontend.

## If you'd rather skip a backend entirely

The contact form is optional. You could instead point the form at a service
like Formspree or Getform (no server needed), or just delete the `<form>`
block from `frontend/index.html` and keep the mailto/tel/LinkedIn links —
the rest of the site doesn't depend on this folder at all.
