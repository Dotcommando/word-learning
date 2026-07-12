import type { IWordSet } from '../word-sets/word-sets';

export enum THEME_MODE {
  LIGHT = 'light',
  DARK = 'dark',
}

export const THEME_MODE_ARRAY = Object.values(THEME_MODE);

export enum PAGE_PHASE {
  EMPTY = 'empty',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
}

export const PAGE_PHASE_ARRAY = Object.values(PAGE_PHASE);

export enum TRANSLATION_GROUP {
  WORD = 'word',
  EXAMPLE = 'example',
}

export const TRANSLATION_GROUP_ARRAY = Object.values(TRANSLATION_GROUP);

export enum UI_ACTION_TYPE {
  BOOTSTRAP_STARTED = 'bootstrap-started',
  BOOTSTRAP_SUCCEEDED = 'bootstrap-succeeded',
  BOOTSTRAP_FAILED = 'bootstrap-failed',
  THEME_TOGGLED = 'theme-toggled',
  GLOBAL_TRANSLATIONS_TOGGLED = 'global-translations-toggled',
  WORD_TRANSLATION_TOGGLED = 'word-translation-toggled',
  EXAMPLE_TRANSLATION_TOGGLED = 'example-translation-toggled',
  DECLENSION_TOGGLED = 'declension-toggled',
  IMPORT_STARTED = 'import-started',
  IMPORT_SUCCEEDED = 'import-succeeded',
  IMPORT_FAILED = 'import-failed',
  INVALID_ACTIVE_SET_CLEARED = 'invalid-active-set-cleared',
}

export const UI_ACTION_TYPE_ARRAY = Object.values(UI_ACTION_TYPE);

export interface IUiState {
  theme: THEME_MODE;
  phase: PAGE_PHASE;
  activeWordSetId: string | null;
  wordSet: IWordSet | null;
  areTranslationsGloballyVisible: boolean;
  revealedWordTranslationIds: ReadonlySet<string>;
  revealedExampleTranslationIds: ReadonlySet<string>;
  expandedWordIds: ReadonlySet<string>;
  errorMessage: string | null;
}

export interface IUiBootstrapStartedAction {
  type: UI_ACTION_TYPE.BOOTSTRAP_STARTED;
}

export interface IUiBootstrapSucceededAction {
  type: UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED;
  activeWordSetId: string | null;
  wordSet: IWordSet | null;
}

export interface IUiBootstrapFailedAction {
  type: UI_ACTION_TYPE.BOOTSTRAP_FAILED;
  errorMessage: string;
}

export interface IUiThemeToggledAction {
  type: UI_ACTION_TYPE.THEME_TOGGLED;
}

export interface IUiGlobalTranslationsToggledAction {
  type: UI_ACTION_TYPE.GLOBAL_TRANSLATIONS_TOGGLED;
}

export interface IUiWordTranslationToggledAction {
  type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED;
  wordId: string;
}

export interface IUiExampleTranslationToggledAction {
  type: UI_ACTION_TYPE.EXAMPLE_TRANSLATION_TOGGLED;
  wordId: string;
}

export interface IUiDeclensionToggledAction {
  type: UI_ACTION_TYPE.DECLENSION_TOGGLED;
  wordId: string;
}

export interface IUiImportStartedAction {
  type: UI_ACTION_TYPE.IMPORT_STARTED;
}

export interface IUiImportSucceededAction {
  type: UI_ACTION_TYPE.IMPORT_SUCCEEDED;
  wordSet: IWordSet;
}

export interface IUiImportFailedAction {
  type: UI_ACTION_TYPE.IMPORT_FAILED;
  errorMessage: string;
}

export interface IUiInvalidActiveSetClearedAction {
  type: UI_ACTION_TYPE.INVALID_ACTIVE_SET_CLEARED;
}

export type UiAction =
  | IUiBootstrapStartedAction
  | IUiBootstrapSucceededAction
  | IUiBootstrapFailedAction
  | IUiThemeToggledAction
  | IUiGlobalTranslationsToggledAction
  | IUiWordTranslationToggledAction
  | IUiExampleTranslationToggledAction
  | IUiDeclensionToggledAction
  | IUiImportStartedAction
  | IUiImportSucceededAction
  | IUiImportFailedAction
  | IUiInvalidActiveSetClearedAction;

export const INITIAL_UI_STATE: IUiState = {
  theme: THEME_MODE.LIGHT,
  phase: PAGE_PHASE.EMPTY,
  activeWordSetId: null,
  wordSet: null,
  areTranslationsGloballyVisible: false,
  revealedWordTranslationIds: new Set<string>(),
  revealedExampleTranslationIds: new Set<string>(),
  expandedWordIds: new Set<string>(),
  errorMessage: null,
};

