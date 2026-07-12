import type { IPersistenceAdapter } from '../../state/persistence';
import {
  type IUiState,
  THEME_MODE,
  THEME_MODE_ARRAY,
} from './ui-state';

export const UI_STATE_STORAGE_KEY = 'word-learning/ui-state';
export const UI_STATE_VERSION = 1;

export interface IStringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface IPersistedUiStateEnvelope {
  version: number;
  state: IPersistedUiState;
}

interface IPersistedUiState {
  theme: THEME_MODE;
  activeWordSetId: string | null;
  areTranslationsGloballyVisible: boolean;
  revealedWordTranslationIds: string[];
  revealedExampleTranslationIds: string[];
  expandedWordIds: string[];
}

interface INullableStringReadResult {
  isValid: boolean;
  value: string | null;
}

export function localStoragePersistence(
  key: string,
  version: number,
  storage = getBrowserLocalStorage(),
): IPersistenceAdapter<IUiState> {
  return {
    restore(defaultState) {
      if (storage === null) {
        return defaultState;
      }

      try {
        const storedValue = storage.getItem(key);

        if (storedValue === null) {
          return defaultState;
        }

        const parsed: unknown = JSON.parse(storedValue);
        const persistedState = readPersistedUiStateEnvelope(parsed, version);

        return persistedState === null ? defaultState : hydrateUiState(defaultState, persistedState);
      } catch {
        return defaultState;
      }
    },
    persist(state) {
      if (storage === null) {
        return;
      }

      try {
        storage.setItem(key, JSON.stringify(createPersistedEnvelope(state, version)));
      } catch {
        return;
      }
    },
  };
}

function hydrateUiState(defaultState: IUiState, persistedState: IPersistedUiState): IUiState {
  return {
    ...defaultState,
    theme: persistedState.theme,
    activeWordSetId: persistedState.activeWordSetId,
    areTranslationsGloballyVisible: persistedState.areTranslationsGloballyVisible,
    revealedWordTranslationIds: new Set(persistedState.revealedWordTranslationIds),
    revealedExampleTranslationIds: new Set(persistedState.revealedExampleTranslationIds),
    expandedWordIds: new Set(persistedState.expandedWordIds),
  };
}

function createPersistedEnvelope(state: IUiState, version: number): IPersistedUiStateEnvelope {
  return {
    version,
    state: {
      theme: state.theme,
      activeWordSetId: state.activeWordSetId,
      areTranslationsGloballyVisible: state.areTranslationsGloballyVisible,
      revealedWordTranslationIds: [...state.revealedWordTranslationIds],
      revealedExampleTranslationIds: [...state.revealedExampleTranslationIds],
      expandedWordIds: [...state.expandedWordIds],
    },
  };
}

function readPersistedUiStateEnvelope(input: unknown, version: number): IPersistedUiState | null {
  if (!isStructuredValue(input)) {
    return null;
  }

  const persistedVersion = readProperty(input, 'version');

  if (persistedVersion !== version) {
    return null;
  }

  const state = readProperty(input, 'state');

  return readPersistedUiState(state);
}

function readPersistedUiState(input: unknown): IPersistedUiState | null {
  if (!isStructuredValue(input)) {
    return null;
  }

  const theme = readTheme(readProperty(input, 'theme'));
  const activeWordSetId = readNullableString(readProperty(input, 'activeWordSetId'), null);
  const areTranslationsGloballyVisible = readBoolean(readProperty(input, 'areTranslationsGloballyVisible'), false);
  const revealedWordTranslationIds = readStringArray(readProperty(input, 'revealedWordTranslationIds'), []);
  const revealedExampleTranslationIds = readStringArray(readProperty(input, 'revealedExampleTranslationIds'), []);
  const expandedWordIds = readStringArray(readProperty(input, 'expandedWordIds'), []);

  return theme === null
    || !activeWordSetId.isValid
    || areTranslationsGloballyVisible === null
    || revealedWordTranslationIds === null
    || revealedExampleTranslationIds === null
    || expandedWordIds === null
    ? null
    : {
      theme,
      activeWordSetId: activeWordSetId.value,
      areTranslationsGloballyVisible,
      revealedWordTranslationIds,
      revealedExampleTranslationIds,
      expandedWordIds,
    };
}

function readTheme(input: unknown): THEME_MODE | null {
  if (input === undefined) {
    return THEME_MODE.LIGHT;
  }
  if (typeof input !== 'string') {
    return null;
  }

  return isThemeMode(input) ? input : null;
}

function readNullableString(input: unknown, fallback: string | null): INullableStringReadResult {
  if (input === undefined) {
    return {
      isValid: true,
      value: fallback,
    };
  }

  return input === null || typeof input === 'string'
    ? {
      isValid: true,
      value: input,
    }
    : {
      isValid: false,
      value: fallback,
    };
}

function readBoolean(input: unknown, fallback: boolean): boolean | null {
  if (input === undefined) {
    return fallback;
  }

  return typeof input === 'boolean' ? input : null;
}

function readStringArray(input: unknown, fallback: string[]): string[] | null {
  if (input === undefined) {
    return fallback;
  }
  if (!Array.isArray(input)) {
    return null;
  }

  return input.every((item) => typeof item === 'string') ? input : null;
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

function isThemeMode(value: string): value is THEME_MODE {
  return THEME_MODE_ARRAY.some((theme) => theme === value);
}

function getBrowserLocalStorage(): IStringStorage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
