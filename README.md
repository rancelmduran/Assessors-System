# Municipal Assessor's Office - Polangui, Albay (Phase 1)

Next.js (App Router) public website + employee login. Vercel-ready.

## Install
    npm install
    cp .env.example .env.local

## Generate secrets for .env.local
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    node -e "console.log(Buffer.from(require('bcryptjs').hashSync(process.argv[1],10)).toString('base64'))" "YourStrongPassword"

First output -> AUTH_SECRET. Second output -> EMPLOYEE_PASSWORD_HASH_B64.

## Run
    npm run dev      # http://localhost:3000
    npm run build
    npm start

## Deploy
Add the same variables from .env.example in Vercel: Project Settings -> Environment Variables.

## Content
Placeholder Mission, Vision, Org Chart and request types live in lib/config.js.
