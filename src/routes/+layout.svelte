<script lang="ts">
  import type { Snippet } from 'svelte';
  import '$lib/styles/global.scss';

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
