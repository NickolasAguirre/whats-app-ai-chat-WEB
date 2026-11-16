<!-- bmad:context -->
<!-- Verified 2026-11-15 against 39e3650 (working tree has uncommitted changes). Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## whatsapp-chat-bot-WEB

Business module of the WhatsApp bot admin panel: a Native Federation remote (Angular 22, Tailwind 4, npm, Node 24) mounted by the host `../../Container/container.WEB`. UI text is Spanish, code is English. Talks to the bot's `/admin/*` endpoints, never to Rag-API directly.

## Policy

- Ask before `git push`. PR descriptions state what changed and why.
- Never discard uncommitted changes (`git checkout -- <file>`, `git restore`, `git reset --hard`); ask first — it once deleted uncommitted config.
- Never start or stop Docker containers or dev servers unless asked; the user runs their own.
- No shell, login, session or 404 in this repo; the host owns them.

## Where things are

- Angular and TypeScript code rules: `CLAUDE.md`. Cross-repo contracts: `../CLAUDE.md`.
- Federation exposes `./Routes` → `src/app/app.routes.ts` (export `routes`); `federation.config.mjs` defines it.

## Running and verifying

- `ng test` and a plain `ng build` overwrite `dist/`; for a federated build use `ng build --configuration development`.
- The standalone view runs on 4201 (host 4200). The bot URL is the `BOT_API_URL` token, default `http://localhost:3200`.

## Conventions that differ from defaults

- Providers (APIs) travel with the route in `app.routes.ts`. The host must supply `withComponentInputBinding()`, Spanish `LOCALE_ID`, and `provideHttpClient`; a route cannot carry them.
- `app.config.ts` and `src/styles.css` serve only the standalone view; keep `styles.css` in sync with the host's tokens.
- Data goes through ports in `core/domain/` (`abstract class`) with HTTP adapters in `infrastructure/http/`, wired as providers in `app.routes.ts`. There are no mock adapters; tests use fakes of the port.
- Build every in-module link from `APP_PATHS` (`src/app/app-paths.ts`), never a hardcoded `/conversations`: the routes live under the `whatsapp` prefix and `app-paths.spec.ts` checks the targets exist.

<!-- /bmad:context -->
