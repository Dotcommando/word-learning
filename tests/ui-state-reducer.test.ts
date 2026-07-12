import { describe, expect, it } from 'vitest';

import {
  areAllCurrentTranslationsVisible,
  INITIAL_UI_STATE,
  type IUiState,
  PAGE_PHASE,
  THEME_MODE,
  UI_ACTION_TYPE,
  uiReducer,
} from '../src/features/ui-state/ui-state';
import {
  GREEK_CASE,
  type IDeclensionEntry,
  type IWord,
  type IWordSet,
} from '../src/features/word-sets/word-sets';

describe('uiReducer', () => {
  it('handles bootstrap start, success, failure, and invalid active-set clearing', () => {
    const wordSet = createWordSet([
      'word-1',
      'word-2',
    ]);
    const loadingState = uiReducer(INITIAL_UI_STATE, {
      type: UI_ACTION_TYPE.BOOTSTRAP_STARTED,
    });
    const loadedState = uiReducer(
      {
        ...loadingState,
        revealedWordTranslationIds: new Set([
          'word-1',
          'stale-word',
        ]),
        revealedExampleTranslationIds: new Set([
          'word-1',
          'stale-word',
        ]),
        expandedWordIds: new Set([
          'word-2',
          'stale-word',
        ]),
      },
      {
        type: UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED,
        activeWordSetId: wordSet.id,
        wordSet,
      },
    );
    const failedState = uiReducer(loadedState, {
      type: UI_ACTION_TYPE.BOOTSTRAP_FAILED,
      errorMessage: 'Cannot open IndexedDB.',
    });
    const clearedState = uiReducer(failedState, {
      type: UI_ACTION_TYPE.INVALID_ACTIVE_SET_CLEARED,
    });

    expect(loadingState.phase).toBe(PAGE_PHASE.LOADING);
    expect(loadedState.phase).toBe(PAGE_PHASE.LOADED);
    expect(loadedState.activeWordSetId).toBe(wordSet.id);
    expect([...loadedState.revealedWordTranslationIds]).toEqual([
      'word-1',
    ]);
    expect([...loadedState.expandedWordIds]).toEqual([
      'word-2',
    ]);
    expect(failedState.phase).toBe(PAGE_PHASE.ERROR);
    expect(failedState.errorMessage).toBe('Cannot open IndexedDB.');
    expect(clearedState).toEqual(INITIAL_UI_STATE);
  });

  it('handles bootstrap success with no active word set as the empty state', () => {
    const state = uiReducer(INITIAL_UI_STATE, {
      type: UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED,
      activeWordSetId: null,
      wordSet: null,
    });

    expect(state.phase).toBe(PAGE_PHASE.EMPTY);
    expect(state.activeWordSetId).toBeNull();
    expect(state.wordSet).toBeNull();
  });

  it('toggles the theme', () => {
    const darkState = uiReducer(INITIAL_UI_STATE, {
      type: UI_ACTION_TYPE.THEME_TOGGLED,
    });
    const lightState = uiReducer(darkState, {
      type: UI_ACTION_TYPE.THEME_TOGGLED,
    });

    expect(darkState.theme).toBe(THEME_MODE.DARK);
    expect(lightState.theme).toBe(THEME_MODE.LIGHT);
  });

  it('toggles individual translations and recalculates global visibility', () => {
    const state = createLoadedState();
    const firstWordShown = uiReducer(state, {
      type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED,
      wordId: 'word-1',
    });
    const firstExampleShown = uiReducer(firstWordShown, {
      type: UI_ACTION_TYPE.EXAMPLE_TRANSLATION_TOGGLED,
      wordId: 'word-1',
    });
    const firstWordHidden = uiReducer(firstExampleShown, {
      type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED,
      wordId: 'word-1',
    });

    expect(firstWordShown.revealedWordTranslationIds.has('word-1')).toBe(true);
    expect(firstWordShown.areTranslationsGloballyVisible).toBe(false);
    expect(firstExampleShown.revealedExampleTranslationIds.has('word-1')).toBe(true);
    expect(areAllCurrentTranslationsVisible(firstExampleShown)).toBe(false);
    expect(firstWordHidden.revealedWordTranslationIds.has('word-1')).toBe(false);
  });

  it('shows all translations from a mixed state and then hides all visible translations', () => {
    const mixedState = uiReducer(createLoadedState(), {
      type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED,
      wordId: 'word-1',
    });
    const allShownState = uiReducer(mixedState, {
      type: UI_ACTION_TYPE.GLOBAL_TRANSLATIONS_TOGGLED,
    });
    const allHiddenState = uiReducer(allShownState, {
      type: UI_ACTION_TYPE.GLOBAL_TRANSLATIONS_TOGGLED,
    });

    expect(allShownState.areTranslationsGloballyVisible).toBe(true);
    expect([...allShownState.revealedWordTranslationIds].sort()).toEqual([
      'word-1',
      'word-2',
    ]);
    expect([...allShownState.revealedExampleTranslationIds].sort()).toEqual([
      'word-1',
      'word-2',
    ]);
    expect(allHiddenState.areTranslationsGloballyVisible).toBe(false);
    expect([...allHiddenState.revealedWordTranslationIds]).toEqual([]);
    expect([...allHiddenState.revealedExampleTranslationIds]).toEqual([]);
  });

  it('keeps multiple declension rows expanded by stable word id', () => {
    const firstExpanded = uiReducer(createLoadedState(), {
      type: UI_ACTION_TYPE.DECLENSION_TOGGLED,
      wordId: 'word-1',
    });
    const bothExpanded = uiReducer(firstExpanded, {
      type: UI_ACTION_TYPE.DECLENSION_TOGGLED,
      wordId: 'word-2',
    });
    const secondOnlyExpanded = uiReducer(bothExpanded, {
      type: UI_ACTION_TYPE.DECLENSION_TOGGLED,
      wordId: 'word-1',
    });

    expect([...bothExpanded.expandedWordIds].sort()).toEqual([
      'word-1',
      'word-2',
    ]);
    expect([...secondOnlyExpanded.expandedWordIds]).toEqual([
      'word-2',
    ]);
  });

  it('handles import start, success, and failure while preserving a previous loaded set on failure', () => {
    const previousState = createLoadedState();
    const loadingState = uiReducer(previousState, {
      type: UI_ACTION_TYPE.IMPORT_STARTED,
    });
    const importedWordSet = createWordSet([
      'new-word',
    ]);
    const importedState = uiReducer(
      {
        ...loadingState,
        revealedWordTranslationIds: new Set([
          'word-1',
        ]),
        expandedWordIds: new Set([
          'word-2',
        ]),
      },
      {
        type: UI_ACTION_TYPE.IMPORT_SUCCEEDED,
        wordSet: importedWordSet,
      },
    );
    const failedReplacementState = uiReducer(importedState, {
      type: UI_ACTION_TYPE.IMPORT_FAILED,
      errorMessage: 'Invalid JSON.',
    });
    const failedEmptyState = uiReducer(INITIAL_UI_STATE, {
      type: UI_ACTION_TYPE.IMPORT_FAILED,
      errorMessage: 'Invalid JSON.',
    });

    expect(loadingState.phase).toBe(PAGE_PHASE.LOADING);
    expect(importedState.phase).toBe(PAGE_PHASE.LOADED);
    expect(importedState.activeWordSetId).toBe(importedWordSet.id);
    expect([...importedState.revealedWordTranslationIds]).toEqual([]);
    expect([...importedState.expandedWordIds]).toEqual([]);
    expect(failedReplacementState.phase).toBe(PAGE_PHASE.LOADED);
    expect(failedReplacementState.wordSet?.id).toBe(importedWordSet.id);
    expect(failedReplacementState.errorMessage).toBe('Invalid JSON.');
    expect(failedEmptyState.phase).toBe(PAGE_PHASE.ERROR);
  });
});

function createLoadedState(): IUiState {
  const wordSet = createWordSet([
    'word-1',
    'word-2',
  ]);

  return {
    ...INITIAL_UI_STATE,
    phase: PAGE_PHASE.LOADED,
    activeWordSetId: wordSet.id,
    wordSet,
  };
}

function createWordSet(wordIds: string[]): IWordSet {
  return {
    id: 'test-word-set',
    name: 'Test word set',
    words: wordIds.map(createWord),
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
