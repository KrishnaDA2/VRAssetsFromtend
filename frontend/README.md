# VR Asset Management Frontend

React 18 + TypeScript + Vite frontend for the VR Asset Management ASP.NET Core API.

## Requirements
- Node.js 20 or newer (Node 22 is supported)
- npm
- Running `VRAssetManagement.Api`

## Setup (Windows PowerShell)

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
```

Edit `.env` and set `VITE_BACKEND_ORIGIN` to the exact HTTPS or HTTP origin shown by the ASP.NET Core API, without `/api/v1` at the end. Example: `https://localhost:44371`.

Run the API first. If using the ASP.NET Core development HTTPS certificate, trust it on Windows:

```powershell
dotnet dev-certs https --trust
```

Then start the frontend:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Production build

```powershell
npm run build
npm run preview
```

For production hosting, configure `VITE_API_BASE_URL` to the public API base URL (for example `https://api.example.com/api/v1`) at build time. Configure the API CORS policy for the frontend origin. Vite's development proxy is not used in production.

## Backend route contract used by this frontend
- `POST /api/v1/auth/login`
- `GET /api/v1/companies`
- `GET|POST /api/v1/companies/{companyId}/projects`
- `GET|POST /api/v1/projects/{projectId}/models`
- `GET|POST /api/v1/models/{modelId}/versions`
- `POST /api/v1/versions/{versionId}/files` (multipart form field: `file`)
- `GET /api/v1/versions/{versionId}/files/{fileId}/download`
- `GET|POST /api/v1/versions/{versionId}/comments`

The API remains the authorization authority. UI role checks only hide unavailable controls; they do not replace backend `[Authorize]` and project-membership checks.

## Role mapping
- `Admin` -> `admin`
- `Developer` -> `developer`
- `3DArtist` or `3D Artist` -> `artist`

Do not use mock credentials in a real deployment. The app requires a valid API login and JWT.
