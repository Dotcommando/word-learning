import { describe, expect, it } from 'vitest';

import {
  type IStringStorage,
  localStoragePersistence,
  UI_STATE_STORAGE_KEY,
  UI_STATE_VERSION,
} from '../src/features/ui-state/persistence';
import {
  INITIAL_UI_STATE,
  PAGE_PHASE,
  THEME_MODE,
  UI_ACTION_TYPE,
  uiReducer,
} from '../src/features/ui-state/ui-state';
import { withPersistence } from '../src/state/persistence';
import { createStore } from '../src/state/store';

describe('ui-state persistence', () => {
  it('hydrates valid persisted state', () => {
    const storage = new MemoryStringStorage();

    storage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({
      version: UI_STATE_VERSION,
      state: {
        theme: THEME_MODE.DARK,
        activeWordSetId: 'set-1',
        areTranslationsGloballyVisible: true,
        revealedWordTranslationIds: [
          'word-1',
        ],
        revealedExampleTranslationIds: [
          'word-2',
        ],
        expandedWordIds: [
          'word-3',
        ],
      },
    }));

    const store = withPersistence(
      createStore(INITIAL_UI_STATE, uiReducer),
      localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION, storage),
    );
    const state = store.getState();

    expect(state.theme).toBe(THEME_MODE.DARK);
    expect(state.activeWordSetId).toBe('set-1');
    expect(state.areTranslationsGloballyVisible).toBe(true);
    expect([...state.revealedWordTranslationIds]).toEqual([
      'word-1',
    ]);
    expect([...state.revealedExampleTranslationIds]).toEqual([
      'word-2',
    ]);
    expect([...state.expandedWordIds]).toEqual([
      'word-3',
    ]);
    expect(state.phase).toBe(PAGE_PHASE.EMPTY);
    expect(state.wordSet).toBeNull();
    expect(state.errorMessage).toBeNull();
  });

  it('merges missing persisted fields with current defaults', () => {
    const storage = new MemoryStringStorage();

    storage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({
      version: UI_STATE_VERSION,
      state: {
        theme: THEME_MODE.DARK,
      },
    }));

    const store = withPersistence(
      createStore(INITIAL_UI_STATE, uiReducer),
      localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION, storage),
    );
    const state = store.getState();

    expect(state.theme).toBe(THEME_MODE.DARK);
    expect(state.activeWordSetId).toBeNull();
    expect([...state.revealedWordTranslationIds]).toEqual([]);
    expect([...state.expandedWordIds]).toEqual([]);
  });

  it('ignores malformed, invalid, and incompatible persisted state', () => {
    expect(hydrateFromStoredValue('{bad json').getState()).toEqual(INITIAL_UI_STATE);
    expect(hydrateFromStoredValue(JSON.stringify({
      version: UI_STATE_VERSION + 1,
      state: {
        theme: THEME_MODE.DARK,
      },
    })).getState()).toEqual(INITIAL_UI_STATE);
    expect(hydrateFromStoredValue(JSON.stringify({
      version: UI_STATE_VERSION,
      state: {
        theme: 12,
      },
    })).getState()).toEqual(INITIAL_UI_STATE);
  });

  it('writes persisted state after dispatch and excludes transient fields', () => {
    const storage = new MemoryStringStorage();
    const store = withPersistence(
      createStore(INITIAL_UI_STATE, uiReducer),
      localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION, storage),
    );

    store.dispatch({
      type: UI_ACTION_TYPE.THEME_TOGGLED,
    });
    store.dispatch({
      type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED,
      wordId: 'word-1',
    });
    store.dispatch({
      type: UI_ACTION_TYPE.DECLENSION_TOGGLED,
      wordId: 'word-2',
    });

    const storedValue = storage.readStoredValue(UI_STATE_STORAGE_KEY);

    expect(storedValue).toContain(`"version":${UI_STATE_VERSION}`);
    expect(storedValue).toContain('"theme":"dark"');
    expect(storedValue).toContain('"revealedWordTranslationIds":["word-1"]');
    expect(storedValue).toContain('"expandedWordIds":["word-2"]');
    expect(storedValue).not.toContain('phase');
    expect(storedValue).not.toContain('errorMessage');
    expect(storedValue).not.toContain('wordSet');
  });

  it('keeps the store usable when storage throws', () => {
    const store = withPersistence(
      createStore(INITIAL_UI_STATE, uiReducer),
      localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION, new ThrowingStringStorage()),
    );

    expect(store.getState()).toEqual(INITIAL_UI_STATE);
    expect(() => {
      store.dispatch({
        type: UI_ACTION_TYPE.THEME_TOGGLED,
      });
    }).not.toThrow();
    expect(store.getState().theme).toBe(THEME_MODE.DARK);
  });
});

function hydrateFromStoredValue(storedValue: string) {
  const storage = new MemoryStringStorage();

  storage.setItem(UI_STATE_STORAGE_KEY, storedValue);

  return withPersistence(
    createStore(INITIAL_UI_STATE, uiReducer),
    localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION, storage),
  );
}

class MemoryStringStorage implements IStringStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  readStoredValue(key: string): string {
    return this.values.get(key) ?? '';
  }
}

class ThrowingStringStorage implements IStringStorage {
  getItem(): string | null {
    throw new Error('Storage is unavailable.');
  }

  setItem(): void {
    throw new Error('Storage quota exceeded.');
  }
}
