# Municipal Assessor's Office — public website

Public informational release for Polangui, Albay. Includes services, official requirements, notices, organizational chart, location and contact details.

The office system continues in the separate local development checkout. This release contains no office pages, employee login, API handlers, database clients, GIS records or migration tooling. Online submissions are unavailable; visitors are directed to contact or visit the office.

## Verify locally

Use Node.js 24. Run npm ci --ignore-scripts, npm run build, and npm test. For a local preview, use npm run dev. Run only one development server per checkout; stop it before building.

## Deployment

This public release uses the existing assessors-system Vercel project through its GitHub integration. No database, SMTP or authentication environment variables are required. Do not copy private environment files into this checkout or publish the internal office checkout.

Tests start a temporary loopback production server after a build and verify public content, PDFs, headers, and refusal of internal/API paths.
