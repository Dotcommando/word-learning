import type { IUiState } from '../features/ui-state/ui-state';
import { createAppTemplate } from './templates';

export function renderApp(root: HTMLElement, state: IUiState): void {
  const focusKey = getActiveFocusKey(root);

  root.replaceChildren(createAppTemplate(state));
  restoreFocus(root, focusKey);
}

function getActiveFocusKey(root: HTMLElement): string | null {
  const activeElement = document.activeElement;

  return activeElement instanceof HTMLElement && root.contains(activeElement)
    ? activeElement.dataset['focusKey'] ?? null
    : null;
}

function restoreFocus(root: HTMLElement, focusKey: string | null): void {
  if (focusKey === null) {
    return;
  }

  const target = findElementByFocusKey(root, focusKey);

  if (target instanceof HTMLElement) {
    target.focus({
      preventScroll: true,
    });
  }
}

function findElementByFocusKey(root: HTMLElement, focusKey: string): Element | null {
  const candidates = root.querySelectorAll('[data-focus-key]');

  for (const candidate of candidates) {
    if (candidate instanceof HTMLElement && candidate.dataset['focusKey'] === focusKey) {
      return candidate;
    }
  }

  return null;
}
