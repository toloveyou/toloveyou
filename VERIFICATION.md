# Verification report

Verified on 26 July 2026.

## Passed checks

The delivered source passed the following executable checks:

1. **Configuration and source audit**
   - `package.json` parses and contains the intended exact dependency versions.
   - Exactly two Svelte `{@attach ...}` integrations are present.
   - No custom `use:` action directives are present.
   - The route is prerendered with `adapter-static`, has no SvelteKit runtime API route,
     and the response endpoint lives in `functions/api/respond.ts`.
   - No concrete Discord webhook URL, `TODO`, or `FIXME` is committed.

2. **Strict TypeScript source check**
   - All standalone TypeScript files under `src/lib` passed strict compilation with
     the current `svelte/attachments` type represented by a local test shim.

3. **Attachment behavior tests**
   - Initial programmatic time-wheel centering selected **zero** times.
   - A genuine settled user scroll selected the nearest time exactly once.
   - Scroll progress normalized correctly to `0.5` in the test geometry.

4. **Date and response-client tests**
   - 26 July produces 29 quarter-hour options from 17:00 through 24:00.
   - 27 July produces 20 quarter-hour options from 17:00 through 21:45.
   - Midnight serializes as `24:00`, displays as `12:00 AM`, and uses 27 July as
     its effective local date.
   - Passed slots disable correctly in `Asia/Jerusalem`.
   - Valid delivery confirmations, invalid message IDs, API errors, and network
     failures are handled as intended.

5. **Cloudflare Function checks**
   - `functions/api/respond.ts` passed strict TypeScript compilation.
   - Mocked Discord integration tests covered message creation, ownership-verified
     updates, deleted-message recreation, midnight, invalid windows, invalid origin,
     interaction timing, malformed webhook URLs, honeypot discard, declared and
     actual body-size limits, ownership rejection, and controlled network failure.

## Dependency-backed build limitation

A full `npm install`, `svelte-check`, and Vite production build could not be run in
this generation container because its configured npm proxy repeatedly returned
HTTP `503` while resolving `@threlte/core`. A direct public-registry attempt also
failed with `EAI_AGAIN` DNS resolution. No lockfile was fabricated and no partial
`node_modules` directory is included.

On a normal network, run:

```bash
npm install
npm run verify
```

`npm run verify` performs SvelteKit synchronization, `svelte-check`, strict
Cloudflare Function type-checking, and the final static production build. The
output is written to `build/` by `@sveltejs/adapter-static`.
