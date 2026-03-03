# Municipal Backend

## Render deployment

1. Push this `backend` repository to GitHub.
2. In Render, create a new Blueprint and point it to this repo.
3. Render will read `render.yaml` and create:
   - Web service `municipal-backend`
   - PostgreSQL database `municipal-db`
4. Set required environment variables in Render service:
   - `FRONTEND_URL` = your Vercel site URL (for CORS/CSRF)
   - `RENDER_EXTERNAL_HOSTNAME` = your Render hostname (without protocol also works)
5. Optional bootstrap users:
   - `DJANGO_SUPERUSER_EMAIL`
   - `DJANGO_SUPERUSER_PASSWORD`

The service uses `build.sh` for install/migrate/collectstatic and starts with Gunicorn.
