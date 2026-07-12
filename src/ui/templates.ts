import { createElement } from './dom';

export function createAppTemplate(): HTMLElement {
  const app = createElement('section', 'app');
  const shell = createElement('div', '_app-shell');
  const heading = createElement('h1', '_app-title', 'Λέξεις');
  const subtitle = createElement('p', '_app-subtitle', 'Загрузите набор слов, чтобы начать тренировку.');

  shell.append(heading, subtitle);
  app.append(shell);

  return app;
}
