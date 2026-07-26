# Date invitation

A mobile-first, statically generated SvelteKit invitation with a scroll-controlled Threlte prism, Svelte 5 runes and attachments, mdsvex-managed copy, SCSS styling, and a private Discord response channel through a Cloudflare Pages Function.

## What is implemented

- Complete static prerendering through `@sveltejs/adapter-static`
- Svelte 5 runes and `{@attach ...}` attachments; there are no custom `use:` actions
- A Threlte/Three.js rounded rectangular prism whose faces read `when`, `is our`, `date?`, and `soon`
- Native sticky scrolling rather than scroll hijacking
- A two-second uninterrupted dwell on `date?` before the full question appears
- Date choices for Sunday, 26 July 2026 and Monday, 27 July 2026
- Fifteen-minute time choices:
  - 26 July: 17:00 through 24:00
  - 27 July: 17:00 through 21:45
- Automatic submission after a three-second, cancellable countdown
- Discord webhook delivery, including editing the same Discord message when the choice changes
- Dynamic disabling of time slots that have passed in `Asia/Jerusalem`
- Reduced-motion and non-WebGL fallbacks
- Keyboard-operable date and time controls with an `aria-live` status
- No tracking, cookies, name field, or email field

## Pinned stack

The project pins the versions verified on 26 July 2026 instead of using broad version ranges:

- Svelte `5.56.8`
- SvelteKit `2.70.1`
- `@sveltejs/adapter-static` `3.0.10`
- `@sveltejs/vite-plugin-svelte` `7.2.0`
- Vite `8.1.5`
- Threlte core `8.5.16`
- Threlte extras `9.21.0`
- Three.js `0.185.1`
- `@types/three` `0.185.1`
- mdsvex `0.12.8`
- TypeScript `6.0.3`
- `svelte-check` `4.7.3`
- Sass `1.102.0`
- Wrangler `4.114.0`

The TypeScript 6 pin is deliberate. The current official Svelte CLI templates use
TypeScript 6, while TypeScript 7 does not currently expose the compiler API that
some framework tooling relies on. Re-evaluate this pin once the Svelte toolchain
officially adopts TypeScript 7 throughout.

## Requirements

- Node.js 22.12 or newer
- npm
- A Cloudflare account
- A Discord server/channel in which you can create a webhook

## Install and run the visual site

```bash
npm install
npm run dev
```

Vite prints the local address. The static invitation renders locally, but `/api/respond` is a Cloudflare Pages Function and therefore needs Wrangler for end-to-end response testing.

## Test the complete site and Function locally

1. In the Discord channel that should receive the answer, open **Edit Channel → Integrations → Webhooks → New Webhook**, then copy its URL.
2. Create the local secret file:

```bash
cp .dev.vars.example .dev.vars
```

3. Replace the placeholder webhook URL in `.dev.vars`.
4. Build and start Cloudflare Pages locally:

```bash
npm run cf:dev
```

Open the address printed by Wrangler, normally `http://localhost:8788`.

## Validate the project

Run all application, Function, and production-build checks:

```bash
npm run verify
```

The finished static website is emitted to `build/`.

Individual checks are also available:

```bash
npm run check
npm run check:functions
npm run build
```

## Deploy to Cloudflare Pages

Cloudflare Pages Functions should be deployed through a Git integration or Wrangler. Dashboard drag-and-drop upload does not deploy the `/functions` directory.

### Git integration

1. Push the project to GitHub or GitLab.
2. Create a Cloudflare Pages project from that repository.
3. Configure:
   - Build command: `npm run build`
   - Build output directory: `build`
   - Node version: `22`
4. Under **Settings → Variables and Secrets**, add:
   - `DISCORD_WEBHOOK_URL` as a secret
   - `INVITE_ID` as `july-date-2026`
   - `ALLOWED_ORIGIN` as the final origin, such as `https://your-project.pages.dev`
5. Redeploy after saving the variables.

### Wrangler deployment

After authenticating Wrangler:

```bash
npm run cf:deploy
```

Add the same production variables in Cloudflare and redeploy.

## Where to customize the invitation

### Words and interface copy

Edit the copy object in the mdsvex route:

```text
src/routes/+page.svx
```

This includes prism-face text, question text, selector labels, confirmation copy, and the closing line.

### Dates, time windows, and animation timing

Edit:

```text
src/lib/config/invitation.ts
```

This controls the invitation ID, timezone, dates, time bounds, interval, reveal delay, submission delay, and response endpoint.

### Server-side availability rules

Edit the matching windows in:

```text
functions/api/respond.ts
```

Availability is intentionally duplicated at the trust boundary. The browser provides the experience; the Function independently decides which submissions are valid and derives the Discord labels itself.

### Scroll and wheel behavior

The current Svelte lifecycle integrations are typed attachments:

```text
src/lib/attachments/scroll-progress.ts
src/lib/attachments/time-wheel.ts
```

They are attached with `{@attach ...}` in the Svelte components.

### Visual design

Global palette and typography tokens:

```text
src/lib/styles/_tokens.scss
```

Scene geometry, lighting, materials, and labels:

```text
src/lib/components/invitation/PrismScene.svelte
```

## Static rendering model

`ssr = true` is retained during the build so SvelteKit can produce complete HTML. `adapter-static` then emits plain static assets, so the deployed invitation has no runtime SvelteKit rendering server. Client JavaScript hydrates the generated HTML to add WebGL, scrolling, controls, local response persistence, and the fetch request.

This is not a CSR-only SPA: the initial response already contains the complete
prerendered page. Hydration only adds the interactions that cannot exist in plain
HTML, such as the 3D scene and response submission.

The Cloudflare Pages Function is a separate API endpoint. It delivers the selected date and time; it does not render the website.

## Response behavior

- A date and valid time selection starts a three-second countdown.
- **Undo** cancels automatic delivery without clearing the choice.
- **Send now** bypasses the remaining countdown.
- The first response creates a Discord message.
- Choosing **change my choice** and submitting again first verifies that the saved
  Discord message belongs to the same browser submission, then edits that message
  instead of creating a duplicate.
- If that original Discord message was deleted, the Function safely creates a new
  one and returns its new message ID to the browser.
- A successful response is saved in local storage so an accidental refresh does not resubmit it.

## Privacy and security

- The Discord webhook URL exists only in Cloudflare's secret environment.
- The Function accepts only canonical HTTPS Discord webhook URLs with a valid
  webhook path, host, and port.
- Browser-supplied labels are ignored; date and time labels are derived server-side.
- The page uses `noindex`, blocks crawlers through `robots.txt`, and collects no identity field.
- Cloudflare static-response headers disable framing, suppress referrer leakage,
  restrict unnecessary browser capabilities, and prevent MIME sniffing.
- The Function checks the invitation ID, origin, UUID, content type, declared and
  actual UTF-8 body size, honeypot, minimum interaction time, exact date windows,
  quarter-hour alignment, timezone, and whether the slot has passed.
- Honeypot submissions are discarded without contacting Discord.
- Updates use the full submission UUID stored in the original Discord embed to
  prevent a modified browser request from editing an unrelated webhook message.
- Discord network and API failures are converted into controlled, retryable API
  errors rather than unhandled Function failures.
- The invitation URL is still a capability link: anyone who receives it can open the page. Cloudflare Access or Turnstile can be added for stronger access control.

## Verification notes

See [`VERIFICATION.md`](./VERIFICATION.md) for the checks run against the delivered
source and the one environment limitation that prevented a dependency-backed
production build inside the generation container.
