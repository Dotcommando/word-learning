import { describe, expect, it } from 'vitest';

import { INITIAL_UI_STATE, PAGE_PHASE, uiReducer } from '../src/features/ui-state/ui-state';
import { importWordSetFile } from '../src/features/word-sets/import-word-set';
import {
  GREEK_CASE,
  type IPersistedWordSetRecord,
  type IWordSet,
} from '../src/features/word-sets/word-sets';
import {
  type IWordSetRepository,
  WORD_SET_REPOSITORY_ERROR_CODE,
} from '../src/persistence/indexed-db';
import { createStore } from '../src/state/store';

describe('importWordSetFile', () => {
  it('validates, saves, and activates a valid JSON word set', async () => {
    const previousWordSet = createWordSet('previous-set');
    const store = createStore(
      {
        ...INITIAL_UI_STATE,
        phase: PAGE_PHASE.LOADED,
        activeWordSetId: previousWordSet.id,
        wordSet: previousWordSet,
        revealedWordTranslationIds: new Set([
          previousWordSet.words[0]?.id ?? '',
        ]),
        expandedWordIds: new Set([
          previousWordSet.words[0]?.id ?? '',
        ]),
      },
      uiReducer,
    );
    const fixture = createRepositoryFixture();

    await importWordSetFile({
      file: createJsonFile(createWordSetInput('imported-set')),
      isCurrentOperation: () => true,
      repository: fixture.repository,
      store,
    });

    expect(fixture.savedWordSets).toHaveLength(1);
    expect(store.getState().phase).toBe(PAGE_PHASE.LOADED);
    expect(store.getState().activeWordSetId).toBe('imported-set');
    expect(store.getState().wordSet?.name).toBe('Импортированный набор imported-set');
    expect([...store.getState().revealedWordTranslationIds]).toEqual([]);
    expect([...store.getState().expandedWordIds]).toEqual([]);
  });

  it('shows malformed JSON errors without saving or replacing the previous set', async () => {
    const previousWordSet = createWordSet('previous-set');
    const store = createStore(
      {
        ...INITIAL_UI_STATE,
        phase: PAGE_PHASE.LOADED,
        activeWordSetId: previousWordSet.id,
        wordSet: previousWordSet,
      },
      uiReducer,
    );
    const fixture = createRepositoryFixture();

    await importWordSetFile({
      file: new File(['{'], 'broken.json', { type: 'application/json' }),
      isCurrentOperation: () => true,
      repository: fixture.repository,
      store,
    });

    expect(fixture.savedWordSets).toHaveLength(0);
    expect(store.getState().phase).toBe(PAGE_PHASE.LOADED);
    expect(store.getState().wordSet?.id).toBe(previousWordSet.id);
    expect(store.getState().errorMessage).toContain('Файл должен содержать корректный JSON.');
  });

  it('shows validation errors without saving invalid data', async () => {
    const store = createStore(INITIAL_UI_STATE, uiReducer);
    const fixture = createRepositoryFixture();

    await importWordSetFile({
      file: createJsonFile({
        words: [],
      }),
      isCurrentOperation: () => true,
      repository: fixture.repository,
      store,
    });

    expect(fixture.savedWordSets).toHaveLength(0);
    expect(store.getState().phase).toBe(PAGE_PHASE.ERROR);
    expect(store.getState().errorMessage).toContain('$.name');
  });

  it('keeps the imported set inactive when IndexedDB save fails', async () => {
    const store = createStore(INITIAL_UI_STATE, uiReducer);
    const fixture = createRepositoryFixture({
      saveFails: true,
    });

    await importWordSetFile({
      file: createJsonFile(createWordSetInput('imported-set')),
      isCurrentOperation: () => true,
      repository: fixture.repository,
      store,
    });

    expect(fixture.savedWordSets).toHaveLength(1);
    expect(store.getState().phase).toBe(PAGE_PHASE.ERROR);
    expect(store.getState().activeWordSetId).toBeNull();
    expect(store.getState().errorMessage).toContain('Не удалось сохранить набор слов');
  });

  it('ignores stale import operations before saving', async () => {
    const store = createStore(INITIAL_UI_STATE, uiReducer);
    const fixture = createRepositoryFixture();

    await importWordSetFile({
      file: createJsonFile(createWordSetInput('stale-set')),
      isCurrentOperation: () => false,
      repository: fixture.repository,
      store,
    });

    expect(fixture.savedWordSets).toHaveLength(0);
    expect(store.getState().phase).toBe(PAGE_PHASE.LOADING);
  });
});

