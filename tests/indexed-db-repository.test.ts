import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';

import {
  type IWordSet,
  validateWordSetInput,
} from '../src/features/word-sets/word-sets';
import {
  createIndexedDbWordSetRepository,
  WORD_SET_RECORD_SCHEMA_VERSION,
  WORD_SET_REPOSITORY_ERROR_CODE,
  WORD_SETS_DATABASE_VERSION,
} from '../src/persistence/indexed-db';
import { referenceWordSetInput } from './fixtures/reference-word-set';

describe('IndexedDB word-set repository', () => {
  it('saves and loads a complete validated reference set', async () => {
    const wordSet = getReferenceWordSet();
    const repository = createIndexedDbWordSetRepository({
      databaseName: createDatabaseName(),
      indexedDBFactory: indexedDB,
      now: () => '2026-07-12T08:00:00.000Z',
    });
    const saveResult = await repository.save(wordSet);

    expect(saveResult.ok).toBe(true);

    if (saveResult.ok) {
      expect(saveResult.value).toEqual({
        id: wordSet.id,
        schemaVersion: WORD_SET_RECORD_SCHEMA_VERSION,
        name: wordSet.name,
        words: wordSet.words,
        createdAt: '2026-07-12T08:00:00.000Z',
        updatedAt: '2026-07-12T08:00:00.000Z',
      });
    }

    const loadResult = await repository.getById(wordSet.id);

    expect(loadResult.ok).toBe(true);

    if (loadResult.ok) {
      expect(loadResult.value).toEqual(saveResult.ok ? saveResult.value : null);
    }
  });

  it('returns null for a missing record', async () => {
    const repository = createIndexedDbWordSetRepository({
      databaseName: createDatabaseName(),
      indexedDBFactory: indexedDB,
    });
    const loadResult = await repository.getById('missing-set');

    expect(loadResult.ok).toBe(true);

    if (loadResult.ok) {
      expect(loadResult.value).toBeNull();
    }
  });

  it('does not report success when a write transaction fails', async () => {
    const databaseName = createDatabaseName();
    const wordSet = getReferenceWordSet();

    await createDatabaseWithoutObjectStore(databaseName);

    const repository = createIndexedDbWordSetRepository({
      databaseName,
      indexedDBFactory: indexedDB,
    });
    const saveResult = await repository.save(wordSet);

    expect(saveResult.ok).toBe(false);

    if (!saveResult.ok) {
      expect(saveResult.error.code).toBe(WORD_SET_REPOSITORY_ERROR_CODE.TRANSACTION_FAILED);
    }
  });
});

let databaseCounter = 0;

function createDatabaseName(): string {
  databaseCounter += 1;

  return `word-learning-test-${databaseCounter}`;
}

function getReferenceWordSet(): IWordSet {
  const result = validateWordSetInput(referenceWordSetInput);

  if (!result.ok) {
    throw new Error('Reference word-set fixture must be valid.');
  }

  return result.wordSet;
}

function createDatabaseWithoutObjectStore(databaseName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, WORD_SETS_DATABASE_VERSION);

    request.onupgradeneeded = () => {};
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Could not create test database.'));
    };
  });
}
