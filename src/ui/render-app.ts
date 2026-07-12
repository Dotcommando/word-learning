import { createAppTemplate } from './templates';

export function renderApp(root: HTMLElement): void {
  root.replaceChildren(createAppTemplate());
}
