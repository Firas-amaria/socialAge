# SocialAge Frontend

Static HTML/CSS/JS served by a lightweight Express server.

## Setup
1. `cd frontend`
2. `npm install`

## Scripts
- `npm start` - serve `pages/index.html` on http://localhost:3000 and auto-open browser

## Environment
- `PORT` - frontend server port (default: 3002)
- `API_BASE_URL` - backend base URL used by the API client
- `DEMO` - set to `true` to use the in-browser fake API instead of real requests

Place new pages under `frontend/pages/` and assets under `frontend/css` and `frontend/js`.
