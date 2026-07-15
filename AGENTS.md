# Fabricator Agent Notes

Fabricator is a self-hosted Minecraft server manager. Keep this file minimal; it is only here to orient agents before they read the relevant code or docs.

## Structure

- `apps/backend/` - Python backend for auth, server management, Modrinth, backups, playit, and system utilities.
- `apps/cli/` - Fabricator CLI package and CLI tests.
- `apps/frontend/` - Product dashboard frontend.
- `apps/website/` - Marketing site and Fumadocs documentation site.
- `apps/website/content/docs/` - Canonical docs content. Start with `index.mdx`, `meta.json`, and each section's `meta.json`.
- `apps/website/content/docs/contributing/` - Contributor and development workflow docs.
- `apps/website/src/routes/` - Marketing, legal, and docs route entrypoints. Keep one-off marketing sections in the owning route.
- `apps/website/src/components/marketing/` - Shared marketing layouts, reused sections, and logic-heavy components only.
- `tests/` - Repo-level tests.
- `tools/`, `docker/`, `Dockerfile`, `docker-compose.yml` - Install, release, and deployment support.
- `assets/` - Shared project assets.

Ignore generated dependency/build folders such as `node_modules`, `dist`, `.output`, `.tanstack`, and `.source` unless debugging generated output.

## Docs

When changing user-facing behavior, install steps, configuration, CLI/API behavior, troubleshooting, architecture, or contributor workflow, update the matching docs in `apps/website/content/docs/` in the same change.

Keep root docs (`README.md`, `CONTRIBUTING.md`, `API_DOCS.md`) concise and pointed at the canonical Fumadocs pages.

The website publishes `tools/install.sh`, `tools/update.sh`, and `tools/uninstall.sh` as `/install.sh`, `/update.sh`, and `/uninstall.sh`; `apps/website/scripts/sync-public-scripts.mjs` keeps `apps/website/public/` in sync before dev/build/start.
