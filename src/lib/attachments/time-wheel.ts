import type { Attachment } from 'svelte/attachments';

interface TimeWheelOptions {
  selected: string | null;
  onSelect: (value: string) => void;
}

export function timeWheel({
  selected,
  onSelect
}: TimeWheelOptions): Attachment<HTMLElement> {
  return (element) => {
    let settleTimer = 0;
    let releaseTimer = 0;
    let animationFrame = 0;
    let internalScroll = false;

    const enabledItems = (): HTMLElement[] =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          '[data-time-value]:not([aria-disabled="true"])'
        )
      );

    const selectedItem = (): HTMLElement | undefined =>
      enabledItems().find((item) => item.dataset.timeValue === selected);

    function nearestItem(items = enabledItems()): HTMLElement | undefined {
      if (!items.length) return undefined;

      const containerCenter = element.getBoundingClientRect().top + element.clientHeight / 2;
      return items.reduce((best, item) => {
        const box = item.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - containerCenter);
        return distance < best.distance ? { item, distance } : best;
      }, { item: items[0], distance: Number.POSITIVE_INFINITY }).item;
    }

    function centerItem(item: HTMLElement, behavior: ScrollBehavior): void {
      internalScroll = true;
      window.clearTimeout(releaseTimer);

      const top = item.offsetTop - (element.clientHeight - item.offsetHeight) / 2;
      element.scrollTo({ top, behavior });

      releaseTimer = window.setTimeout(() => {
        internalScroll = false;
      }, behavior === 'smooth' ? 480 : 160);
    }

    function selectItem(item: HTMLElement | undefined): void {
      const value = item?.dataset.timeValue;
      if (!value) return;
      if (value !== selected) onSelect(value);
      centerItem(item, 'smooth');
    }

    function selectNearest(): void {
      if (internalScroll) return;
      selectItem(nearestItem());
    }

    function onScroll(): void {
      if (internalScroll) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(selectNearest, 110);
    }

    function onKeyDown(event: KeyboardEvent): void {
      const items = enabledItems();
      if (!items.length) return;

      const current = selectedItem() ?? nearestItem(items) ?? items[0];
      const currentIndex = Math.max(0, items.indexOf(current));
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'PageDown':
          nextIndex = Math.min(items.length - 1, currentIndex + 4);
          break;
        case 'PageUp':
          nextIndex = Math.max(0, currentIndex - 4);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          nextIndex = currentIndex;
          break;
        default:
          return;
      }

      event.preventDefault();
      selectItem(items[nextIndex]);
    }

    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('keydown', onKeyDown);

    animationFrame = window.requestAnimationFrame(() => {
      const item = selectedItem() ?? enabledItems()[0];
      if (item) centerItem(item, selected ? 'smooth' : 'auto');
    });

    return () => {
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(releaseTimer);
    };
  };
}
