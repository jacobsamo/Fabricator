# Fabricator API Docs

The canonical HTTP API overview now lives in the website documentation:

- Source: [apps/website/content/docs/reference/http-api.md](apps/website/content/docs/reference/http-api.md)
- Published docs: <https://fabricator.site/docs/reference/http-api>

Keep this root file short. When backend routes, request/response shapes, auth behavior, or long-running job contracts change, update the Fumadocs page above in the same change.

## Backend Entry Points

- Flask app factory: `apps/backend/core/app.py`
- Server routes: `apps/backend/server/routes.py`
- Player routes: `apps/backend/server/players/routes.py`
- Modrinth routes: `apps/backend/modrinth/routes.py`
- Backup routes: `apps/backend/backups/routes.py`
- Auth routes: `apps/backend/auth/routes.py`
- System/update routes: `apps/backend/system/routes.py`
- playit.gg routes: `apps/backend/playit/routes.py`

Run the backend from source with:

```bash
python3 run.py
```

Then open the dashboard/API at `http://127.0.0.1:5000`.
