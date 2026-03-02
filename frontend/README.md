# SocialAge Frontend

Static HTML/CSS/JS served by a lightweight Express server.

## Setup
1. `cd frontend`
2. `npm install`

## Scripts
- `npm start` - serve `pages/index.html` on http://localhost:3002 and auto-open browser
- `npm run dev` - same as start but auto-restarts `server.js` on changes

## Environment
- `PORT` - frontend server port (default: 3002)
- `API_BASE_URL` - backend base URL used by the API client
- `.env` - optional local overrides loaded from `frontend/.env`

Place new pages under `frontend/pages/` and assets under `frontend/css` and `frontend/js`.
Route mapping lives in `frontend/routes.json` as URL -> page file.
