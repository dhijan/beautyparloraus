# Docker Setup

This setup runs three containers:

- `db`: PostgreSQL with the project schema and seed data.
- `backend`: Express API on port `5000`.
- `frontend`: Nginx serving the React build on port `8080` and proxying `/api` to the backend.

## First Run

1. Copy the Docker environment example:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and replace every `change_this...` value. For local development, the default admin login is `admin` / `admin`.

3. Start everything:

   ```powershell
   docker compose up --build
   ```

4. Open:

   ```text
   http://localhost:8080
   ```

## Database Initialization

On the first run only, PostgreSQL executes:

- `backend/src/db/schema.sql`
- `backend/src/db/seed.sql`

Those scripts are not rerun if the Docker volume already exists.

To recreate the database from the current seed data:

```powershell
docker compose down -v
docker compose up --build
```

This deletes the Docker database volume, so only use it when you want a fresh database.

If logs say `Skipping initialization`, Docker is reusing an existing database volume. That is normal after the first run.

## Moving Real Data To Another Machine

Export from your local PostgreSQL database:

```powershell
pg_dump -U postgres -h localhost -d beauty_parlour_db -Fc -f beauty_parlour_db.dump
```

After your friend starts the Docker database once, copy the dump file to their machine and restore it:

```powershell
docker compose cp beauty_parlour_db.dump db:/tmp/beauty_parlour_db.dump
docker compose exec db pg_restore -U beauty_user -d beauty_parlour_db --clean --if-exists /tmp/beauty_parlour_db.dump
```

If you only want base-level demo data, share the repo with `schema.sql` and `seed.sql`; Docker will load those automatically on first run.

## Secrets

Do not share your real `.env` files. Create a fresh root `.env` from the example, use new admin credentials, and rotate any API keys that were previously exposed.
