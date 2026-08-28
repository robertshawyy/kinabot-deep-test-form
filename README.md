# KinaBot Deep Test Form

KinaBot Deep Test Form is a standalone web application for collecting structured feedback from people testing KinaBot. It is independent of `aoi_kinabot_app/`: it does not import, modify, or run the main KinaBot application.

This project collects product feedback. It is not a medical device, a diagnostic tool, or a clinical research system.

## What the form provides

- A six-step, responsive questionnaire covering task context, reproduction details, analysis results, comprehension, privacy, and improvement priorities
- Step-by-step required-field validation and conditional questions
- Keyboard-accessible controls and mobile-friendly layouts
- Tab-scoped draft recovery with `sessionStorage`
- Retry-safe submissions with a reusable client submission token and a generated feedback receipt ID
- Server-side validation, payload limits, a honeypot field, and a minimum completion-time check
- Durable response storage in Cloudflare D1
- Optional browser, locale, time-zone, and viewport context collected only after explicit consent
- Open Graph and X social-preview metadata

## How submissions work

1. The browser validates the current step and keeps an unfinished draft in the active tab.
2. The completed form sends JSON to `POST /api/responses`.
3. The server validates required fields, consent confirmations, conditional answers, text limits, and basic abuse signals.
4. The server removes technical context when consent was not granted.
5. A retry-safe `KFB-...` identifier is generated and the structured response is stored in D1.
6. The browser displays the receipt ID and removes the local draft after a successful response.

## Technology

- React and TypeScript
- Vinext and Vite
- Cloudflare Workers
- Cloudflare D1 with a SQLite schema
- Drizzle ORM and Drizzle Kit for schema definitions and migrations
- Node.js test runner and ESLint

Exact dependency versions are defined in `package.json` and `package-lock.json`.

## Requirements

- Node.js `>=22.13.0`
- npm
- A Cloudflare-compatible local runtime for the D1 binding used by Vinext

## Local development

```bash
git clone https://github.com/robertshawyy/kinabot-deep-test-form.git
cd kinabot-deep-test-form
npm install
npm run dev
```

Open the local URL printed by the development server.

## Commands

| Task | Command |
|---|---|
| Start the development server | `npm run dev` |
| Create a production build | `npm run build` |
| Start the built application | `npm run start` |
| Build and run the repository tests | `npm test` |
| Run ESLint | `npm run lint` |
| Run the TypeScript checker | `npx tsc --noEmit --incremental false` |
| Generate a database migration | `npm run db:generate` |

## Database

The application expects a D1 binding named `DB`. The logical binding is declared in `.openai/hosting.json`.

- `db/schema.ts` is the source schema.
- `drizzle/` contains ordered SQL migrations and Drizzle metadata.
- `drizzle.config.ts` configures SQLite migration generation.

After changing `db/schema.ts`, generate and inspect the migration before committing it:

```bash
npm run db:generate
```

Do not edit an existing applied migration to represent a new schema change. Add a new migration instead.

## Data and privacy boundaries

The form stores structured selections and free-text feedback in D1. When a participant explicitly agrees, it can also attach a shortened browser user-agent string, interface locale, time zone, and viewport size.

The form does not provide fields for names, email addresses, raw audio, full transcripts, medical records, diagnoses, passwords, verification codes, or API keys. Participants are instructed not to place this information in free-text responses.

Unsubmitted drafts stay in the browser tab through `sessionStorage` and are removed after a successful submission. Submitted responses persist in D1. This repository does not currently provide an end-user deletion workflow or an automated retention schedule, so deployments need an explicit data-retention and deletion policy.

Do not use the form to report exploit instructions, credentials, private keys, or other sensitive security details.

## Testing scope

`npm test` creates a production build and runs the Node test suite in `tests/`. The current suite checks server rendering and selected structural safeguards. It does not replace live D1 integration tests, full browser interaction testing, accessibility review, load testing, or a security audit.

Before submitting a change, run:

```bash
npm test
npm run lint
npx tsc --noEmit --incremental false
```

## Repository structure

| Path | Responsibility |
|---|---|
| `app/page.tsx` | Form state, step validation, draft recovery, and submission UI |
| `app/api/responses/route.ts` | Server-side validation and D1 persistence |
| `app/globals.css` | Shared responsive styling |
| `db/schema.ts` | D1/SQLite schema definitions |
| `drizzle/` | Generated database migrations |
| `worker/index.ts` | Cloudflare Worker entry point and response headers |
| `tests/` | Build-level and rendered-output tests |

## Project limits

- Feedback responses can help identify usability, reliability, comprehension, and privacy problems.
- Response counts and recommendation scores do not prove market demand or product effectiveness.
- Feedback about speech or language patterns does not establish clinical or diagnostic validity.
- The project is intended for structured product testing, not medical decision-making.

## Contributing

Keep changes focused and preserve the privacy and non-medical boundaries above. Include tests for behavior changes and run the full verification sequence before opening a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
