import {
  areAllCurrentTranslationsVisible,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
} from '../features/ui-state/ui-state';
import {
  createBookIcon,
  createEyeIcon,
  createEyeOffIcon,
  createMoonIcon,
  createSunIcon,
  createUploadIcon,
} from '../icons/icons';
import { createElement } from './dom';

const TITLE_TEXT = 'Λέξεις';
const SUBTITLE_TEXT = 'Тренажёр греческих слов — вспоминайте перевод, прежде чем открыть его';
const LOAD_WORD_SET_TEXT = 'Загрузить набор слов';

export function createAppTemplate(state: IUiState): HTMLElement {
  const app = createElement('section', 'app');
  const wrap = createElement('div', '_app-wrap');

  if (state.theme === THEME_MODE.DARK) {
    app.classList.add('app__dark');
  }

  app.dataset['screenLabel'] = 'Тренажёр греческих слов';
  wrap.append(createHeader(), createPanel(state), createContentState(state));
  app.append(wrap);

  return app;
}

function createHeader(): HTMLElement {
  const header = document.createElement('header');
  const heading = createElement('h1', '_app-title', TITLE_TEXT);
  const subtitle = createElement('p', '_app-subtitle', SUBTITLE_TEXT);

  header.className = '_app-header';
  header.append(heading, subtitle);

  return header;
}

function createPanel(state: IUiState): HTMLElement {
  const panel = createElement('div', '_app-panel');
  const metadata = createElement('div', '_app-meta', createMetadataText(state));
  const toolbar = createToolbar(state);

  panel.append(metadata, toolbar);

  return panel;
}

function createToolbar(state: IUiState): HTMLElement {
  const toolbar = createElement('div', 'toolbar');

  toolbar.append(
    createIconButton(
      '_toolbar-button _toolbar-button__primary tooltip',
      LOAD_WORD_SET_TEXT,
      LOAD_WORD_SET_TEXT,
      createUploadIcon(),
      false,
      'load-word-set',
    ),
    createIconButton(
      '_toolbar-button tooltip',
      createTranslationToggleLabel(state),
      createTranslationToggleLabel(state),
      areAllCurrentTranslationsVisible(state) ? createEyeOffIcon() : createEyeIcon(),
      state.phase !== PAGE_PHASE.LOADED,
      'toggle-all-translations',
    ),
    createIconButton(
      '_toolbar-button tooltip',
      createThemeToggleLabel(state),
      createThemeToggleLabel(state),
      state.theme === THEME_MODE.DARK ? createSunIcon() : createMoonIcon(),
      false,
      'toggle-theme',
    ),
  );

  return toolbar;
}

function createIconButton(
  className: string,
  ariaLabel: string,
  tooltip: string,
  icon: SVGSVGElement,
  disabled: boolean,
  action: string,
): HTMLButtonElement {
  const button = document.createElement('button');

  button.className = className;
  button.type = 'button';
  button.disabled = disabled;
  button.setAttribute('aria-label', ariaLabel);
  button.dataset['tooltip'] = tooltip;
  button.dataset['action'] = action;
  button.append(icon);

  return button;
}

function createContentState(state: IUiState): HTMLElement {
  switch (state.phase) {
    case PAGE_PHASE.LOADING:
      return createLoadingState();
    case PAGE_PHASE.ERROR:
      return createErrorState(state.errorMessage);
    case PAGE_PHASE.LOADED:
      return createLoadedState(state);
    case PAGE_PHASE.EMPTY:
      return createEmptyState();
  }
}

function createEmptyState(): HTMLElement {
  const statebox = createStatebox('Пустое состояние');
  const text = createElement('p', '_statebox-text', 'Загрузите набор слов, чтобы начать обучение');
  const button = document.createElement('button');

  button.className = '_statebox-button';
  button.type = 'button';
  button.dataset['action'] = 'load-word-set';
  button.append(LOAD_WORD_SET_TEXT);
  statebox.append(createBookIcon(), text, button);

  return statebox;
}

function createLoadingState(): HTMLElement {
  const statebox = createStatebox('Загрузка');
  const pulse = createElement('span', '_statebox-pulse');
  const text = createElement('p', '_statebox-text', 'Загружаем набор слов…');

  statebox.append(pulse, text);

  return statebox;
}

function createErrorState(errorMessage: string | null): HTMLElement {
  const statebox = createStatebox('Ошибка');
  const text = createElement('p', '_statebox-text', errorMessage ?? 'Не удалось загрузить набор слов.');
  const button = document.createElement('button');

  button.className = '_statebox-button';
  button.type = 'button';
  button.dataset['action'] = 'load-word-set';
  button.append(LOAD_WORD_SET_TEXT);
  statebox.append(text, button);

  return statebox;
}

function createLoadedState(state: IUiState): HTMLElement {
  const statebox = createStatebox('Набор загружен');
  const text = createElement(
    'p',
    '_statebox-text',
    state.wordSet === null ? 'Набор готов к отображению.' : `${state.wordSet.name}: ${state.wordSet.words.length} слов.`,
  );

  statebox.append(text);

  return statebox;
}

function createStatebox(screenLabel: string): HTMLElement {
  const statebox = createElement('section', 'statebox');

  statebox.dataset['screenLabel'] = screenLabel;

  return statebox;
}

function createMetadataText(state: IUiState): string {
  switch (state.phase) {
    case PAGE_PHASE.LOADED:
      return state.wordSet === null ? 'Набор загружен' : `${state.wordSet.name} · ${state.wordSet.words.length} слов`;
    case PAGE_PHASE.LOADING:
      return 'Загрузка набора…';
    case PAGE_PHASE.ERROR:
      return 'Ошибка загрузки';
    case PAGE_PHASE.EMPTY:
      return 'Набор не загружен';
  }
}

function createTranslationToggleLabel(state: IUiState): string {
  return areAllCurrentTranslationsVisible(state) ? 'Скрыть все переводы' : 'Показать все переводы';
}

function createThemeToggleLabel(state: IUiState): string {
  return state.theme === THEME_MODE.DARK ? 'Включить светлую тему' : 'Включить тёмную тему';
}
