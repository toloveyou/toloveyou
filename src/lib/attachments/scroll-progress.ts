import type { Attachment } from 'svelte/attachments';

interface ScrollProgressOptions {
  onProgress: (progress: number) => void;
  onActivityChange?: (active: boolean) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function scrollProgress({
  onProgress,
  onActivityChange
}: ScrollProgressOptions): Attachment<HTMLElement> {
  return (element) => {
    let animationFrame = 0;
    let idleTimer = 0;
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleMeasure);

    function measure(): void {
      animationFrame = 0;
      const rect = element.getBoundingClientRect();
      const scrollableDistance = Math.max(1, element.offsetHeight - window.innerHeight);
      const progressed = clamp(-rect.top / scrollableDistance, 0, 1);
      onProgress(progressed);
    }

    function scheduleMeasure(): void {
      onActivityChange?.(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => onActivityChange?.(false), 180);

      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(measure);
    }

    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    resizeObserver?.observe(element);
    scheduleMeasure();

    return () => {
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(idleTimer);
    };
  };
}
