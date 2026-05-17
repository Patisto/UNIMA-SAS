# Deploy Backend to Render

Step-by-step guide to deploy the Node/Express backend (`backend/server.js`) to Render.com.

Overview
- Backend is a Node Express app using Supabase server credentials.
- Deploy on Render as a Web Service so Render sets a public HTTPS URL and provides `PORT`.
- Keep your Supabase `service_role` key secret — store it in Render environment variables.

Pre-reqs
- Code pushed to GitHub (or GitLab).
- Render account.

Create the Render service
1. In Render dashboard click **New** → **Web Service** → **Connect account** (GitHub/GitLab) → pick your repo and branch.
2. Configure service
   - Name: `sas-backend` (or your preferred name)
   - Instance type: `Starter` is fine for small projects
   - Environment: `Node` (Render detects Node automatically)
   - Build command: leave blank or `npm install` (Render auto-installs deps)
   - Start command: `node server.js`
   - Root directory: `backend` (if required by Render UI; otherwise it will detect package.json)
3. Add Environment Variables (Dashboard → Environment)
   - `SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<service_role_key>` (PRIVATE)
   - `SUPABASE_ANON_KEY` = `<anon_key>` (optional)
   - `ADMIN_KEY` = `sas-admin-2025` (optional; recommended to move admin checks server-side only)
4. Advanced: Add a Health check path `/health` (you can add this endpoint to `server.js`) so Render can monitor readiness.

Deploy
- Click **Create Web Service**. Render will build and deploy.
- Once deployed, Render shows the public URL: e.g. `https://sas-backend.onrender.com`.

CORS & API_BASE
- In frontend runtime config (Netlify `API_BASE`) set the API base to `https://sas-backend.onrender.com/api`.
- Make sure CORS is enabled in `server.js` (the repo already uses `cors()` with default settings).

Security and Best Practices
- Keep `SUPABASE_SERVICE_ROLE_KEY` in Render secrets only — never commit it.
- Consider replacing the simple `ADMIN_KEY` client-side check with server-side authentication or an admin-only UI.
- Enable TLS/HTTPS (Render does by default) and review Supabase policies (RLS) for production safety.

Logs and debugging
- Use Render Logs on the service page to view runtime errors and print statements.
- If a Supabase insert fails with RLS errors (e.g. "new row violates row-level security"), ensure your server is using the service role key, not the anon key.

Rollback
- Render keeps previous deploys — use the Dashboard to rollback to a previous deploy if needed.

Optional: Add a small health endpoint
```js
app.get('/health', (req, res) => res.json({ ok: true }));
```

---

If you want, I can also:
- Add a short `dockerfile` if you prefer container-based deploys on Render.
- Replace the client-exposed `ADMIN_KEY` with a server login flow and cookie-based auth.