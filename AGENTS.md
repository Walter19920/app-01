# AGENTS.md — app-01

This file contains compact guidance for future OpenCode sessions. Each line answers:
"Would an agent likely miss this without help?"

## Commands

| Action                    | Command                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| Start dev server          | `ng serve` (or `npm start`)                                         |
| Build client              | `ng build` (or `npm run build`)                                     |
| Build + watch             | `ng build --watch --configuration development` (or `npm run watch`) |
| Run unit tests            | `ng test` (or `npm test`)                                           |
| Run SSR server            | `npm run serve:ssr:app-01` (starts `dist/app-01/server/server.mjs`) |
| Generate Angular artifact | `ng generate component/pipe/directive name`                         |

## Project structure

- **App code** lives under `src/app/` — root component `App` (standalone, signal-based) renders the header + `<router-outlet>`.
- **Pokédex feature**: `src/app/pokedex/` → `pokedex.interface.ts` (types), `pokedex.service.ts` (HTTP + cached catalog), `list/`, `detail/`.
- **SSR entrypoints**: `src/main.server.ts` (bootstraps SSR) and `src/server.ts` (Express + AngularNodeAppEngine).
- **Build output**: `dist/browser/` for the client, `dist/app-01/server/` for SSR.
- **SSR serves** from the `browser` folder via Express static serving (see `server.ts` line 30).
- **Routes**: `src/app/app.routes.ts` → `''` (renders the list), `/pokedex`, `/pokedex/detail` (query param `?id=`, never a path param — see Quirks), `**` → redirect. Server/prerender routes are in `src/app/app.routes.server.ts` (everything prerenders).

## Component conventions (enforced structure)

Each functional component must follow this pattern:

- **Component TS**: `src/app/<component-name>/<component-name>.ts` — class only, no template inline.
- **Component HTML**: `src/app/<component-name>/<component-name>.html` — template must be in a separate file (never inline `template:` or `templateUrl:` inline).
- **Component interface**: `src/app/<component-name>/<component-name>.interface.ts` — TypeScript interface defining the component's input/signals shape.
- **Component styles**: `src/app/<component-name>/<component-name>.css` — optional, per-component styles.
- **Generated service** (if needed): `src/app/<component-name>/<component-name>.service.ts` — standalone service with its own interface.

**Why this matters**: The Angular CLI schematic `ng generate component` already separates HTML into `.html` files, but the interface and service patterns are team-enforced. Without explicit structure, agents may create components with inline templates or miss the interface file entirely.

**Verification**: After generating a component, confirm the folder contains: `.ts`, `.html`, and optionally `.interface.ts` and `.service.ts`.

## Test runner

- Tests use **Vitest** via Angular's unit-test builder (`ng test`).
- The `tsconfig.spec.json` adds `vitest/globals` types.
- Test files follow the pattern `*.spec.ts` and are **excluded** from `tsconfig.app.json` (only `tsconfig.json` references them).

## Build / test / lint ordering

This repo currently does not have a dedicated lint script in `package.json`, but the Angular CLI enforces:

1. `ng build` (type-checks as part of build)
2. `ng test` runs unit tests

If you add a lint script (e.g., `ng lint`), run it **before** `ng test` to catch formatting issues early.

## Deployment (GitHub Pages)

