<div align="center">

<img src="apps/website/public/favicon.svg" alt="Fabricator Logo" width="92" height="92" />

# Fabricator

**Self-hosted web dashboard for managing Minecraft Java Edition servers.**

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/philderks/Fabricator?style=flat-square)](https://github.com/philderks/Fabricator/stargazers)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20Docker-lightgrey?style=flat-square)](https://github.com/philderks/Fabricator)
[![Docker](https://img.shields.io/badge/ghcr.io-philderks%2Ffabricator-2496ED?style=flat-square&logo=docker&logoColor=white)](https://github.com/philderks/Fabricator/pkgs/container/fabricator)

[Website](https://fabricator.site/) | [Documentation](https://fabricator.site/docs) | [Download](https://fabricator.site/download)

</div>

---

<div align="center">
  <img width="2560" height="1313" alt="Fabricator overview dashboard" src="https://github.com/user-attachments/assets/7ed784e6-eb1d-4305-bc98-3800a785fbc1" />
</div>

---

Fabricator helps you create and manage self-hosted Minecraft Java Edition servers from one focused browser UI. It supports Fabric, Quilt, NeoForge, Forge, and Vanilla workflows, with Modrinth content, player administration, files, logs, metrics, backups, playit.gg tunnels, and settings in the dashboard.

## Features

| Feature | Status |
| --- | --- |
| Server creation for Fabric, Quilt, NeoForge, Forge, and Vanilla | Available |
| Modrinth mod and modpack install flows | Available |
| Console, logs, status, and metrics | Available |
| Player, whitelist, operator, ban, IP ban, and kick controls | Available |
| File browser and text editor inside each server root | Available |
| Backups, restore, downloads, and world import | Available |
| playit.gg tunnel integration for home-hosted servers | Available on Linux |
| Native Linux installer and service CLI | Available |
| Windows executable | Available |
| Docker/GHCR image with persistent `/data` volume | Available |
| In-dashboard Fabricator self-update | Available |

## Install

The latest install options live on the download page:

- Linux one-line installer: <https://fabricator.site/download>
- Windows executable: <https://fabricator.site/download>
- Docker image and compose guidance: <https://fabricator.site/download>

Linux quick install:

```bash
curl -fsSL https://fabricator.site/install.sh | bash
```

Docker quick start:

```bash
docker run -d --name fabricator \
  -p 127.0.0.1:5000:5000 \
  -v fabricator-data:/data \
  --restart unless-stopped \
  ghcr.io/philderks/fabricator:latest
```

Open the dashboard, complete first-boot password setup, then keep the panel behind a firewall, VPN, or reverse proxy with TLS before exposing it beyond trusted machines.

## Documentation

The docs are now part of this repository in `apps/website/content/docs/` and published with the main website at:

<https://fabricator.site/docs>

Useful starting points:

- [Installation](https://fabricator.site/docs/getting-started/installation)
- [Docker](https://fabricator.site/docs/getting-started/docker)
- [Authentication](https://fabricator.site/docs/getting-started/authentication)
- [Dashboard overview](https://fabricator.site/docs/guides/dashboard-overview)
- [HTTP API overview](https://fabricator.site/docs/reference/http-api)
- [Contributing](https://fabricator.site/docs/contributing/contributing)

## Repository Layout

```text
Fabricator/
├── apps/backend/        # Flask API, server management, Modrinth, backups, auth, playit
├── apps/frontend/       # Vue 3 dashboard served by the backend in production
├── apps/cli/            # Fabricator system CLI package and tests
├── apps/website/        # TanStack/Fumadocs marketing and documentation site
├── tests/               # Repo-level integration and contract tests
├── tools/               # Install, update, uninstall, and release support scripts
├── docker/              # Docker support files
├── Dockerfile
├── docker-compose.yml
└── run.py               # Local/backend process entry point
```

## Development

For contributor setup, architecture, and docs workflow, start with:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [apps/website/content/docs/contributing/dev-setup.mdx](apps/website/content/docs/contributing/dev-setup.mdx)
- [apps/website/content/docs/contributing/architecture.mdx](apps/website/content/docs/contributing/architecture.mdx)

When behavior changes, update the matching docs in `apps/website/content/docs/` in the same change.

## License

[AGPL-3.0](LICENSE)
