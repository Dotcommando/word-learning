import {
  areAllCurrentTranslationsVisible,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
} from '../features/ui-state/ui-state';
import {
  GRAMMATICAL_NUMBER,
  GREEK_CASE,
  type IDeclensionEntry,
  type IWord,
  type IWordSet,
} from '../features/word-sets/word-sets';
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
const SINGULAR_DECLENSION_LABEL = 'Единственное число';
const PLURAL_DECLENSION_LABEL = 'Множественное число';

export function createAppTemplate(state: IUiState): HTMLElement {
  const app = createElement('section', 'app');
  const wrap = createElement('div', '_app-wrap');

  if (state.theme === THEME_MODE.DARK) {
    app.classList.add('app__dark');
  }

  app.dataset['screenLabel'] = 'Тренажёр греческих слов';
  wrap.append(createHeader(), createPanel(state), createContentState(state));
  app.append(wrap, createStatusRegion(state), createWordSetFileInput());

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
      'toolbar-load-word-set',
    ),
    createIconButton(
      '_toolbar-button tooltip',
      createTranslationToggleLabel(state),
      createTranslationToggleLabel(state),
      areAllCurrentTranslationsVisible(state) ? createEyeOffIcon() : createEyeIcon(),
      state.phase !== PAGE_PHASE.LOADED,
      'toggle-all-translations',
      'toolbar-toggle-all-translations',
    ),
    createIconButton(
      '_toolbar-button tooltip',
      createThemeToggleLabel(state),
      createThemeToggleLabel(state),
      state.theme === THEME_MODE.DARK ? createSunIcon() : createMoonIcon(),
      false,
      'toggle-theme',
      'toolbar-toggle-theme',
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
  focusKey: string,
): HTMLButtonElement {
  const button = document.createElement('button');

  button.className = className;
  button.type = 'button';
  button.disabled = disabled;
  button.setAttribute('aria-label', ariaLabel);
  button.dataset['tooltip'] = tooltip;
  button.dataset['action'] = action;
  button.dataset['focusKey'] = focusKey;
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
  button.dataset['focusKey'] = 'statebox-load-word-set';
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
  button.dataset['focusKey'] = 'statebox-load-word-set';
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

  const content = createElement('div', 'content-stack');

  if (state.errorMessage !== null) {
    content.append(createInlineError(state.errorMessage));
  }

  content.append(createWordTable(state.wordSet, state));

  return content;
}

function createStatebox(screenLabel: string): HTMLElement {
  const statebox = createElement('section', 'statebox');

  statebox.dataset['screenLabel'] = screenLabel;

  return statebox;
}

function createInlineError(errorMessage: string): HTMLElement {
  const error = createElement('p', '_content-error', errorMessage);

  error.setAttribute('role', 'alert');

  return error;
}

function createWordSetFileInput(): HTMLInputElement {
  const input = document.createElement('input');

  input.className = '_app-file-input';
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.tabIndex = -1;
  input.dataset['wordSetFileInput'] = 'true';
  input.setAttribute('aria-label', 'Выбрать JSON набор слов');

  return input;
}

