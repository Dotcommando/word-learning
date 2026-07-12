import { uiStore } from '../features/ui-state/store';
import {
  type IUiState,
  UI_ACTION_TYPE,
  type UiAction,
} from '../features/ui-state/ui-state';
import {
  type IPersistedWordSetRecord,
  type IWordSet,
} from '../features/word-sets/domain';
import { createIndexedDbWordSetRepository, type IWordSetRepository } from '../persistence/indexed-db';
import type { IStore } from '../state/store';
import { renderApp } from '../ui/render-app';

export function bootstrapApp(): void {
  const appRoot = document.querySelector('[data-app-root]');

  if (!(appRoot instanceof HTMLElement)) {
    return;
  }

  attachAppEventHandlers(appRoot, uiStore);
  renderApp(appRoot, uiStore.getState());
  uiStore.subscribe((state) => {
    renderApp(appRoot, state);
  });
  void restoreActiveWordSet(uiStore, createIndexedDbWordSetRepository());
}

export function attachAppEventHandlers(root: HTMLElement, store: IStore<IUiState, UiAction>): void {
  root.addEventListener('click', (event) => {
    const button = findActionButton(event.target);

    if (button === null) {
      return;
    }

    dispatchButtonAction(button, store);
  });
}

export async function restoreActiveWordSet(
  store: IStore<IUiState, UiAction>,
  repository: IWordSetRepository,
): Promise<void> {
  const activeWordSetId = store.getState().activeWordSetId;

  store.dispatch({
    type: UI_ACTION_TYPE.BOOTSTRAP_STARTED,
  });

  if (activeWordSetId === null) {
    store.dispatch({
      type: UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED,
      activeWordSetId: null,
      wordSet: null,
    });

    return;
  }

  const recordResult = await repository.getById(activeWordSetId);

  if (!recordResult.ok) {
    store.dispatch({
      type: UI_ACTION_TYPE.BOOTSTRAP_FAILED,
      errorMessage: recordResult.error.message,
    });

    return;
  }
  if (recordResult.value === null) {
    store.dispatch({
      type: UI_ACTION_TYPE.INVALID_ACTIVE_SET_CLEARED,
    });

    return;
  }

  store.dispatch({
    type: UI_ACTION_TYPE.BOOTSTRAP_SUCCEEDED,
    activeWordSetId: recordResult.value.id,
    wordSet: createWordSetFromRecord(recordResult.value),
  });
}

function createWordSetFromRecord(record: IPersistedWordSetRecord): IWordSet {
  return {
    id: record.id,
    name: record.name,
    words: record.words,
  };
}

function findActionButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const button = target.closest('button[data-action]');

  return button instanceof HTMLButtonElement ? button : null;
}

function dispatchButtonAction(button: HTMLButtonElement, store: IStore<IUiState, UiAction>): void {
  const action = button.dataset['action'];
  const wordId = button.dataset['wordId'];

  switch (action) {
    case 'toggle-theme':
      store.dispatch({
        type: UI_ACTION_TYPE.THEME_TOGGLED,
      });
      break;
    case 'toggle-all-translations':
      store.dispatch({
        type: UI_ACTION_TYPE.GLOBAL_TRANSLATIONS_TOGGLED,
      });
      break;
    case 'toggle-word-translation':
      dispatchWordAction(wordId, store, UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED);
      break;
    case 'toggle-example-translation':
      dispatchWordAction(wordId, store, UI_ACTION_TYPE.EXAMPLE_TRANSLATION_TOGGLED);
      break;
    case 'toggle-declension':
      dispatchDeclensionAction(wordId, store);
      break;
    case 'load-word-set':
      break;
    case undefined:
      break;
    default:
      break;
  }
}

function dispatchWordAction(
  wordId: string | undefined,
  store: IStore<IUiState, UiAction>,
  type: UI_ACTION_TYPE.WORD_TRANSLATION_TOGGLED | UI_ACTION_TYPE.EXAMPLE_TRANSLATION_TOGGLED,
): void {
  if (wordId === undefined) {
    return;
  }

  store.dispatch({
    type,
    wordId,
  });
}

function dispatchDeclensionAction(wordId: string | undefined, store: IStore<IUiState, UiAction>): void {
  if (wordId === undefined) {
    return;
  }

  store.dispatch({
    type: UI_ACTION_TYPE.DECLENSION_TOGGLED,
    wordId,
  });
}
