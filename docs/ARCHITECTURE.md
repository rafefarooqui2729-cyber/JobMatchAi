# JobMatch AI Architecture

## 1. Purpose and scope

JobMatch AI will help graduates evaluate how well job requirements align with their candidate profile. Recommendations will use a deterministic, rule-based scoring model whose category scores and evidence can be inspected by candidates and employers. The system will not describe rule-based matching as machine-learning or AI inference.

This document describes the architecture and delivery boundaries. Implemented product areas include the frontend and API foundation, authentication, candidate and employer profiles, job management/discovery, transparent matching, resume parsing, and on-demand candidate recommendations. Other planned modules remain future work.

## 2. System context

```text
Candidate / Employer / Admin browser
                 |
        React single-page app
         | REST (Axios) | Socket.IO
         +--------------+-----------------+
                                        Node.js / Express API
                                        |       |        |
                                  MongoDB   Resume     Socket.IO
                                  (Mongoose) extraction events
```

- The frontend and backend are separate deployable applications.
- REST is the source of truth for commands and query results.
- Socket.IO is an event-delivery channel for updates; clients should recover current state through REST after reconnecting.
- MongoDB is the persistent store, accessed through Mongoose models and the configured database connection.
- Resume extraction is an adapter boundary. The current local PDF/DOCX extractor and rule-based parser return best-effort structured data and confidence; they do not claim perfect extraction or OCR scanned documents.
- Public job discovery filters published jobs using indexed fields and bounded pagination. Text relevance is a generic MongoDB text score, separate from candidate-specific scores produced by the matching service.
- Candidate recommendations score eligible published jobs through the matching service at request time, filter closed/expired/past-deadline jobs, and rank by match score with deterministic tie-breakers. They are not persisted; save and apply operations use their dedicated relationship records.
- Socket.IO authenticates the HttpOnly session cookie at `/api/socket.io`, verifies the active database user and role, then assigns the connection to a server-controlled per-user room. Domain events are emitted only to the candidate or employer associated with the corresponding persisted records; REST remains the fallback and source of truth.

## 3. Repository layout

```text
frontend/
  src/
    api/                 Axios instance and future API modules
    app/                 Future app-level providers and route configuration
    components/          Shared presentation components
    features/            Candidate, employer, and admin feature modules
    pages/               Route-level screens
    App.jsx              Current route shell
    main.jsx             Browser entry point
    index.css            Tailwind directives and global styles
  .env.example
  vite.config.js
backend/
  src/
    config/              Environment and future database configuration
    middleware/          Error handling and future auth/validation middleware
    modules/              Future domain modules and route handlers
    routes/              API route composition and health endpoint
    services/             Matching, resume extraction/parsing, and notification services
    sockets/              Socket.IO server setup and future event handlers
    app.js                Express middleware and route registration
    server.js             HTTP server and Socket.IO composition
  .env.example
docs/
  ARCHITECTURE.md
```

Feature modules should own their routes/controllers, request schemas, and domain services. Cross-cutting concerns (configuration, errors, authorization, persistence, and socket delivery) remain centralized. Keep transport concerns out of matching and resume-domain logic.

## 4. Planned domain boundaries

| Area | Responsibility |
|---|---|
| Identity and access | User identity, password credentials, JWT lifecycle, role authorization, and account status |
| Candidate profile | Education, experience, skills, projects, certifications, preferences, and profile completion |
| Employer and company | Organization identity, employer membership, and company profile |
| Jobs | Job requirements, publication status, location, compensation, and employment type |
| Matching | Versioned scoring configuration, normalized comparisons, category evidence, and explanations |
| Resume | Secure upload metadata, extraction adapter, parse results, and candidate-approved profile updates |
| Applications | Application lifecycle, employer decisions, and candidate tracking |
| Saved jobs | Candidate-to-job saves without duplicating job details |
| Notifications | Durable in-app notification records and real-time delivery hints |
| Administration | Platform oversight, moderation, reporting, and aggregate analytics |

Candidate-facing recommendation routes are protected by candidate role authorization. Match details are recalculated from the current profile/job records, so the UI does not display stale persisted scores. Applications are unique per candidate/job and record the score at submission time; saved jobs store only the candidate/job relationship.

## 5. Data ownership and persistence

Planned MongoDB collections and key relationships:

- **User** owns authentication identity and a role (`candidate`, `employer`, or `admin`). Credentials are stored only as password hashes.
- **CandidateProfile** references one User and owns candidate-authored personal/location details, canonical skill references, education, experience, projects, certifications, job preferences, and the current resume reference. Profile completion is a derived score and is not persisted.
- **EmployerProfile** references one User and a Company; a Company may have multiple authorized employer users.
- **Company** owns shared organization details.
- **Job** references its Company and creator; it owns requirements and publication state.
- **Application** references a Job and CandidateProfile and owns application-specific status/timestamps. A uniqueness rule should prevent duplicate active applications for the same candidate and job.
- **SavedJob** references a CandidateProfile and Job; it stores the relationship, not a copy of job fields.
- **Resume** references a CandidateProfile and stores storage metadata, processing status, and extraction provenance. Uploaded file bytes should live in controlled file/object storage rather than ordinary MongoDB documents.
- **Skill** provides a canonical skill catalog and aliases to support normalization.
- **Notification** references its recipient and stores durable notification content/state.
- **Recommendation** is optional derived data. If persisted for performance, it must include the scoring-config version and be safely recomputable from source profile/job data.

