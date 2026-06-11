<script lang="ts">
	import '../app.css';
	let { children } = $props(); // Modern Svelte 5 layout property syntax
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Quicksand:wght@500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-container">
	<div class="paper-grain"></div>

	<main class="stage">
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		font-size: 16px;
		/* Design Palette (Calculated for optimal accessibility) */
		--bg-paper: #fdfbf7; /* Soft Cream Paper Canvas */
		--text-ink: #2d3748; /* Deep Slate Ink */
		--accent-blush: #e5989b; /* Dusty Rose Decorative Accents */
		--accent-joy: #81b29a; /* Sage Green Active Accents */

		/* Fluid Typography Rules using CSS clamp() */
		--font-display: 'Caveat', cursive;
		--font-body: 'Quicksand', sans-serif;
		--fs-title: clamp(2rem, 4vw, 4rem);
		--fs-body: clamp(1rem, 2.5vw, 1.25rem);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: var(--bg-paper);
		color: var(--text-ink);
		font-family: var(--font-body);
		overflow-x: hidden;
	}

	/* 100dvh handles mobile viewports perfectly regardless of expanding address bars */
	.app-container {
		position: relative;
		min-height: 100dvh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	/* Creates a physical subtle texture layer on top of the background color */
	.paper-grain {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.04;
		pointer-events: none;
		z-index: 10;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3 Atemplate%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
	}

	.stage {
		width: 100%;
		max-width: 42rem; /* Keep centered layout breathable on desktop, fluid on mobile */
		padding: 2rem 1.5rem;
		box-sizing: border-box;
		z-index: 1;
	}
</style>
