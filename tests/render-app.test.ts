import { describe, expect, it } from 'vitest';

import { attachAppEventHandlers } from '../src/app/bootstrap';
import {
  INITIAL_UI_STATE,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
  uiReducer,
} from '../src/features/ui-state/ui-state';
import {
  GREEK_CASE,
  type IDeclensionEntry,
  type IWord,
  type IWordSet,
} from '../src/features/word-sets/word-sets';
import { createStore } from '../src/state/store';
import { renderApp } from '../src/ui/render-app';

describe('renderApp', () => {
  it('renders the reference title, subtitle, toolbar, and empty state shell', () => {
    const root = document.createElement('main');

    renderApp(root, INITIAL_UI_STATE);

    expect(root.querySelector('h1')?.textContent).toBe('Λέξεις');
    expect(root.textContent).toContain('Тренажёр греческих слов — вспоминайте перевод, прежде чем открыть его');
    expect(root.textContent).toContain('Набор не загружен');
    expect(root.textContent).toContain('Загрузите набор слов, чтобы начать обучение');
    expect(root.querySelectorAll('button[aria-label]')).toHaveLength(3);
    expect(root.querySelector('[data-action="toggle-all-translations"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('renders dark theme modifier and next-action theme tooltip', () => {
    const root = document.createElement('main');

    renderApp(root, {
      ...INITIAL_UI_STATE,
      theme: THEME_MODE.DARK,
    });

    expect(root.querySelector('.app')?.classList.contains('app__dark')).toBe(true);
    expect(root.querySelector('[data-action="toggle-theme"]')?.getAttribute('aria-label')).toBe('Включить светлую тему');
  });

  it('renders loaded metadata and enables the global translations toggle', () => {
    const root = document.createElement('main');
    const state: IUiState = {
      ...INITIAL_UI_STATE,
      phase: PAGE_PHASE.LOADED,
      activeWordSetId: 'set-1',
      wordSet: createWordSet(),
    };

    renderApp(root, state);

    expect(root.textContent).toContain('Базовый набор · 2 слов');
    expect(root.querySelector('[data-action="toggle-all-translations"]')?.hasAttribute('disabled')).toBe(false);
    expect(root.querySelector('[data-action="toggle-all-translations"]')?.getAttribute('aria-label')).toBe('Показать все переводы');
  });

  it('renders a data-driven five-column word table with hidden translation masks', () => {
    const root = document.createElement('main');
    const state: IUiState = {
      ...INITIAL_UI_STATE,
      phase: PAGE_PHASE.LOADED,
      activeWordSetId: 'set-1',
      wordSet: createWordSet(),
    };

    renderApp(root, state);

    expect([...root.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual([
      'Слово',
      'Транскрипция',
      'Перевод',
      'Пример',
      'Перевод примера',
    ]);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(root.querySelectorAll('col')).toHaveLength(5);
    expect(root.querySelectorAll('button[data-action="toggle-word-translation"]')).toHaveLength(2);
    expect(root.querySelectorAll('button[data-action="toggle-example-translation"]')).toHaveLength(2);
    expect(root.querySelector('[data-word-id="word-1"]')?.textContent).toContain('λέξη word-1');
    expect(root.querySelector('[data-action="toggle-word-translation"][data-word-id="word-1"]')?.classList.contains('_word-table-mask__hidden')).toBe(true);
    expect(root.querySelector('[data-action="toggle-word-translation"][data-word-id="word-1"]')?.textContent).toBe('translation word-1');
  });

  it('assigns imported text without creating markup', () => {
    const root = document.createElement('main');
    const state: IUiState = {
      ...INITIAL_UI_STATE,
      phase: PAGE_PHASE.LOADED,
      activeWordSetId: 'set-1',
      wordSet: {
        id: 'set-1',
        name: 'Базовый набор',
        words: [
          {
            ...createWord('word-1'),
            translation: '<img src=x onerror=alert(1)>',
          },
        ],
      },
    };

    renderApp(root, state);

    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('dispatches independent translation toggles through stable word ids', () => {
    const root = createInteractiveRoot();

    getButton(root, '[data-action="toggle-word-translation"][data-word-id="word-1"]').click();

    expect(getButton(root, '[data-action="toggle-word-translation"][data-word-id="word-1"]').classList.contains('_word-table-mask__revealed')).toBe(true);
    expect(getButton(root, '[data-action="toggle-example-translation"][data-word-id="word-1"]').classList.contains('_word-table-mask__hidden')).toBe(true);

    getButton(root, '[data-action="toggle-example-translation"][data-word-id="word-1"]').click();

    expect(getButton(root, '[data-action="toggle-example-translation"][data-word-id="word-1"]').classList.contains('_word-table-mask__revealed')).toBe(true);
    expect(getButton(root, '[data-action="toggle-word-translation"][data-word-id="word-2"]').classList.contains('_word-table-mask__hidden')).toBe(true);
  });

  it('uses the global translation toggle to show mixed rows and then hide all rows', () => {
    const root = createInteractiveRoot();

    getButton(root, '[data-action="toggle-word-translation"][data-word-id="word-1"]').click();
    getButton(root, '[data-action="toggle-all-translations"]').click();

    expect(root.querySelectorAll('._word-table-mask__revealed')).toHaveLength(4);
    expect(getButton(root, '[data-action="toggle-all-translations"]').getAttribute('aria-label')).toBe('Скрыть все переводы');

    getButton(root, '[data-action="toggle-all-translations"]').click();

    expect(root.querySelectorAll('._word-table-mask__hidden')).toHaveLength(4);
    expect(getButton(root, '[data-action="toggle-all-translations"]').getAttribute('aria-label')).toBe('Показать все переводы');
  });

  it('expands declension details inline with aria state and updated tooltip', () => {
    const root = createInteractiveRoot();
    const wordButton = getButton(root, '[data-action="toggle-declension"][data-word-id="word-1"]');

    wordButton.click();

    const expandedButton = getButton(root, '[data-action="toggle-declension"][data-word-id="word-1"]');
    const regionId = expandedButton.getAttribute('aria-controls');

    if (regionId === null) {
      throw new Error('Expanded word button is missing aria-controls.');
    }

    expect(expandedButton.getAttribute('aria-expanded')).toBe('true');
    expect(expandedButton.getAttribute('data-tooltip')).toBe('Скрыть склонение');
    expect(expandedButton.classList.contains('_word-table-word-button__expanded')).toBe(true);
    expect(regionId).toBe('declension-word-1');
    expect(getElement(root, `#${regionId}`).textContent).toContain('Единственное число');
    expect(getElement(root, `#${regionId}`).textContent).toContain('Множественное число');
  });

  it('toggles declension when the chevron is clicked and keeps multiple rows open', () => {
    const root = createInteractiveRoot();
    const firstChevron = getElement(root, '[data-action="toggle-declension"][data-word-id="word-1"] svg');

    firstChevron.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    getButton(root, '[data-action="toggle-declension"][data-word-id="word-2"]').click();

    expect(root.querySelectorAll('.declension')).toHaveLength(2);
    expect(getButton(root, '[data-action="toggle-declension"][data-word-id="word-1"]').getAttribute('aria-expanded')).toBe('true');
    expect(getButton(root, '[data-action="toggle-declension"][data-word-id="word-2"]').getAttribute('aria-expanded')).toBe('true');
  });

  it('renders all declension cases in canonical order with visible translations', () => {
    const root = createInteractiveRoot();

    getButton(root, '[data-action="toggle-declension"][data-word-id="word-1"]').click();
    getButton(root, '[data-action="toggle-all-translations"]').click();

    const region = getElement(root, '#declension-word-1');

    expect([...region.querySelectorAll('._declension-case')].map((caseLabel) => caseLabel.textContent)).toEqual([
      'именит.',
      'родит.',
      'винит.',
      'зват.',
      'именит.',
      'родит.',
      'винит.',
      'зват.',
    ]);
    expect(region.textContent).toContain('form nominative');
    expect(region.textContent).toContain('translation nominative');
    expect(region.textContent).toContain('example translation nominative');
    expect(region.querySelector('._word-table-mask')).toBeNull();
  });
});

function createInteractiveRoot(): HTMLElement {
  const root = document.createElement('main');
  const state: IUiState = {
    ...INITIAL_UI_STATE,
    phase: PAGE_PHASE.LOADED,
    activeWordSetId: 'set-1',
    wordSet: createWordSet(),
  };
  const store = createStore(state, uiReducer);

  attachAppEventHandlers(root, store);
  renderApp(root, store.getState());
  store.subscribe((nextState) => {
    renderApp(root, nextState);
  });

  return root;
}

function getButton(root: HTMLElement, selector: string): HTMLButtonElement {
  const button = root.querySelector(selector);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button for selector ${selector}`);
  }

  return button;
}

function getElement(root: HTMLElement, selector: string): Element {
  const element = root.querySelector(selector);

  if (element === null) {
    throw new Error(`Missing element for selector ${selector}`);
  }

  return element;
}

function createWordSet(): IWordSet {
  return {
    id: 'set-1',
    name: 'Базовый набор',
    words: [
      createWord('word-1'),
      createWord('word-2'),
    ],
  };
}

function createWord(id: string): IWord {
  return {
    id,
    word: `λέξη ${id}`,
    transcription: `transcription ${id}`,
    translation: `translation ${id}`,
    example: `example ${id}`,
    exampleTranslation: `example translation ${id}`,
    declensions: {
      singular: createDeclensions(),
      plural: createDeclensions(),
    },
  };
}

function createDeclensions(): IDeclensionEntry[] {
  return [
    createDeclensionEntry(GREEK_CASE.NOMINATIVE),
    createDeclensionEntry(GREEK_CASE.GENITIVE),
    createDeclensionEntry(GREEK_CASE.ACCUSATIVE),
    createDeclensionEntry(GREEK_CASE.VOCATIVE),
  ];
}

function createDeclensionEntry(greekCase: GREEK_CASE): IDeclensionEntry {
  return {
    case: greekCase,
    form: `form ${greekCase}`,
    translation: `translation ${greekCase}`,
    example: `example ${greekCase}`,
    exampleTranslation: `example translation ${greekCase}`,
  };
}
