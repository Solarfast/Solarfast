# Running the SolarFast app

- **Frontend:** the `Start application` workflow runs the Vite app from `VOLTRAX/frontend` on port 5000.
- **API:** the `Backend API` workflow runs FastAPI from `VOLTRAX/backend` on port 8000. The frontend proxies `/api` requests to it.
- Frontend dependencies are listed in `VOLTRAX/frontend/package.json`; backend dependencies are listed in `VOLTRAX/backend/requirements.txt`.
