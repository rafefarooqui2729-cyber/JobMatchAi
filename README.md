# JobMatch AI

JobMatch AI is a full-stack recruitment application for transparent, explainable job recommendations, with candidate, employer, and administrator workflows.

## Stack

- **Frontend:** React, Vite, JavaScript, Tailwind CSS, React Router, Axios, Framer Motion
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Multer, Socket.IO
- **Repository:** npm workspaces, with independently runnable `frontend` and `backend` packages

## Requirements

- Node.js 20.13 or newer
- npm 10 or newer
- MongoDB is required to run the backend and its database-backed application workflows. Automated backend tests use an isolated in-memory database by default.

## Setup

From the repository root, install dependencies for both workspaces:

```bash
npm install
```

Copy the environment examples before running the apps:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

The examples contain development defaults/placeholders only. Replace them with appropriate local values before adding features that consume those settings.

Set `MONGODB_URI` in `backend/.env` to the full MongoDB connection URI for your local or hosted database. For a local unauthenticated MongoDB instance, the example URI can be used. Then test connectivity with:

```bash
npm run db:test --workspace backend
```

Authentication uses an HttpOnly, SameSite=Strict JWT cookie. Set `JWT_SECRET` in `backend/.env` to a cryptographically random value of at least 32 characters. Admin accounts are not publicly registered; create/provision a `User` with the `admin` role through a controlled operator process.

Authentication integration tests run against an isolated in-memory MongoDB by default. Alternatively, set `MONGODB_TEST_URI` to a dedicated test database URI (the database name must contain `test`) and run:

```bash
npm run test:auth --workspace backend
```

## Run both apps

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:5000/api/health>

The Vite development server proxies `/api` requests to the backend.

The reusable frontend component library and responsive reference page are available at <http://localhost:5173/design-system>. Components and shared design/motion tokens live under `frontend/src/components/ui/` and `frontend/src/design-system/`.

The component entry point is `frontend/src/components/ui/index.js`. Shared palette, spacing, radius, shadow, and animation variants live in `frontend/src/design-system/tokens.js` and `motion.js`.

Candidate profile management is available at `/candidate/profile` after signing in with a candidate account. The authenticated API is `GET` and `PATCH /api/candidate/profile`; its completion percentage is computed from the profile's meaningful fields.

Employer workspace features are available at `/employer/dashboard` after signing in with an employer account. Employers can update their linked company at `/employer/company` (including PNG, JPEG, or WebP logos up to 3 MB), and create, edit, publish, close, and delete their own job listings. Employer APIs are under `/api/employer`; job access is scoped to the authenticated employer. Run the in-memory MongoDB integration checks with:

```bash
npm run test:employer --workspace backend
```

The deterministic rule-based matching service is available in `backend/src/services/job-matching.service.js`. It accepts a candidate profile and job, returns weighted category scores, skill matches/gaps, match strength, and a human-readable explanation. The centralized category weights are in `backend/src/services/matching.config.js`; recommendations use this same engine without AI/ML. Run its unit tests with:

```bash
npm run test:matching --workspace backend
```

Public job discovery is available at `/jobs`, with published job details at `/jobs/:jobId`. The search API is `GET /api/jobs` with validated title, skill, location, employment type, experience-range, salary/currency, sort, and pagination parameters. Relevance sorting uses MongoDB text-index score only; it does not calculate personal match scores. Run the search integration checks with:

```bash
npm run test:job-discovery --workspace backend
```

Personalized recommendations are available on the candidate dashboard and are computed from the current candidate profile using the rule-based matching service. `GET /api/candidate/recommendations` ranks active published jobs by match score (then required-skill coverage, role preference, and publication time); closed, expired, and past-deadline jobs are excluded. `GET /api/candidate/recommendations/:jobId` returns protected score details. Candidate actions are real API operations: `PUT`/`DELETE /api/candidate/saved-jobs/:jobId` and `POST /api/candidate/jobs/:jobId/applications`. Recommendations are calculated on demand and are not persisted. Test the recommendation, match detail, save, and apply flows with:

```bash
npm run test:recommendations --workspace backend
```

Authenticated real-time updates use Socket.IO at `/api/socket.io`, authenticated with the same HttpOnly session cookie as the REST API. Each connection is joined server-side to only its own `user:<id>` room; clients cannot join arbitrary rooms. Candidate profile/resume changes emit recalculated recommendations, newly published matching jobs emit job-match and refreshed-ranking events, applications notify the employer, and employer status changes emit candidate status/shortlist/rejection events. The browser reconnects automatically and refreshes recommendations after reconnect; REST remains the fallback while disconnected. `PATCH /api/employer/applications/:applicationId/status` supports `under-review`, `shortlisted`, `rejected`, and `hired`, with ownership enforced against the employer's job.

Candidates can upload PDF and DOCX resumes from `/candidate/profile`. The authenticated API uses `POST /api/candidate/profile/resume` with a multipart `resume` field; `GET /api/candidate/profile/resume` returns the current resume metadata. Files are validated, stored privately with server-generated names, and parsed locally using text extraction and conservative rule-based field detection. The parser reports confidence/unknown fields, never stores extracted raw document text, and only adds sufficiently confident details that do not overwrite existing profile information. Scanned image-only PDFs are not OCR-processed. Resume uploads are limited to 5 MB. Run parser and upload API tests with:

```bash
npm run test:resume --workspace backend
```

## Run independently

After the root `npm install`, use either:

```bash
npm run dev:frontend
npm run dev:backend
```

Or work from either app directory and use its own scripts:

```bash
cd frontend
npm run dev
```

```bash
cd backend
npm run dev
```

The backend also supports `npm start` for its non-watch server process; the frontend supports `npm run build`.

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── sockets/
│   │   ├── app.js
│   │   └── server.js
│   └── .env.example
├── docs/
│   └── ARCHITECTURE.md
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries, planned data ownership, matching principles, and the staged implementation approach.

## Current scope

The application includes candidate, employer, and administrator workspaces. Candidates can manage profile visibility, upload private PDF/DOCX resumes, explore jobs, compare match explanations, save jobs, submit applications, review application history, and receive persisted notifications. Employers can manage company and job listings, review applicants, update application status, and download a resume only when the application belongs to one of their jobs and the candidate permits employer visibility. Administrators can review platform totals, search accounts, suspend/reactivate non-admin accounts, and pause or close jobs.

Application history, saved-job lists, notifications, employer applicant lists, and administration APIs are scoped to the authenticated user or role. Resume files remain outside the public static directory; application resume downloads resolve through an authenticated ownership check. Registration, login, and file uploads are validated and rate-limited.

Recommendations for newly published jobs are queued in-process and serialized; this is a best-effort convenience queue, not a durable job system. A process restart or multi-instance deployment can lose or duplicate queued recommendation work. Use a durable queue (for example, a managed message broker with idempotent consumers) before relying on this behavior in a multi-instance production deployment.

Run all backend automated checks with:

```bash
npm run test:all --workspace backend
```
