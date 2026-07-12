import { describe, expect, it } from 'vitest';

import { restoreActiveWordSet } from '../src/app/bootstrap';
import {
  INITIAL_UI_STATE,
  type IUiState,
  PAGE_PHASE,
  uiReducer,
} from '../src/features/ui-state/ui-state';
import {
  GREEK_CASE,
  type IDeclensionEntry,
  type IPersistedWordSetRecord,
  type IWord,
  type IWordSet,
} from '../src/features/word-sets/word-sets';
import {
  type IWordSetRepository,
  WORD_SET_RECORD_SCHEMA_VERSION,
  WORD_SET_REPOSITORY_ERROR_CODE,
  type WordSetRepositoryResult,
} from '../src/persistence/indexed-db';
import { createStore } from '../src/state/store';

describe('restoreActiveWordSet', () => {
  it('enters the empty state when there is no active id', async () => {
    const store = createStore(INITIAL_UI_STATE, uiReducer);

    await restoreActiveWordSet(store, createRepositoryReturning(null));

    expect(store.getState().phase).toBe(PAGE_PHASE.EMPTY);
    expect(store.getState().activeWordSetId).toBeNull();
  });

  it('loads the active record and reconciles stale row ids', async () => {
    const wordSet = createWordSet([
      'word-1',
      'word-2',
    ]);
    const initialState: IUiState = {
      ...INITIAL_UI_STATE,
      activeWordSetId: wordSet.id,
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
    };
    const store = createStore(initialState, uiReducer);

    await restoreActiveWordSet(store, createRepositoryReturning(createRecord(wordSet)));

    const state = store.getState();

    expect(state.phase).toBe(PAGE_PHASE.LOADED);
    expect(state.activeWordSetId).toBe(wordSet.id);
    expect(state.wordSet?.id).toBe(wordSet.id);
    expect([...state.revealedWordTranslationIds]).toEqual([
      'word-1',
    ]);
    expect([...state.revealedExampleTranslationIds]).toEqual([
      'word-1',
    ]);
    expect([...state.expandedWordIds]).toEqual([
      'word-2',
    ]);
  });

  it('clears a missing active record and degrades to empty state', async () => {
    const initialState: IUiState = {
      ...INITIAL_UI_STATE,
      activeWordSetId: 'deleted-set',
      revealedWordTranslationIds: new Set([
        'stale-word',
      ]),
      expandedWordIds: new Set([
        'stale-word',
      ]),
    };
    const store = createStore(initialState, uiReducer);

    await restoreActiveWordSet(store, createRepositoryReturning(null));

    const state = store.getState();

    expect(state.phase).toBe(PAGE_PHASE.EMPTY);
    expect(state.activeWordSetId).toBeNull();
    expect([...state.revealedWordTranslationIds]).toEqual([]);
    expect([...state.expandedWordIds]).toEqual([]);
  });

  it('enters a visible error state when the repository fails', async () => {
    const store = createStore(
      {
        ...INITIAL_UI_STATE,
        activeWordSetId: 'set-1',
      },
      uiReducer,
    );

    await restoreActiveWordSet(store, createFailingRepository('IndexedDB failed.'));

    const state = store.getState();

    expect(state.phase).toBe(PAGE_PHASE.ERROR);
    expect(state.errorMessage).toBe('IndexedDB failed.');
    expect(state.activeWordSetId).toBe('set-1');
  });
});

function createRepositoryReturning(record: IPersistedWordSetRecord | null): IWordSetRepository {
  return {
    save: async (wordSet) => createSuccess(createRecord(wordSet)),
    getById: async () => createSuccess(record),
  };
}

function createFailingRepository(message: string): IWordSetRepository {
  return {
    save: async () => createFailure(message),
    getById: async () => createFailure(message),
  };
}

function createSuccess<TValue>(value: TValue): WordSetRepositoryResult<TValue> {
  return {
    ok: true,
    value,
  };
}

function createFailure<TValue>(message: string): WordSetRepositoryResult<TValue> {
  return {
    ok: false,
    error: {
      code: WORD_SET_REPOSITORY_ERROR_CODE.TRANSACTION_FAILED,
      message,
    },
  };
}

function createRecord(wordSet: IWordSet): IPersistedWordSetRecord {
  return {
    id: wordSet.id,
    schemaVersion: WORD_SET_RECORD_SCHEMA_VERSION,
    name: wordSet.name,
    words: wordSet.words,
    createdAt: '2026-07-12T08:00:00.000Z',
    updatedAt: '2026-07-12T08:00:00.000Z',
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