function createStatusRegion(state: IUiState): HTMLElement {
  const status = createElement('p', '_app-status', createStatusText(state));

  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  return status;
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
    const isExpanded = state.expandedWordIds.has(word.id);

    tbody.append(createWordRow(word, state, isExpanded));

    if (isExpanded) {
      tbody.append(createDeclensionRow(word));
    }
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

function createWordRow(word: IWord, state: IUiState, isExpanded: boolean): HTMLTableRowElement {
  const row = document.createElement('tr');

  row.className = '_word-table-row';
  row.append(
    createWordCell(word, isExpanded),
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

function createWordCell(word: IWord, isExpanded: boolean): HTMLTableCellElement {
  const cell = document.createElement('td');
  const button = document.createElement('button');
  const label = createElement('span', '_word-table-word', word.word);
  const detailId = createDeclensionRegionId(word.id);
  const tooltip = isExpanded ? 'Скрыть склонение' : 'Показать склонение';

  cell.className = '_word-table-cell _word-table-cell__word';
  button.className = isExpanded
    ? '_word-table-word-button _word-table-word-button__expanded tooltip'
    : '_word-table-word-button tooltip';
  button.type = 'button';
  button.dataset['action'] = 'toggle-declension';
  button.dataset['wordId'] = word.id;
  button.dataset['tooltip'] = tooltip;
  button.dataset['focusKey'] = `word-${word.id}`;
  button.setAttribute('aria-expanded', String(isExpanded));
  button.setAttribute('aria-controls', detailId);
  button.setAttribute('aria-label', `${tooltip} слова ${word.word}`);
  button.append(label, createChevronIcon());
  cell.append(button);

  return cell;
}

function createDeclensionRow(word: IWord): HTMLTableRowElement {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  const region = createDeclensionRegion(word);

  row.className = '_word-table-detail-row';
  cell.className = '_word-table-cell _word-table-cell__detail';
  cell.colSpan = COLUMN_LABELS.length;
  cell.append(region);
  row.append(cell);

  return row;
}

function createDeclensionRegion(word: IWord): HTMLElement {
  const region = createElement('section', 'declension');
  const kick = createElement('p', '_declension-kick', `Склонение · ${word.word}`);
  const grid = createElement('div', '_declension-grid');

  region.id = createDeclensionRegionId(word.id);
  region.setAttribute('aria-label', `Склонение слова ${word.word}`);
  grid.append(
    createDeclensionGroup(SINGULAR_DECLENSION_LABEL, word.declensions.singular, GRAMMATICAL_NUMBER.SINGULAR),
    createDeclensionGroup(PLURAL_DECLENSION_LABEL, word.declensions.plural, GRAMMATICAL_NUMBER.PLURAL),
  );
  region.append(kick, grid);

  return region;
}

function createDeclensionGroup(
  title: string,
  entries: IDeclensionEntry[],
  grammaticalNumber: GRAMMATICAL_NUMBER,
): HTMLElement {
  const group = createElement('section', '_declension-group');
  const heading = createElement('h3', '_declension-heading', title);
  const list = createElement('dl', '_declension-list');

  group.dataset['grammaticalNumber'] = grammaticalNumber;
  group.append(heading, list);
  entries.forEach((entry) => {
    list.append(createDeclensionTerm(entry), createDeclensionDescription(entry));
  });

  return group;
}

function createDeclensionTerm(entry: IDeclensionEntry): HTMLElement {
  const term = createElement('dt', '_declension-case', createCaseAbbreviation(entry.case));

  return term;
}

function createDeclensionDescription(entry: IDeclensionEntry): HTMLElement {
  const description = createElement('dd', '_declension-entry');
  const form = createElement('span', '_declension-form', entry.form);
  const translation = createElement('span', '_declension-translation', entry.translation);
  const example = createElement('span', '_declension-example', entry.example);
  const exampleTranslation = createElement('span', '_declension-example-translation', entry.exampleTranslation);

  description.append(form, translation, example, exampleTranslation);

  return description;
}

function createDeclensionRegionId(wordId: string): string {
  return `declension-${wordId}`;
}

function createCaseAbbreviation(greekCase: GREEK_CASE): string {
  switch (greekCase) {
    case GREEK_CASE.NOMINATIVE:
      return 'именит.';
    case GREEK_CASE.GENITIVE:
      return 'родит.';
    case GREEK_CASE.ACCUSATIVE:
      return 'винит.';
    case GREEK_CASE.VOCATIVE:
      return 'зват.';
  }
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
  const text = createElement('span', '_word-table-mask-text', options.text);

  cell.className = '_word-table-cell _word-table-cell__translation';
  button.className = options.isRevealed
    ? '_word-table-mask _word-table-mask__revealed'
    : '_word-table-mask _word-table-mask__hidden';
  button.type = 'button';
  button.dataset['action'] = options.action;
  button.dataset['wordId'] = options.wordId;
  button.dataset['focusKey'] = `${options.action}-${options.wordId}`;
  button.setAttribute('aria-label', options.isRevealed ? options.visibleLabel : options.hiddenLabel);
  button.append(text);
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

function createStatusText(state: IUiState): string {
  switch (state.phase) {
    case PAGE_PHASE.LOADING:
      return 'Загружаем набор слов.';
    case PAGE_PHASE.ERROR:
      return state.errorMessage === null ? 'Ошибка загрузки набора слов.' : `Ошибка: ${state.errorMessage}`;
    case PAGE_PHASE.LOADED:
      return state.wordSet === null ? 'Набор загружен.' : `Набор ${state.wordSet.name} загружен.`;
    case PAGE_PHASE.EMPTY:
      return '';
  }
}