interface IRepositoryFixtureOptions {
  saveFails?: boolean;
}

interface IRepositoryFixture {
  repository: IWordSetRepository;
  savedWordSets: IWordSet[];
}

function createRepositoryFixture(options: IRepositoryFixtureOptions = {}): IRepositoryFixture {
  const savedWordSets: IWordSet[] = [];

  return {
    savedWordSets,
    repository: {
      async save(wordSet) {
        savedWordSets.push(wordSet);

        return options.saveFails === true
          ? {
            ok: false,
            error: {
              code: WORD_SET_REPOSITORY_ERROR_CODE.TRANSACTION_FAILED,
              message: 'Write failed.',
            },
          }
          : {
            ok: true,
            value: createPersistedRecord(wordSet),
          };
      },
      async getById() {
        return {
          ok: true,
          value: null,
        };
      },
    },
  };
}

function createJsonFile(input: unknown): File {
  return new File([JSON.stringify(input)], 'words.json', {
    type: 'application/json',
  });
}

function createWordSetInput(id: string): unknown {
  return {
    id,
    name: `Импортированный набор ${id}`,
    words: [
      {
        id: `${id}-word`,
        word: 'άνθρωπος',
        transcription: 'ánthropos',
        translation: 'человек',
        example: 'Ο άνθρωπος περιμένει στη στάση.',
        exampleTranslation: 'Человек ждёт на остановке.',
        declensions: {
          singular: createDeclensionInputs(),
          plural: createDeclensionInputs(),
        },
      },
    ],
  };
}

function createWordSet(id: string): IWordSet {
  return {
    id,
    name: `Набор ${id}`,
    words: [
      {
        id: `${id}-word`,
        word: 'άνθρωπος',
        transcription: 'ánthropos',
        translation: 'человек',
        example: 'Ο άνθρωπος περιμένει στη στάση.',
        exampleTranslation: 'Человек ждёт на остановке.',
        declensions: {
          singular: createDeclensionEntries(),
          plural: createDeclensionEntries(),
        },
      },
    ],
  };
}

function createDeclensionInputs(): unknown[] {
  return [
    createDeclensionInput(GREEK_CASE.NOMINATIVE),
    createDeclensionInput(GREEK_CASE.GENITIVE),
    createDeclensionInput(GREEK_CASE.ACCUSATIVE),
    createDeclensionInput(GREEK_CASE.VOCATIVE),
  ];
}

function createDeclensionInput(greekCase: GREEK_CASE): unknown {
  return {
    case: greekCase,
    form: `form ${greekCase}`,
    translation: `translation ${greekCase}`,
    example: `example ${greekCase}`,
    exampleTranslation: `example translation ${greekCase}`,
  };
}

function createDeclensionEntries() {
  return [
    createDeclensionEntry(GREEK_CASE.NOMINATIVE),
    createDeclensionEntry(GREEK_CASE.GENITIVE),
    createDeclensionEntry(GREEK_CASE.ACCUSATIVE),
    createDeclensionEntry(GREEK_CASE.VOCATIVE),
  ];
}

function createDeclensionEntry(greekCase: GREEK_CASE) {
  return {
    case: greekCase,
    form: `form ${greekCase}`,
    translation: `translation ${greekCase}`,
    example: `example ${greekCase}`,
    exampleTranslation: `example translation ${greekCase}`,
  };
}

function createPersistedRecord(wordSet: IWordSet): IPersistedWordSetRecord {
  return {
    id: wordSet.id,
    schemaVersion: 1,
    name: wordSet.name,
    words: wordSet.words,
    createdAt: '2026-07-12T00:00:00.000Z',
    updatedAt: '2026-07-12T00:00:00.000Z',
  };
}
