# Deploy Frontend to Netlify

Quick, copy-paste guide to deploy the `frontend/` folder to Netlify with runtime configuration.

Overview
- Frontend is static HTML/CSS/JS located in `frontend/`.
- We use a small runtime file `frontend/env.js` so the deployed site knows your backend URL without baking it into source.
- Netlify build step will run `generate-env.js` (included in repo) which writes `frontend/env.js` using the `API_BASE` environment variable.

Files in repo you’ll use
- `generate-env.js` — small script that writes `frontend/env.js` from `API_BASE` env var
- `frontend/env.js` (generated) — runtime config: `window.__ENV = { API_BASE: '...' }`
- `frontend/app.js` — reads `window.__ENV.API_BASE` (fallback to localhost)

Pre-reqs
- Repo pushed to GitHub (or GitLab).
- Netlify account.

Netlify site setup (Git-based deploy)
1. In Netlify, click **New site from Git** → Connect your Git provider → choose repository and branch.
2. Set build settings:
   - Build command: `node generate-env.js && echo "no-build"`
     - Explanation: `generate-env.js` writes `frontend/env.js` with the `API_BASE` value; the site is static so we use a no-op build after.
   - Publish directory: `frontend`
3. Add Environment Variable in Netlify (Site settings → Build & deploy → Environment):
   - `API_BASE` = `https://<your-render-backend>.onrender.com/api`
   - (Replace with the actual backend URL from Render)
4. Deploy site. Netlify will run the build command and publish the `frontend/` folder.

Quick manual deploy (for testing)
- Locally generate env and run a static server:

```bash
# in repo root
node generate-env.js            # writes frontend/env.js using local API_BASE (or set API_BASE=...)
npx serve frontend              # or any static server
# open http://localhost:5000
```

Optional: Netlify Drop
- You can drag-and-drop the `frontend/` folder to Netlify Drop for a one-off deploy, but you must generate `frontend/env.js` locally first (with `node generate-env.js`).

Security notes
- Do NOT put secrets (Supabase service_role key) in `frontend/env.js`.
- `API_BASE` should point to your backend's public API endpoint. Sensitive keys must remain server-side.

Troubleshooting
- If the site shows 404 for `env.js` check the Publish directory and that the build command created the file.
- Use DevTools Network tab to verify `env.js` and subsequent API requests are correctly formed.

Rollbacks
- Netlify keeps previous deploys in the Deploys tab — you can restore any working deploy quickly.

---

If you want, I can also add a Netlify `redirects` file or `netlify.toml` for more advanced configuration.