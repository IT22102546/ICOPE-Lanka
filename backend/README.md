# ICOPE Backend

Node.js + Express + MongoDB backend for ICOPE Lanka mobile and admin dashboard.

## Setup

1. Copy `.env.example` to `.env`
2. Update MongoDB URI and JWT secret
3. Install dependencies
4. Run server

## MongoDB Atlas notes

- Use a `Database Access` user from Atlas, not your Atlas account login.
- If the password contains special characters like `@`, `:`, `/`, `?`, or `#`, URL-encode them in `MONGODB_URI`.
- Make sure your current IP is allowed under `Network Access`.
- A typical URI looks like:

`mongodb+srv://your_db_user:your_db_password@icope-lanka.4fjggi7.mongodb.net/icope-lanka?retryWrites=true&w=majority&appName=ICOPE-Lanka`

## Commands

- `npm install`
- `npm run dev`

## Seed behavior

On startup, backend ensures one `SUPER_ADMIN` user exists using env credentials.
