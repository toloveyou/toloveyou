<script lang="ts">
  import type { ConfirmationCopy, SubmissionState } from '$lib/types/invitation';

  interface Props {
    state: SubmissionState;
    dateLabel: string;
    timeLabel: string;
    onCancel: () => void;
    onRetry: () => void;
    onChange: () => void;
    onSendNow: () => void;
    copy: ConfirmationCopy;
  }

  let {
    state,
    dateLabel,
    timeLabel,
    onCancel,
    onRetry,
    onChange,
    onSendNow,
    copy
  }: Props = $props();
</script>

<div class:sent={state.status === 'sent'} class="confirmation" aria-live="polite">
  {#if state.status === 'pending'}
    <p class="status-copy">
      {copy.pendingPrefix} <strong>{dateLabel} · {timeLabel}</strong> in {state.countdown}…
    </p>
    <div class="inline-actions">
      <button type="button" class="text-button" onclick={onCancel}>{copy.undo}</button>
      <button type="button" class="text-button strong" onclick={onSendNow}>{copy.sendNow}</button>
    </div>
  {:else if state.status === 'sending'}
    <p class="status-copy"><span class="sending-dot"></span> {copy.sending}</p>
  {:else if state.status === 'sent'}
    <span class="heart-dot" aria-hidden="true">♥</span>
    <p class="success-title">{copy.successTitle}</p>
    <p class="success-subtitle">{dateLabel} · {timeLabel}</p>
    <p class="success-note">{copy.successNote}</p>
    <button type="button" class="text-button change" onclick={onChange}>{copy.changeChoice}</button>
  {:else if state.status === 'error'}
    <p class="status-copy error">{state.message}</p>
    <button type="button" class="retry-button" onclick={onRetry}>{copy.retry}</button>
  {:else if state.message}
    <p class="status-copy quiet">{state.message}</p>
  {/if}
</div>

<style lang="scss">
  .confirmation {
    display: grid;
    min-height: 2.6rem;
    margin-top: 0.7rem;
    place-items: center;
    color: var(--muted);
    text-align: center;

    &.sent {
      min-height: 8.8rem;
      padding-top: 0.4rem;
    }
  }

  .status-copy,
  .success-title,
  .success-subtitle,
  .success-note {
    margin: 0;
  }

  .status-copy {
    font-size: 0.76rem;
    line-height: 1.4;

    strong {
      color: var(--ink);
      font-weight: 650;
    }

    &.error {
      color: #8b3f3a;
    }

    &.quiet {
      color: var(--muted);
    }
  }

  .inline-actions {
    display: flex;
    gap: 0.85rem;
    margin-top: 0.35rem;
  }

  .text-button,
  .retry-button {
    min-height: 2.4rem;
    border: 0;
    background: transparent;
    color: var(--accent-dark);
    cursor: pointer;
    font: inherit;
    font-size: 0.72rem;
    text-decoration: underline;
    text-decoration-color: rgb(159 93 88 / 38%);
    text-underline-offset: 0.22rem;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 0.35rem;
    }

    &.strong {
      font-weight: 700;
    }
  }

  .retry-button {
    margin-top: 0.45rem;
  }

  .sending-dot {
    display: inline-block;
    width: 0.45rem;
    height: 0.45rem;
    margin-right: 0.35rem;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 900ms ease-in-out infinite alternate;
  }

  .heart-dot {
    display: grid;
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.35rem;
    place-items: center;
    border-radius: 50%;
    background: rgb(159 93 88 / 11%);
    color: var(--accent);
    font-size: 0.78rem;
    animation: heart-in 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .success-title {
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1.55rem;
    letter-spacing: -0.04em;
  }

  .success-subtitle {
    margin-top: 0.3rem;
    color: var(--accent-dark);
    font-size: 0.78rem;
    font-weight: 650;
  }

  .success-note {
    margin-top: 0.2rem;
    font-size: 0.72rem;
  }

  .change {
    margin-top: 0.45rem;
  }

  @keyframes pulse {
    to {
      opacity: 0.35;
      transform: scale(0.7);
    }
  }

  @keyframes heart-in {
    from {
      opacity: 0;
      transform: scale(0.4) rotate(-15deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sending-dot,
    .heart-dot {
      animation: none;
    }
  }
</style>
