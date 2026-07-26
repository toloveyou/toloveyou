<script lang="ts">
  interface Props {
    revealed: boolean;
    prefix: string;
    finalWord: string;
    microcopy: string;
  }

  let { revealed, prefix, finalWord, microcopy }: Props = $props();
</script>

<div class:revealed class="question-wrap" aria-live="polite">
  <p class="question" aria-label={revealed ? `${prefix} ${finalWord}` : finalWord}>
    <span class="prefix" aria-hidden={!revealed}>{prefix}&nbsp;</span>
    <span class="date-word">{finalWord}</span>
  </p>
  <p class="microcopy">{microcopy}</p>
</div>

<style lang="scss">
  .question-wrap {
    position: absolute;
    z-index: 3;
    top: max(8svh, calc(env(safe-area-inset-top) + 1rem));
    left: 50%;
    width: min(92vw, 34rem);
    translate: -50% 0;
    pointer-events: none;
    text-align: center;
    opacity: 0;
    transform: translateY(1.5rem);
    transition:
      opacity 700ms ease 160ms,
      transform 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms;

    &.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .question {
    display: flex;
    justify-content: center;
    margin: 0;
    overflow: visible;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: clamp(2.1rem, 9.5vw, 4rem);
    font-weight: 520;
    letter-spacing: -0.06em;
    line-height: 0.98;
    white-space: nowrap;
  }

  .prefix {
    display: inline-block;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    filter: blur(0.45rem);
    transform: translateX(1.8rem);
    transition:
      max-width 1.1s cubic-bezier(0.22, 1, 0.36, 1) 280ms,
      opacity 700ms ease 300ms,
      filter 900ms ease 260ms,
      transform 1s cubic-bezier(0.22, 1, 0.36, 1) 260ms;

    .revealed & {
      max-width: 12em;
      opacity: 1;
      filter: blur(0);
      transform: translateX(0);
    }
  }

  .date-word {
    position: relative;
    z-index: 1;
  }

  .microcopy {
    margin: 0.8rem 0 0;
    color: var(--muted);
    font-size: 0.82rem;
    letter-spacing: 0.035em;
    opacity: 0;
    transform: translateY(0.5rem);
    transition:
      opacity 650ms ease 900ms,
      transform 700ms ease 900ms;

    .revealed & {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 360px) {
    .question {
      font-size: 1.95rem;
    }
  }
</style>
