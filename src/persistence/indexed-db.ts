import {
  type IPersistedWordSetRecord,
  type IWordSet,
  validateWordSetInput,
} from '../features/word-sets/word-sets';

export const WORD_SETS_DATABASE_NAME = 'word-learning-word-sets';
export const WORD_SETS_DATABASE_VERSION = 1;
export const WORD_SETS_OBJECT_STORE_NAME = 'wordSets';
export const WORD_SET_RECORD_SCHEMA_VERSION = 1;

export enum WORD_SET_REPOSITORY_ERROR_CODE {
  INDEXED_DB_UNAVAILABLE = 'indexed-db-unavailable',
  OPEN_FAILED = 'open-failed',
  TRANSACTION_FAILED = 'transaction-failed',
  INVALID_RECORD = 'invalid-record',
}

export interface IWordSetRepositoryError {
  code: WORD_SET_REPOSITORY_ERROR_CODE;
  message: string;
}

export interface IWordSetRepositorySuccess<TValue> {
  ok: true;
  value: TValue;
}

export interface IWordSetRepositoryFailure {
  ok: false;
  error: IWordSetRepositoryError;
}

export type WordSetRepositoryResult<TValue> =
  | IWordSetRepositorySuccess<TValue>
  | IWordSetRepositoryFailure;

export interface IWordSetRepository {
  save(wordSet: IWordSet): Promise<WordSetRepositoryResult<IPersistedWordSetRecord>>;
  getById(id: string): Promise<WordSetRepositoryResult<IPersistedWordSetRecord | null>>;
}

export interface IIndexedDbWordSetRepositoryOptions {
  databaseName?: string;
  indexedDBFactory?: IDBFactory | null;
  now?: () => string;
}

export function createIndexedDbWordSetRepository(
  options: IIndexedDbWordSetRepositoryOptions = {},
): IWordSetRepository {
  const databaseName = options.databaseName ?? WORD_SETS_DATABASE_NAME;
  const indexedDBFactory = options.indexedDBFactory ?? getBrowserIndexedDB();
  const now = options.now ?? createTimestamp;

  return {
    async save(wordSet) {
      const databaseResult = await openWordSetsDatabase(databaseName, indexedDBFactory);

      if (!databaseResult.ok) {
        return databaseResult;
      }

      const database = databaseResult.value;

      try {
        const transaction = database.transaction(WORD_SETS_OBJECT_STORE_NAME, 'readwrite');
        const completion = waitForTransaction(transaction);
        const store = transaction.objectStore(WORD_SETS_OBJECT_STORE_NAME);
        const existingInput = await requestToPromise<unknown>(store.get(wordSet.id));
        const existingRecord = readPersistedWordSetRecord(existingInput);
        const timestamp = now();
        const record: IPersistedWordSetRecord = {
          id: wordSet.id,
          schemaVersion: WORD_SET_RECORD_SCHEMA_VERSION,
          name: wordSet.name,
          words: wordSet.words,
          createdAt: existingRecord?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        await requestToPromise(store.put(record));
        await completion;

        return createSuccess(record);
      } catch (error) {
        return createFailure(
          WORD_SET_REPOSITORY_ERROR_CODE.TRANSACTION_FAILED,
          `Could not save word set: ${getErrorMessage(error)}`,
        );
      } finally {
        database.close();
      }
    },
    async getById(id) {
      const databaseResult = await openWordSetsDatabase(databaseName, indexedDBFactory);

      if (!databaseResult.ok) {
        return databaseResult;
      }

      const database = databaseResult.value;

      try {
        const transaction = database.transaction(WORD_SETS_OBJECT_STORE_NAME, 'readonly');
        const completion = waitForTransaction(transaction);
        const store = transaction.objectStore(WORD_SETS_OBJECT_STORE_NAME);
        const storedInput = await requestToPromise<unknown>(store.get(id));

        await completion;

        if (storedInput === undefined) {
          return createSuccess(null);
        }

        const record = readPersistedWordSetRecord(storedInput);

        return record === null
          ? createFailure(
            WORD_SET_REPOSITORY_ERROR_CODE.INVALID_RECORD,
            `Stored word set ${id} is invalid.`,
          )
          : createSuccess(record);
      } catch (error) {
        return createFailure(
          WORD_SET_REPOSITORY_ERROR_CODE.TRANSACTION_FAILED,
          `Could not load word set: ${getErrorMessage(error)}`,
        );
      } finally {
        database.close();
      }
    },
  };
}

function openWordSetsDatabase(
  databaseName: string,
  indexedDBFactory: IDBFactory | null,
): Promise<WordSetRepositoryResult<IDBDatabase>> {
  if (indexedDBFactory === null) {
    return Promise.resolve(createFailure(
      WORD_SET_REPOSITORY_ERROR_CODE.INDEXED_DB_UNAVAILABLE,
      'IndexedDB is unavailable.',
    ));
  }

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDBFactory.open(databaseName, WORD_SETS_DATABASE_VERSION);
    } catch (error) {
      resolve(createFailure(
        WORD_SET_REPOSITORY_ERROR_CODE.OPEN_FAILED,
        `Could not open IndexedDB: ${getErrorMessage(error)}`,
      ));

      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(WORD_SETS_OBJECT_STORE_NAME)) {
        database.createObjectStore(WORD_SETS_OBJECT_STORE_NAME, {
          keyPath: 'id',
        });
      }
    };
    request.onsuccess = () => {
      resolve(createSuccess(request.result));
    };
    request.onerror = () => {
      resolve(createFailure(
        WORD_SET_REPOSITORY_ERROR_CODE.OPEN_FAILED,
        `Could not open IndexedDB: ${getErrorMessage(request.error)}`,
      ));
    };
  });
}

function requestToPromise<TValue>(request: IDBRequest<TValue>): Promise<TValue> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'));
    };
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };
  });
}

function readPersistedWordSetRecord(input: unknown): IPersistedWordSetRecord | null {
  if (!isStructuredValue(input)) {
    return null;
  }

  const schemaVersion = readProperty(input, 'schemaVersion');
  const createdAt = readRequiredString(readProperty(input, 'createdAt'));
  const updatedAt = readRequiredString(readProperty(input, 'updatedAt'));

  if (schemaVersion !== WORD_SET_RECORD_SCHEMA_VERSION || createdAt === null || updatedAt === null) {
    return null;
  }

  const wordSetResult = validateWordSetInput({
    id: readProperty(input, 'id'),
    name: readProperty(input, 'name'),
    words: readProperty(input, 'words'),
  });

  return wordSetResult.ok
    ? {
      id: wordSetResult.wordSet.id,
      schemaVersion,
      name: wordSetResult.wordSet.name,
      words: wordSetResult.wordSet.words,
      createdAt,
      updatedAt,
    }
    : null;
}

function readRequiredString(input: unknown): string | null {
  return typeof input === 'string' && input.trim().length > 0 ? input : null;
}

function readProperty(source: unknown, propertyName: string): unknown {
  if (!isStructuredValue(source)) {
    return undefined;
  }

  return Object.getOwnPropertyDescriptor(source, propertyName)?.value;
}

function isStructuredValue(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function createSuccess<TValue>(value: TValue): IWordSetRepositorySuccess<TValue> {
  return {
    ok: true,
    value,
  };
}

function createFailure(
  code: WORD_SET_REPOSITORY_ERROR_CODE,
  message: string,
): IWordSetRepositoryFailure {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown IndexedDB error.';
}

function createTimestamp(): string {
  return new Date().toISOString();
}

function getBrowserIndexedDB(): IDBFactory | null {
  return globalThis.indexedDB ?? null;
}
