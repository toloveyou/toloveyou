<script lang="ts">
  import { timeWheel } from '$lib/attachments/time-wheel';
  import type { TimeOption } from '$lib/types/invitation';

  interface Props {
    options: readonly TimeOption[];
    selected: string | null;
    onSelect: (value: string) => void;
    label: string;
    midnightNote: string;
  }

  let { options, selected, onSelect, label, midnightNote }: Props = $props();
</script>

<div class="time-field">
  <p class="label" id="time-label">{label}</p>
  <div class="wheel-frame">
    <div class="selection-line" aria-hidden="true"></div>
    <div
      class="time-wheel"
      role="listbox"
      aria-labelledby="time-label"
      aria-activedescendant={selected ? `time-${selected.replace(':', '-')}` : undefined}
      tabindex="0"
      {@attach timeWheel({ selected, onSelect })}
    >
      <div class="spacer" aria-hidden="true"></div>
      {#each options as option}
        <button
          type="button"
          role="option"
          id={`time-${option.value.replace(':', '-')}`}
          tabindex="-1"
          class:selected={selected === option.value}
          class="time-option"
          aria-selected={selected === option.value}
          aria-disabled={!option.available}
          disabled={!option.available}
          data-time-value={option.value}
          onclick={() => onSelect(option.value)}
        >
          <span>{option.label}</span>
          {#if option.isMidnightNextDay}
            <small>{midnightNote}</small>
          {/if}
        </button>
      {/each}
      <div class="spacer" aria-hidden="true"></div>
    </div>
  </div>
</div>

<style lang="scss">
  .time-field {
    min-width: 0;
  }

  .label {
    margin: 0 0 0.45rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .wheel-frame {
    position: relative;
    overflow: hidden;
    border: 1px solid rgb(89 56 50 / 13%);
    border-radius: 1rem;
    background:
      linear-gradient(to bottom, var(--panel) 0%, transparent 34%, transparent 66%, var(--panel) 100%),
      rgb(255 252 248 / 62%);
  }

  .selection-line {
    position: absolute;
    z-index: 2;
    top: 50%;
    right: 0.5rem;
    left: 0.5rem;
    height: 3.25rem;
    translate: 0 -50%;
    border-top: 1px solid rgb(159 93 88 / 25%);
    border-bottom: 1px solid rgb(159 93 88 / 25%);
    border-radius: 0.65rem;
    background: rgb(255 250 245 / 30%);
    pointer-events: none;
  }

  .time-wheel {
    position: relative;
    z-index: 1;
    height: 9.75rem;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-behavior: smooth;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -3px;
    }
  }

  .spacer {
    height: 3.25rem;
  }

  .time-option {
    display: grid;
    width: 100%;
    min-height: 3.25rem;
    padding: 0.35rem 1rem;
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    place-content: center;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    text-align: center;
    transition:
      color 180ms ease,
      opacity 180ms ease,
      transform 180ms ease;

    span {
      font-family: var(--font-display);
      font-size: 1.45rem;
      letter-spacing: -0.035em;
    }

    small {
      margin-top: 0.05rem;
      font-size: 0.62rem;
      letter-spacing: 0.025em;
    }

    &.selected {
      color: var(--ink);
      transform: scale(1.035);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.2;
      text-decoration: line-through;
    }
  }
</style>
