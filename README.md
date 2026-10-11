# Municipal Assessor's Office — public website

Public website for Polangui with services, requirements, announcements and protected email requests. Office pages, employee login, office APIs, database clients and private GIS records remain in the original development checkout.

See [PUBLIC-SUBMISSION-SETUP.md](PUBLIC-SUBMISSION-SETUP.md) for private protection settings, safeguards, limits and activation gates. Email submissions require existing SMTP settings plus Cloudflare Turnstile and shared Upstash counters. Missing protection fails closed.

Use Node.js 24. Run npm ci --ignore-scripts, npm run build and npm test. Offline tests block remote services and verify the sole public email API and refusal of internal routes. Never commit environment files or push the original office checkout for public releases.