Use schema validation and indexes for ownership, common query paths, and uniqueness constraints. Avoid copying candidate/job profiles into application records; store only application-specific snapshots when a documented audit requirement needs them.

## 6. Transparent matching model

The initial configurable category weights are:

| Category | Weight |
|---|---:|
| Skills | 50% |
| Experience | 20% |
| Education | 15% |
| Projects | 10% |
| Location | 5% |

Weights belong in one versioned server-side configuration module, not in UI code or individual route handlers. Validate that all weights are non-negative and sum to 100% before scoring.

For a job, normalize candidate and job skills using canonical IDs/aliases (case, whitespace, and punctuation normalization alone is not sufficient for synonyms). Required and preferred skills are reported separately. A proposed skills category score is:

```text
requiredCoverage = matchedRequired / requiredCount
preferredCoverage = matchedPreferred / preferredCount
skillsScore = 100 * (
  requiredWeightWithinSkills * requiredCoverage
  + preferredWeightWithinSkills * preferredCoverage
)
```

When a skill list is empty, use an explicitly documented neutral/unknown policy rather than divide by zero. Likewise, unavailable candidate experience, education, project, or location data must be distinguishable from a confirmed mismatch. The final policy for unknown data and within-category weighting must be decided and tested before implementing the matching module.

The overall score is the weighted sum of category scores. Round only for presentation; retain sufficient precision for sorting. Return a deterministic result containing the overall score, scoring-config version, category scores, matched skills, missing required/preferred skills, and a plain-language explanation tied to evidence. No score should be presented without its component evidence.

## 7. API and real-time conventions

- Prefix REST endpoints with `/api`; version the API before incompatible public contract changes.
- Validate request bodies, query parameters, and route identifiers at the boundary.
- Return consistent JSON error envelopes; expose safe messages and keep stack traces in server logs only.
- Authenticate protected requests and authorize actions by role and resource ownership.
- Store browser sessions only in an HttpOnly, Secure-in-production, SameSite=Strict cookie; never expose the JWT to frontend JavaScript. Enforce the configured browser origin on authentication requests and re-check the active user and role for protected API requests.
- Candidate and employer self-registration create their profile records alongside the User. Administrator accounts are provisioned through an operator-controlled process; public admin registration is not available.
- Use REST for durable state changes. Socket.IO events announce changes (for example, application status or a newly available recommendation); they do not replace authorization or persistence.
- Scope socket rooms to authenticated users/roles after authentication is implemented. Do not broadcast private candidate data globally.
- Add pagination and bounded filters for job, application, and admin listing endpoints.

The current health route is `GET /api/health`. The server attaches Socket.IO, but no product events or unauthenticated private channels are implemented.

## 8. Security and operational foundations

- Keep secrets and deployment-specific URLs in environment variables; `.env` files are ignored by Git.
- Hash passwords with bcrypt when identity is implemented. Never return credential fields from API responses.
- Restrict CORS to configured frontend origins; use TLS in deployed environments.
- Apply baseline security headers, bounded JSON payload size, and API rate limiting.
- Resume uploads accept text-based PDF and DOCX only, with a 5 MB cap, MIME/extension plus signature/container checks, bounded page/archive sizes, server-generated filenames, and storage outside public static paths. Raw resume text is not persisted. Add malware scanning when selecting deployment storage; never trust the client-supplied MIME type alone.
- Log operational failures with request correlation context while excluding passwords, tokens, resume contents, and other sensitive data.
- Add health/readiness checks, metrics, structured logging, and database lifecycle handling as deployment needs are defined.

## 9. Frontend architecture and experience

React Router owns navigation; feature modules own route screens and local UI behavior. Axios is configured in one API client so base URL, credentials, and future token refresh/error handling are not duplicated. Shared components should preserve accessible contrast, keyboard operation, reduced-motion preferences, loading/error/empty states, and responsive layouts.

The visual system is based on deep navy, white, soft blue, and neutral surfaces, with success/warning/error colors reserved for semantic states. The initial screen is only a branded foundation shell, not a dashboard or job portal.

## 10. Staged delivery

1. **Foundation:** independent frontend/backend packages, environment examples, app shells, API health endpoint, shared error handling, Socket.IO attachment, run scripts, and architecture documentation.
2. **Identity and profiles:** schemas, validation, authentication, roles, and candidate/employer profile editing.
3. **Jobs and employer workflows:** company/job management and search.
4. **Matching:** scoring config, deterministic engine, explanations, and focused tests.
5. **Resume pipeline:** secure PDF/DOCX upload, extraction, confidence-aware profile updates, and manual profile review. Recommendation refresh remains a later step.
6. **Applications and notifications:** application lifecycle, employer decisions, persistence, and scoped real-time updates.
7. **Administration and production hardening:** reporting, moderation, observability, deployment controls, and end-to-end verification.

Each stage should add tests around authorization, validation, ownership, and observable behavior before proceeding to the next.
