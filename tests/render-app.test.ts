import { describe, expect, it } from 'vitest';

import {
  INITIAL_UI_STATE,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
} from '../src/features/ui-state/ui-state';
import {
  GREEK_CASE,
  type IDeclensionEntry,
  type IWord,
  type IWordSet,
} from '../src/features/word-sets/word-sets';
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
});

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
