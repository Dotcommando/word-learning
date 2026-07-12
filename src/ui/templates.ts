import {
  areAllCurrentTranslationsVisible,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
} from '../features/ui-state/ui-state';
import type { IWord, IWordSet } from '../features/word-sets/word-sets';
import {
  createBookIcon,
  createChevronIcon,
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
const COLUMN_LABELS = [
  'Слово',
  'Транскрипция',
  'Перевод',
  'Пример',
  'Перевод примера',
];

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
  if (state.wordSet === null) {
    const statebox = createStatebox('Набор загружен');
    const text = createElement('p', '_statebox-text', 'Набор готов к отображению.');

    statebox.append(text);

    return statebox;
  }

  return createWordTable(state.wordSet, state);
}

function createStatebox(screenLabel: string): HTMLElement {
  const statebox = createElement('section', 'statebox');

  statebox.dataset['screenLabel'] = screenLabel;

  return statebox;
}

function createWordTable(wordSet: IWordSet, state: IUiState): HTMLElement {
  const section = createElement('section', 'word-table');
  const table = document.createElement('table');
  const caption = createElement('caption', '_word-table-caption', wordSet.name);
  const colgroup = document.createElement('colgroup');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  table.className = '_word-table-table';
  table.append(caption, colgroup, thead, tbody);
  COLUMN_LABELS.forEach((_label, index) => {
    const column = document.createElement('col');

    column.className = `_word-table-column _word-table-column__${index + 1}`;
    colgroup.append(column);
  });
  thead.append(createHeaderRow());
  wordSet.words.forEach((word) => {
    tbody.append(createWordRow(word, state));
  });
  section.append(table);

  return section;
}

function createHeaderRow(): HTMLTableRowElement {
  const row = document.createElement('tr');

  COLUMN_LABELS.forEach((label) => {
    const cell = document.createElement('th');

    cell.scope = 'col';
    cell.className = '_word-table-heading';
    cell.textContent = label;
    row.append(cell);
  });

  return row;
}

function createWordRow(word: IWord, state: IUiState): HTMLTableRowElement {
  const row = document.createElement('tr');

  row.className = '_word-table-row';
  row.append(
    createWordCell(word),
    createTextCell(word.transcription, '_word-table-cell _word-table-cell__transcription'),
    createTranslationCell({
      action: 'toggle-word-translation',
      hiddenLabel: `Показать перевод слова ${word.word}`,
      isRevealed: state.revealedWordTranslationIds.has(word.id),
      text: word.translation,
      visibleLabel: `Скрыть перевод слова ${word.word}`,
      wordId: word.id,
    }),
    createTextCell(word.example, '_word-table-cell _word-table-cell__example'),
    createTranslationCell({
      action: 'toggle-example-translation',
      hiddenLabel: `Показать перевод примера для слова ${word.word}`,
      isRevealed: state.revealedExampleTranslationIds.has(word.id),
      text: word.exampleTranslation,
      visibleLabel: `Скрыть перевод примера для слова ${word.word}`,
      wordId: word.id,
    }),
  );

  return row;
}

function createWordCell(word: IWord): HTMLTableCellElement {
  const cell = document.createElement('td');
  const button = document.createElement('button');
  const label = createElement('span', '_word-table-word', word.word);

  cell.className = '_word-table-cell _word-table-cell__word';
  button.className = '_word-table-word-button tooltip';
  button.type = 'button';
  button.dataset['action'] = 'toggle-declension';
  button.dataset['wordId'] = word.id;
  button.dataset['tooltip'] = 'Показать склонение';
  button.setAttribute('aria-label', `Показать склонение слова ${word.word}`);
  button.append(label, createChevronIcon());
  cell.append(button);

  return cell;
}

function createTextCell(text: string, className: string): HTMLTableCellElement {
  const cell = document.createElement('td');

  cell.className = className;
  cell.textContent = text;

  return cell;
}

interface ITranslationCellOptions {
  action: string;
  hiddenLabel: string;
  isRevealed: boolean;
  text: string;
  visibleLabel: string;
  wordId: string;
}

function createTranslationCell(options: ITranslationCellOptions): HTMLTableCellElement {
  const cell = document.createElement('td');
  const button = document.createElement('button');

  cell.className = '_word-table-cell _word-table-cell__translation';
  button.className = options.isRevealed
    ? '_word-table-mask _word-table-mask__revealed'
    : '_word-table-mask _word-table-mask__hidden';
  button.type = 'button';
  button.dataset['action'] = options.action;
  button.dataset['wordId'] = options.wordId;
  button.setAttribute('aria-label', options.isRevealed ? options.visibleLabel : options.hiddenLabel);
  button.textContent = options.text;
  cell.append(button);

  return cell;
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
