# Contributing to Fabricator

Bug reports and pull requests are welcome. For larger changes, open an issue first so the design, migration path, and user impact can be discussed before implementation.

## Start Here

- Product/docs site: `apps/website/`
- Docs content: `apps/website/content/docs/`
- Backend: `apps/backend/`
- Dashboard frontend: `apps/frontend/`
- CLI: `apps/cli/`
- Repo-level tests: `tests/`

The full contributor docs live in the docs site:

- [Architecture](apps/website/content/docs/contributing/architecture.mdx)
- [Development setup](apps/website/content/docs/contributing/dev-setup.mdx)
- [Contributing guide](apps/website/content/docs/contributing/contributing.mdx)

## Local Development

Backend:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 run.py
```

Dashboard frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

Marketing and docs site:

```bash
cd apps/website
bun install
bun run dev
```

Useful checks:

```bash
pytest
cd apps/website && bun run types:check && bun run lint && bun run build
```

## Documentation Expectations

Update `apps/website/content/docs/` in the same change when you change:

- install or update behavior
- environment variables or config files
- CLI commands
- backend API contracts
- user workflows in the dashboard
- contributor setup, architecture, or repo structure

Keep root files such as `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `API_DOCS.md` as concise entrypoints that point to the canonical docs site.

## Pull Requests

- Keep changes focused.
- Add or update tests for backend behavior and API contracts.
- Run the relevant checks before opening a PR.
- Call out docs updates, migrations, and any manual verification in the PR description.

## Contributor License Agreement

By submitting a pull request, you agree to the following:

1. **You have the right to submit the contribution.** The work is your own and you are legally entitled to grant the rights described below.

2. **You grant Philipp Noél Derks and Linus Sommermeyer a perpetual, worldwide, non-exclusive, royalty-free license** to use, reproduce, modify, sublicense, and distribute your contribution under any license, including commercial licenses, without further obligation to you.

3. **Your contribution is submitted under AGPL-3.0.** All contributions to this repository are licensed to the public under the [GNU Affero General Public License v3.0](LICENSE).

4. **You understand that your contribution may be used commercially.** Philipp Noél Derks and Linus Sommermeyer reserve the right to offer Fabricator under additional or alternative licenses, including for commercial purposes.

By merging a pull request, the contributor confirms acceptance of these terms.
