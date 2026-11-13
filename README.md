# VR Asset Management Dashboard — Fixed Frontend

The React + TypeScript + Vite application is in `frontend/`.

## Windows setup
1. Start the ASP.NET Core API and note its local origin (for example `https://localhost:44371`).
2. Open PowerShell in this folder:

```powershell
cd frontend
Copy-Item .env.example .env
# Edit .env and set VITE_BACKEND_ORIGIN to the API origin
npm ci
npm run dev
```

3. Open `http://localhost:3000`.

For a production build run `npm run build`. The production API URL must be configured at build time using `VITE_API_BASE_URL`; Vite's proxy is development-only.
