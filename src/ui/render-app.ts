import type { IUiState } from '../features/ui-state/ui-state';
import { createAppTemplate } from './templates';

export function renderApp(root: HTMLElement, state: IUiState): void {
  root.replaceChildren(createAppTemplate(state));
}
