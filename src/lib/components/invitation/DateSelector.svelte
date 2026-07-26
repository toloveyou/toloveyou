<script lang="ts">
  import type {
    InvitationDateId,
    InvitationDateOption
  } from '$lib/types/invitation';

  interface Props {
    dates: readonly InvitationDateOption[];
    selected: InvitationDateId | null;
    disabledIds: ReadonlySet<InvitationDateId>;
    onSelect: (id: InvitationDateId) => void;
    legend: string;
    passedLabel: string;
  }

  let { dates, selected, disabledIds, onSelect, legend, passedLabel }: Props = $props();
</script>

<fieldset class="date-fieldset">
  <legend>{legend}</legend>
  <div class="date-grid">
    {#each dates as date}
      {@const disabled = disabledIds.has(date.id)}
      <button
        type="button"
        class:selected={selected === date.id}
        class="date-card"
        disabled={disabled}
        aria-pressed={selected === date.id}
        onclick={() => onSelect(date.id)}
      >
        <span class="day-name">{date.dayName}</span>
        <span class="short-date">{date.shortLabel}</span>
        {#if disabled}
          <span class="past-label">{passedLabel}</span>
        {/if}
      </button>
    {/each}
  </div>
</fieldset>

<style lang="scss">
  .date-fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: 0.45rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .date-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .date-card {
    position: relative;
    display: grid;
    min-height: 4.6rem;
    padding: 0.85rem 0.9rem;
    overflow: hidden;
    border: 1px solid rgb(89 56 50 / 14%);
    border-radius: 1rem;
    background: rgb(255 252 248 / 65%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
    color: var(--ink);
    cursor: pointer;
    text-align: left;
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease,
      box-shadow 180ms ease;

    &:active:not(:disabled) {
      transform: scale(0.985);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    &.selected {
      border-color: rgb(159 93 88 / 58%);
      background: rgb(255 248 242 / 93%);
      box-shadow:
        0 0.8rem 2rem rgb(113 64 57 / 10%),
        inset 0 0 0 1px rgb(159 93 88 / 16%);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }
  }

  .day-name {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .short-date {
    align-self: end;
    margin-top: 0.4rem;
    font-family: var(--font-display);
    font-size: 1.6rem;
    letter-spacing: -0.04em;
  }

  .past-label {
    position: absolute;
    right: 0.65rem;
    top: 0.65rem;
    color: var(--muted);
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