export function uiReducer(state: IUiState, action: UiAction): IUiState {
  switch (action.type) {
    case UI_ACTION_TYPE.BOOTSTRAP_STARTED:
      return {
        ...state,
        phase: PAGE_PHASE.LOADING,
        errorMessage: null,
      };
    case UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED:
      return applyLoadedWordSet(
        {
          ...state,
          phase: action.wordSet === null ? PAGE_PHASE.EMPTY : PAGE_PHASE.LOADED,
          activeWordSetId: action.activeWordSetId,
          wordSet: action.wordSet,
          errorMessage: null,
        },
        action.wordSet,
      );
    case UI_ACTION_TYPE.BOOTSTRAP_FAILED:
      return {
        ...state,
        phase: PAGE_PHASE.ERROR,
        wordSet: null,
        errorMessage: action.errorMessage,
      };
    case UI_ACTION_TYPE.THEME_TOGGLED:
      return {
        ...state,
        theme: state.theme === THEME_MODE.LIGHT ? THEME_MODE.DARK : THEME_MODE.LIGHT,
      };
    case UI_ACTION_TYPE.GLOBAL_TRANSLATIONS_TOGGLED:
      return areAllCurrentTranslationsVisible(state)
        ? hideAllTranslations(state)
        : showAllTranslations(state);
    case UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED:
      return withRecalculatedGlobalVisibility({
        ...state,
        revealedWordTranslationIds: toggleSetValue(state.revealedWordTranslationIds, action.wordId),
      });
    case UI_ACTION_TYPE.EXAMPLE_TRANSLATION_TOGGLED:
      return withRecalculatedGlobalVisibility({
        ...state,
        revealedExampleTranslationIds: toggleSetValue(state.revealedExampleTranslationIds, action.wordId),
      });
    case UI_ACTION_TYPE.DECLENSION_TOGGLED:
      return {
        ...state,
        expandedWordIds: toggleSetValue(state.expandedWordIds, action.wordId),
      };
    case UI_ACTION_TYPE.IMPORT_STARTED:
      return {
        ...state,
        phase: PAGE_PHASE.LOADING,
        errorMessage: null,
      };
    case UI_ACTION_TYPE.IMPORT_SUCCEEDED:
      return {
        ...state,
        phase: PAGE_PHASE.LOADED,
        activeWordSetId: action.wordSet.id,
        wordSet: action.wordSet,
        areTranslationsGloballyVisible: false,
        revealedWordTranslationIds: new Set<string>(),
        revealedExampleTranslationIds: new Set<string>(),
        expandedWordIds: new Set<string>(),
        errorMessage: null,
      };
    case UI_ACTION_TYPE.IMPORT_FAILED:
      return {
        ...state,
        phase: state.wordSet === null ? PAGE_PHASE.ERROR : PAGE_PHASE.LOADED,
        errorMessage: action.errorMessage,
      };
    case UI_ACTION_TYPE.INVALID_ACTIVE_SET_CLEARED:
      return {
        ...state,
        phase: PAGE_PHASE.EMPTY,
        activeWordSetId: null,
        wordSet: null,
        areTranslationsGloballyVisible: false,
        revealedWordTranslationIds: new Set<string>(),
        revealedExampleTranslationIds: new Set<string>(),
        expandedWordIds: new Set<string>(),
        errorMessage: null,
      };
    default:
      return assertNever(action);
  }
}

export function areAllCurrentTranslationsVisible(state: IUiState): boolean {
  const wordIds = getCurrentWordIds(state);

  return wordIds.length > 0 && wordIds.every((wordId) => (
    state.revealedWordTranslationIds.has(wordId)
    && state.revealedExampleTranslationIds.has(wordId)
  ));
}

function applyLoadedWordSet(state: IUiState, wordSet: IWordSet | null): IUiState {
  if (wordSet === null) {
    return {
      ...state,
      activeWordSetId: null,
      areTranslationsGloballyVisible: false,
      revealedWordTranslationIds: new Set<string>(),
      revealedExampleTranslationIds: new Set<string>(),
      expandedWordIds: new Set<string>(),
    };
  }

  return withRecalculatedGlobalVisibility({
    ...state,
    activeWordSetId: wordSet.id,
    revealedWordTranslationIds: keepKnownWordIds(state.revealedWordTranslationIds, wordSet),
    revealedExampleTranslationIds: keepKnownWordIds(state.revealedExampleTranslationIds, wordSet),
    expandedWordIds: keepKnownWordIds(state.expandedWordIds, wordSet),
  });
}

function showAllTranslations(state: IUiState): IUiState {
  const wordIds = getCurrentWordIds(state);

  return {
    ...state,
    areTranslationsGloballyVisible: wordIds.length > 0,
    revealedWordTranslationIds: new Set(wordIds),
    revealedExampleTranslationIds: new Set(wordIds),
  };
}

function hideAllTranslations(state: IUiState): IUiState {
  return {
    ...state,
    areTranslationsGloballyVisible: false,
    revealedWordTranslationIds: new Set<string>(),
    revealedExampleTranslationIds: new Set<string>(),
  };
}

function withRecalculatedGlobalVisibility(state: IUiState): IUiState {
  return {
    ...state,
    areTranslationsGloballyVisible: areAllCurrentTranslationsVisible(state),
  };
}

function keepKnownWordIds(ids: ReadonlySet<string>, wordSet: IWordSet): ReadonlySet<string> {
  const knownWordIds = new Set(getWordIds(wordSet));
  const filteredIds = [...ids].filter((id) => knownWordIds.has(id));

  return new Set(filteredIds);
}

function toggleSetValue(values: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const nextValues = new Set(values);

  if (nextValues.has(value)) {
    nextValues.delete(value);
  } else {
    nextValues.add(value);
  }

  return nextValues;
}

function getCurrentWordIds(state: IUiState): string[] {
  return state.wordSet === null ? [] : getWordIds(state.wordSet);
}

function getWordIds(wordSet: IWordSet): string[] {
  return wordSet.words.map((word) => word.id);
}

function assertNever(action: never): never {
  throw new Error(`Unhandled UI action: ${JSON.stringify(action)}`);
}
