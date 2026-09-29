# Zedu Tasks

A focused to-do list with notes, priorities, categories, due dates, filtering, and progress insights. The stack is React, FastAPI, and MySQL and is packaged for Docker Compose/Dokploy.

## Run with Docker

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Open <http://localhost:3000>. The API documentation is available at <http://localhost:8000/docs> during local deployment.

## Development

Backend:

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set `DATABASE_URL` when running the backend outside Compose. Set `VITE_API_URL` if the API is not available at `/api`.

## Dokploy

Create a Compose application from this repository using `./docker-compose.yml`, copy the variables from `.env.example` into Dokploy's environment settings, and replace every example password. Add a Dokploy domain for the `frontend` service with container port `80`; no host ports need to be reserved. The included Nginx configuration routes `/api` to the private backend service. MySQL data is persisted in the named `mysql_data` volume.

`docker-compose.local.yml` is only for local development and restores the localhost port mappings. Do not add it to the Dokploy Compose path.
