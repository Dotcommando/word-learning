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

  renderApp(appRoot);
  void restoreActiveWordSet(uiStore, createIndexedDbWordSetRepository());
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