- **Workflow**: `.github/workflows/deploy.yml` — push to **`master`** (default branch is `master`, not `main`) or manual `workflow_dispatch`. Job `test` (prettier + `ng test -- --watch=false`) gates job `deploy` via `needs`.
- **Action**: `bitovi/github-actions-angular-to-github-pages@v1.0.0`. It interpolates `install_command` + `build_command` into a **bash** step, so `&&` chaining in `build_command` is safe.
- **Node 24 is pinned (`actions/setup-node`) BEFORE the action** — `@angular/cli` engines demand `^22.22.3 || ^24.15.0 || >=26`, which the runner's default Node does not meet. The workflow checks out first and passes `checkout: false` so `setup-node` can cache npm from `package-lock.json`.
- **`path: dist/app-01/browser` is fixed to the project name** — the action's default path uses the _repo_ name, but Angular's output directory comes from `angular.json`.
- **`build_command`** = `npm run build -- --base-href=/<repo-name>/ && cp …/index.csr.html …/404.html`. Pages serves under `/<repo>/`, and the `404.html` (CSR shell) lets the Angular router handle unknown URLs (Pages serves it with status 404; the `**` route redirects to `/pokedex`).
- **One-time repo setup**: Settings → Pages → Source = **GitHub Actions**, otherwise `deploy-pages` fails.
- **`path: ''` renders the list instead of `redirectTo`** — redirect routes are NOT prerendered, so `/` would ship without `index.html` and Pages would 404 the home URL.
- **Pages 301s directory URLs**: `/pokedex/detail?id=25` → `/pokedex/detail/?id=25` (query **preserved** — verified with curl against a real Pages site). Angular Router matches trailing-slash URLs, so deep links survive; don't drop the `?id=`.

## Quirks & gotchas

- **⚠️ The app is ZONELESS** — there is no `zone.js` dependency and no `polyfills` in `angular.json`. Assigning a plain class property inside a `subscribe()`/`setTimeout()` does **NOT** trigger change detection: the template silently keeps showing the previous state until the user clicks something. Any component state read by the template must be a `signal()` (derived state via `computed()`), otherwise async loads appear "broken/stuck loading".
- **`provideHttpClient()` is mandatory** in `app.config.ts` — without it `PokemonService` cannot inject `HttpClient`. It is configured as `provideHttpClient(withFetch())`.
- **No `provideClientHydration()`** — deliberately omitted: the Pokédex data comes from an external API, so hydrated HTML and the client's initial "Cargando..." state always mismatched. Re-adding hydration will produce NG-Hydration warnings.
- **Angular 22.2.2** — very recent; schematics and CLI commands may differ from older Angular versions. `withHttpTransferCacheFeatures` does **not** exist in this version (internal only) — don't try to import it.
- **No path params in routes** — prerendering fails with _"uses prerendering and includes parameters, but 'getPrerenderParams' is missing"_. Pass ids as `?id=` query params instead (`/pokedex/detail?id=25`).
- **`ng serve` can wedge after a mid-edit compile error** (it keeps serving the last failing rebuild even after you fix the file). If the app looks stale, restart it on another port (`ng serve --port 4211`).
- **SSR is configured** — `src/server.ts` sets up an Express server with `AngularNodeAppEngine`. Do not remove the static `./browser` serve middleware without updating `server.ts`. Network fetching in components must be guarded with `isPlatformBrowser()` or the server repeats every request (151 extra calls on the Pokédex list).
- **`security.allowedHosts` in `angular.json` is required** — the manifest is generated from it (`dist/app-01/server/angular-app-engine-manifest.mjs`). If it is `[]`, the built SSR server answers **400 "Header 'host' … is not allowed" to every request**, including `localhost`. `localhost`, `127.0.0.1` and `::1` are configured; add your real domain before deploying.
- **Prettier** is configured in `.prettierrc` with `singleQuote: true` and an Angular HTML parser override for `*.html` files. Run `npx prettier --write .` before committing.
- **Environment** — the SSR server reads `PORT` from env (defaults to `4000`). See `server.ts` line 55.
- **No monorepo** — this is a single-package Angular app (verified by `package.json` `"private": true` and no `workspaces`).
- **Shell** — the dev environment is PowerShell on Windows: `&&`, `||`, `head` and `tail` do not work.

## What to verify before pushing

1. `ng build` succeeds (no budget errors, assets in order).
2. `ng test` passes (check Vitest output for failures).
3. `npm run serve:ssr:app-01` starts without errors (if SSR is involved).
4. `npx prettier --write .` is run to normalize formatting.
