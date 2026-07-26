export const prerender = true;

// This renderer runs at build time so adapter-static can emit complete HTML.
// The deployed invitation has no SvelteKit rendering server.
export const ssr = true;

export const trailingSlash = 'always';
