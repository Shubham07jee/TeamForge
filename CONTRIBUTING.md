# Contributing to TeamForge
Thank you for your interest in contributing to TeamForge.
## Before you start
- Check existing issues and pull requests.
- For significant changes, open an issue first to discuss the proposal.
- Keep changes focused and explain their purpose.
## Development setup
Follow the setup instructions in [README.md](README.md).
The project has two applications:
- `frontend/` — React and Vite
- `backend/` — Express, Prisma, and PostgreSQL
## Branching
Create a branch for your change:
```bash
git checkout -b feature/short-description
```
Suggested branch prefixes:
- `feature/` for new functionality
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code restructuring
- `chore/` for maintenance
## Code changes
- Follow the existing JavaScript and React conventions.
- Avoid unrelated formatting changes.
- Do not commit `.env` files, credentials, generated build output, or personal backups.
- Update documentation when behavior or setup instructions change.
- Keep accessibility and responsive behavior in mind.
## Validation
For frontend changes, run:
```bash
cd frontend
npm run lint
npm run build
```
For backend changes, run:
```bash
cd backend
node --check src/server.js
```
If your change affects database models, review the Prisma schema and migration implications.
There is currently no configured automated backend test suite. Include clear manual verification steps in your pull request when appropriate.
## Commit messages
Use clear, descriptive commit messages.
Examples:
```text
feat(profile): add profile editing
fix(tasks): correct task status updates
docs(readme): update local setup instructions
chore(ci): add frontend validation workflow
```
## Pull requests
A pull request should include:
- A clear explanation of the change.
- The reason the change is needed.
- Relevant issue references.
- Validation performed.
- Screenshots for meaningful UI changes.
- Any configuration or migration implications.
Keep pull requests focused and avoid including unrelated backup files.
## Reporting bugs
Use the repository's bug report issue template.
For security vulnerabilities, contact the maintainer privately instead of publishing sensitive exploit details.
Thank you for helping improve TeamForge.
