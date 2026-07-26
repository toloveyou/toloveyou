<script lang="ts">
  import { Canvas } from '@threlte/core';
  import PrismScene from './PrismScene.svelte';

  interface Props {
    progress: number;
    finalFaceThreshold: number;
    reducedMotion: boolean;
    active: boolean;
    revealed: boolean;
    faces: readonly [string, string, string, string];
  }

  let {
    progress,
    finalFaceThreshold,
    reducedMotion,
    active,
    revealed,
    faces
  }: Props = $props();

  let webglAvailable = $state<boolean | null>(null);
  const middleFaceThreshold = $derived(finalFaceThreshold / 2);

  $effect(() => {
    const testCanvas = document.createElement('canvas');
    webglAvailable = Boolean(
      testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
    );
  });
</script>

<div class:revealed class="canvas-shell" aria-hidden="true">
  {#if webglAvailable}
    <Canvas dpr={[1, 1.75]} renderMode="on-demand" shadows>
      <PrismScene
        {progress}
        {finalFaceThreshold}
        {reducedMotion}
        {active}
        {faces}
      />
    </Canvas>
  {:else}
    <div class="fallback-prism" style={`--fallback-progress: ${progress}`}>
      <span>
        {progress < middleFaceThreshold
          ? faces[0]
          : progress < finalFaceThreshold
            ? faces[1]
            : faces[2]}
      </span>
    </div>
  {/if}
</div>

<style lang="scss">
  .canvas-shell {
    position: absolute;
    inset: 0;
    transition:
      opacity 800ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 900ms ease;

    &.revealed {
      opacity: 0.22;
      transform: translateY(-10svh) scale(0.82);
      filter: blur(1px) saturate(0.8);
    }
  }

  .fallback-prism {
    position: absolute;
    left: 50%;
    top: 43%;
    display: grid;
    width: min(72vw, 20rem);
    aspect-ratio: 2 / 1;
    translate: -50% -50%;
    place-items: center;
    border: 1px solid rgb(86 54 48 / 15%);
    border-radius: 1.1rem;
    background: linear-gradient(145deg, #f0dfd1, #dfc2b1);
    box-shadow:
      0 2.4rem 5rem rgb(74 42 37 / 17%),
      inset 0 1px 0 rgb(255 255 255 / 70%);
    color: var(--ink);
    font-family: var(--font-display);
    font-size: clamp(2rem, 10vw, 3.6rem);
  }
</style>
