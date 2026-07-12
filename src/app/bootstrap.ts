import { renderApp } from '../ui/render-app';

export function bootstrapApp(): void {
  const appRoot = document.querySelector('[data-app-root]');

  if (!(appRoot instanceof HTMLElement)) {
    return;
  }

  renderApp(appRoot);
}
