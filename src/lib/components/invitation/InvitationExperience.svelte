<script lang="ts">
  import { scrollProgress } from '$lib/attachments/scroll-progress';
  import { invitationConfig } from '$lib/config/invitation';
  import { sendResponse } from '$lib/services/response';
  import type {
    InvitationCopy,
    InvitationDateId,
    SubmissionState,
    TimeOption
  } from '$lib/types/invitation';
  import { buildTimeOptions, findDate } from '$lib/utils/date';
  import ConfirmationState from './ConfirmationState.svelte';
  import DateSelector from './DateSelector.svelte';
  import PrismCanvas from './PrismCanvas.svelte';
  import QuestionReveal from './QuestionReveal.svelte';
  import TimeWheel from './TimeWheel.svelte';

  interface Props {
    copy: InvitationCopy;
  }

  let { copy }: Props = $props();

  const STORAGE_KEY = `date-invitation-response:${invitationConfig.inviteId}:v1`;
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const DISCORD_MESSAGE_ID_PATTERN = /^\d{15,22}$/;

  let progress = $state(0);
  let revealed = $state(false);
  let sceneActive = $state(true);
  let reducedMotion = $state(false);
  let nowMs = $state<number | null>(null);
  let pageOpenedAt = $state(0);
  let selectedDateId = $state<InvitationDateId | null>(null);
  let selectedTime = $state<string | null>(null);
  let submissionId = $state('');
  let messageId = $state<string | undefined>(undefined);
  let submittedSignature = $state<string | null>(null);
  let pausedSignature = $state<string | null>(null);
  let honeypot = $state('');
  let submission = $state<SubmissionState>({
    status: 'idle',
    countdown: 0,
    message: ''
  });

  const selectedDate = $derived(findDate(invitationConfig.dates, selectedDateId));
  const timeOptions = $derived<TimeOption[]>(
    selectedDate
      ? buildTimeOptions(
          selectedDate,
          invitationConfig.intervalMinutes,
          invitationConfig.timeZone,
          nowMs === null ? null : new Date(nowMs)
        )
      : []
  );
  const selectedTimeOption = $derived(
    timeOptions.find((option) => option.value === selectedTime) ?? null
  );
  const selectionSignature = $derived(
    selectedDateId && selectedTime ? `${selectedDateId}|${selectedTime}` : null
  );
  const disabledDateIds = $derived(
    new Set(
      invitationConfig.dates
        .filter((date) =>
          buildTimeOptions(
            date,
            invitationConfig.intervalMinutes,
            invitationConfig.timeZone,
            nowMs === null ? null : new Date(nowMs)
          ).every((option) => !option.available)
        )
        .map((date) => date.id)
    )
  );
  const scrollCueVisible = $derived(progress < 0.08 && !revealed);
  const dateFaceSettled = $derived(progress >= invitationConfig.finalFaceThreshold);
  const sceneProgress = $derived(
    revealed
      ? Math.max(progress, invitationConfig.finalFaceThreshold)
      : progress
  );
  const semanticFaceText = $derived(
    progress < invitationConfig.finalFaceThreshold / 2
      ? copy.prismFaces[0]
      : progress < invitationConfig.finalFaceThreshold
        ? copy.prismFaces[1]
        : copy.prismFaces[2]
  );

  const updateProgress = (value: number): void => {
    progress = value;
  };

  const updateSceneActivity = (active: boolean): void => {
    sceneActive = active;
  };

  function createSubmissionId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10).join('')
    ].join('-');
  }

  function restoreSavedResponse(): void {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid saved response.');
      }

      const record = parsed as Record<string, unknown>;
      if (
        typeof record.dateId !== 'string' ||
        typeof record.time !== 'string' ||
        typeof record.submissionId !== 'string' ||
        !UUID_PATTERN.test(record.submissionId) ||
        (record.messageId !== undefined &&
          (typeof record.messageId !== 'string' ||
            !DISCORD_MESSAGE_ID_PATTERN.test(record.messageId)))
      ) {
        throw new Error('Invalid saved response.');
      }

      const restoredDate = findDate(
        invitationConfig.dates,
        record.dateId as InvitationDateId
      );
      const restoredTime = restoredDate
        ? buildTimeOptions(
            restoredDate,
            invitationConfig.intervalMinutes,
            invitationConfig.timeZone,
            null
          ).find((option) => option.value === record.time)
        : undefined;

      if (!restoredDate || !restoredTime) {
        throw new Error('Saved response is outside the invitation window.');
      }

      selectedDateId = restoredDate.id;
      selectedTime = restoredTime.value;
      messageId = record.messageId as string | undefined;
      submissionId = record.submissionId;
      submittedSignature = `${restoredDate.id}|${restoredTime.value}`;
      revealed = true;
      progress = 1;
      submission = { status: 'sent', countdown: 0, message: '' };
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // The invitation still works when storage is blocked.
      }
    }
  }

  function persistResponse(response: {
    dateId: InvitationDateId;
    time: string;
    messageId: string;
    submissionId: string;
  }): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    } catch {
      // Delivery succeeded; storage is only a duplicate-submission safeguard.
    }
  }

  $effect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => {
      reducedMotion = media.matches;
    };

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  });

  $effect(() => {
    pageOpenedAt = Date.now();
    nowMs = Date.now();
    submissionId = createSubmissionId();
    restoreSavedResponse();

    const timer = window.setInterval(() => {
      nowMs = Date.now();
    }, 30_000);

    return () => window.clearInterval(timer);
  });

  $effect(() => {
    if (revealed || !dateFaceSettled) return;

    const timeout = window.setTimeout(() => {
      revealed = true;
    }, invitationConfig.revealDelayMs);

    return () => window.clearTimeout(timeout);
  });

  $effect(() => {
    const signature = selectionSignature;
    if (
      !signature ||
      signature === submittedSignature ||
      signature === pausedSignature
    ) {
      return;
    }

    let remaining = Math.ceil(invitationConfig.autoSubmitDelayMs / 1_000);
    submission = {
      status: 'pending',
      countdown: remaining,
      message: ''
    };

    const interval = window.setInterval(() => {
      remaining -= 1;
      submission = {
        status: 'pending',
        countdown: Math.max(0, remaining),
        message: ''
      };
    }, 1_000);

    const timeout = window.setTimeout(() => {
      pausedSignature = signature;
      void submitSelection(signature);
    }, invitationConfig.autoSubmitDelayMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  });

  function chooseDate(id: InvitationDateId): void {
    selectedDateId = id;
    selectedTime = null;
    pausedSignature = null;
    if (submission.status !== 'sent') {
      submission = { status: 'idle', countdown: 0, message: '' };
    }
  }

  function chooseTime(value: string): void {
    const option = timeOptions.find((item) => item.value === value);
    if (!option?.available) return;

    selectedTime = value;
    pausedSignature = null;
    if (submission.status === 'sent') {
      submission = { status: 'idle', countdown: 0, message: '' };
    }
  }

  function cancelPending(): void {
    if (!selectionSignature) return;
    pausedSignature = selectionSignature;
    submission = {
      status: 'idle',
      countdown: 0,
      message: copy.pausedMessage
    };
  }

  function changeChoice(): void {
    submission = { status: 'idle', countdown: 0, message: '' };
    selectedTime = null;
    submittedSignature = null;
    pausedSignature = null;
  }

  function sendNow(): void {
    if (!selectionSignature) return;
    const signature = selectionSignature;
    pausedSignature = signature;
    void submitSelection(signature);
  }

  async function submitSelection(signature: string): Promise<void> {
    if (
      selectionSignature !== signature ||
      !selectedDate ||
      !selectedTimeOption ||
      !selectedDateId ||
      !selectedTime
    ) {
      return;
    }

    const responseDateId = selectedDateId;
    const responseTime = selectedTime;
    const responseLocalDate = selectedTimeOption.localDate;
    const responseSubmissionId = submissionId;

    submission = { status: 'sending', countdown: 0, message: '' };

    try {
      const result = await sendResponse(invitationConfig.endpoint, {
        inviteId: invitationConfig.inviteId,
        submissionId: responseSubmissionId,
        messageId,
        dateId: responseDateId,
        localDate: responseLocalDate,
        time: responseTime,
        timeZone: invitationConfig.timeZone,
        pageOpenedAt,
        honeypot
      });

      messageId = result.messageId;
      submittedSignature = signature;
      submission = { status: 'sent', countdown: 0, message: '' };

      persistResponse({
        dateId: responseDateId,
        time: responseTime,
        messageId,
        submissionId: responseSubmissionId
      });
    } catch (error) {
      submission = {
        status: 'error',
        countdown: 0,
        message: error instanceof Error
          ? error.message
          : 'The answer could not be sent.'
      };
    }
  }
</script>

<main class="invitation">
  <section
    class="story"
    aria-label="Date invitation"
    style={`--scroll-progress: ${progress}`}
    {@attach scrollProgress({
      onProgress: updateProgress,
      onActivityChange: updateSceneActivity
    })}
  >
    <div class="sticky-stage">
      <h1 class="sr-only">
        {revealed ? `${copy.questionPrefix} ${copy.questionFinal}` : semanticFaceText}
      </h1>
      <div class="grain" aria-hidden="true"></div>
      <PrismCanvas
        progress={sceneProgress}
        finalFaceThreshold={invitationConfig.finalFaceThreshold}
        {reducedMotion}
        active={sceneActive}
        {revealed}
        faces={copy.prismFaces}
      />

      <div class:visible={scrollCueVisible} class="scroll-cue" aria-hidden={!scrollCueVisible}>
        <span>{copy.scrollCue}</span>
        <svg viewBox="0 0 24 42" role="img" aria-label="Scroll down">
          <path d="M12 1v35m0 0 7-7m-7 7-7-7" />
        </svg>
      </div>

      <QuestionReveal
        {revealed}
        prefix={copy.questionPrefix}
        finalWord={copy.questionFinal}
        microcopy={copy.pickerPrompt}
      />

      <section
        class:visible={revealed}
        class:success={submission.status === 'sent'}
        class="choice-panel"
        aria-hidden={!revealed}
        inert={!revealed}
        aria-label="Choose a date and time"
      >
        {#if submission.status !== 'sent'}
          <div
            class:locked={submission.status === 'sending'}
            class="selectors"
            aria-busy={submission.status === 'sending'}
            inert={submission.status === 'sending'}
          >
            <DateSelector
              dates={invitationConfig.dates}
              selected={selectedDateId}
              disabledIds={disabledDateIds}
              onSelect={chooseDate}
              legend={copy.dateLegend}
              passedLabel={copy.passedLabel}
            />

            {#if selectedDate}
              <TimeWheel
                options={timeOptions}
                selected={selectedTime}
                onSelect={chooseTime}
                label={copy.timeLegend}
                midnightNote={`${copy.midnightAfter} ${selectedDate.dayName}`}
              />
            {:else}
              <div class="time-placeholder" aria-hidden="true">
                <span>{copy.chooseDayFirst}</span>
              </div>
            {/if}
          </div>
        {/if}

        <label class="honeypot" aria-hidden="true">
          Leave this empty
          <input
            bind:value={honeypot}
            name="website_confirm"
            tabindex="-1"
            autocomplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        </label>

        <ConfirmationState
          state={submission}
          dateLabel={selectedDate?.longLabel ?? ''}
          timeLabel={selectedTimeOption?.label ?? ''}
          onCancel={cancelPending}
          onRetry={sendNow}
          onChange={changeChoice}
          onSendNow={sendNow}
          copy={copy.confirmation}
        />
      </section>

      <noscript>
        <p class="noscript-message">
          This invitation needs JavaScript for its 3D scene and time reply.
        </p>
      </noscript>
    </div>
  </section>

  <footer class="closing" aria-hidden={!revealed}>
    <span>{copy.closing}</span>
  </footer>
</main>

<style lang="scss">
  .invitation {
    min-height: 100%;
    background:
      radial-gradient(circle at 78% 24%, rgb(202 133 118 / 11%), transparent 32rem),
      radial-gradient(circle at 18% 76%, rgb(214 178 151 / 14%), transparent 28rem),
      var(--page);
  }

  .story {
    position: relative;
    height: 380svh;
  }

  .sticky-stage {
    position: sticky;
    top: 0;
    height: 100svh;
    min-height: 36rem;
    overflow: hidden;
    isolation: isolate;
  }

  .grain {
    position: absolute;
    z-index: 10;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
    opacity: 0.045;
    pointer-events: none;
  }

  .scroll-cue {
    position: absolute;
    z-index: 4;
    bottom: max(2.2rem, calc(env(safe-area-inset-bottom) + 1rem));
    left: 50%;
    display: grid;
    gap: 0.45rem;
    justify-items: center;
    translate: -50% 0;
    color: var(--muted);
    opacity: 0;
    transform: translateY(0.5rem);
    transition:
      opacity 500ms ease,
      transform 500ms ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    span {
      font-size: 0.68rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    svg {
      width: 1.15rem;
      height: 2rem;
      overflow: visible;
      animation: cue 1.8s ease-in-out infinite;
    }

    path {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.25;
    }
  }

  .choice-panel {
    position: absolute;
    z-index: 5;
    right: max(0.8rem, env(safe-area-inset-right));
    bottom: max(0.8rem, calc(env(safe-area-inset-bottom) + 0.35rem));
    left: max(0.8rem, env(safe-area-inset-left));
    width: min(calc(100% - 1.6rem), 31rem);
    max-height: calc(100svh - 9.5rem);
    margin-inline: auto;
    padding: 0.85rem;
    overflow-y: auto;
    border: 1px solid rgb(91 56 49 / 12%);
    border-radius: 1.35rem;
    background: var(--panel);
    box-shadow:
      0 1.6rem 5rem rgb(69 37 31 / 17%),
      inset 0 1px 0 rgb(255 255 255 / 75%);
    backdrop-filter: blur(1.1rem) saturate(1.08);
    opacity: 0;
    pointer-events: none;
    transform: translateY(2.5rem) scale(0.98);
    transition:
      opacity 700ms ease 350ms,
      transform 900ms cubic-bezier(0.22, 1, 0.36, 1) 300ms,
      padding 500ms ease;

    &.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    &.success {
      padding-block: 1.15rem;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .selectors {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8.8rem, 0.85fr);
    gap: 0.75rem;
    align-items: start;
    transition: opacity 180ms ease;

    &.locked {
      opacity: 0.58;
    }
  }

  .time-placeholder {
    display: grid;
    height: 100%;
    min-height: 7rem;
    place-items: center;
    border: 1px dashed rgb(89 56 50 / 16%);
    border-radius: 1rem;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .honeypot {
    position: fixed;
    left: -100vw;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .noscript-message {
    position: absolute;
    z-index: 20;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    padding: 1rem;
    border-radius: 1rem;
    background: #fff9f3;
    color: var(--ink);
    text-align: center;
  }

  .closing {
    display: grid;
    min-height: 72svh;
    place-items: center;
    color: rgb(78 54 49 / 32%);
    font-family: var(--font-display);
    font-size: 1rem;
    font-style: italic;
    letter-spacing: 0.05em;
  }

  @keyframes cue {
    0%,
    100% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(0.35rem);
    }
  }

  @media (max-width: 420px) {
    .sticky-stage {
      min-height: 34rem;
    }

    .choice-panel {
      max-height: calc(100svh - 8.8rem);
    }

    .selectors {
      grid-template-columns: minmax(0, 1.1fr) minmax(8rem, 0.9fr);
      gap: 0.55rem;
    }
  }

  @media (max-height: 650px) {
    .choice-panel {
      max-height: calc(100svh - 7.25rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-cue svg {
      animation: none;
    }

    .choice-panel,
    .scroll-cue {
      transition-duration: 120ms;
      transition-delay: 0ms;
    }
  }
</style>
