# SocialAge Backend

Node.js + Express API with MongoDB and JWT auth.

## Setup
1. `cd backend`
2. `npm install`
3. Create `.env` with: `PORT`, `MONGO_URI`, `JWT_SECRET`, `DEEPSEEK_API_KEY`.

## Scripts
- `npm start` - run server with dotenv
- `npm run dev` - run with nodemon (auto-restart)

## Email upload
Set these in `.env` to enable the image upload email route:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (SMTP credentials)
- `MAIL_FROM` (sender address; defaults to SMTP user)
- `MAIL_TO` (default recipient if not provided in request)

Endpoint: `POST /mail/upload` with `multipart/form-data` field `image` (max 5MB), optional `to`, `subject`, `text`. No auth required.
