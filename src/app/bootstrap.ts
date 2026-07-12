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
import { type IFileTextReader, importWordSetFile } from '../features/word-sets/import-word-set';
import { createIndexedDbWordSetRepository, type IWordSetRepository } from '../persistence/indexed-db';
import type { IStore } from '../state/store';
import { renderApp } from '../ui/render-app';

export interface IAppEventHandlerOptions {
  readFileText?: IFileTextReader;
  repository: IWordSetRepository;
}

export function bootstrapApp(): void {
  const appRoot = document.querySelector('[data-app-root]');

  if (!(appRoot instanceof HTMLElement)) {
    return;
  }

  const repository = createIndexedDbWordSetRepository();

  attachAppEventHandlers(appRoot, uiStore, {
    repository,
  });
  renderApp(appRoot, uiStore.getState());
  uiStore.subscribe((state) => {
    renderApp(appRoot, state);
  });
  void restoreActiveWordSet(uiStore, repository);
}

export function attachAppEventHandlers(
  root: HTMLElement,
  store: IStore<IUiState, UiAction>,
  options: IAppEventHandlerOptions,
): void {
  let currentImportOperation = 0;

  root.addEventListener('click', (event) => {
    const button = findActionButton(event.target);

    if (button === null) {
      return;
    }

    dispatchButtonAction(button, root, store);
  });
  root.addEventListener('change', (event) => {
    const input = findWordSetFileInput(event.target);

    if (input === null) {
      return;
    }

    const file = input.files?.item(0) ?? null;

    if (file === null) {
      input.value = '';

      return;
    }

    currentImportOperation += 1;

    const importOperation = currentImportOperation;

    void importWordSetFile({
      file,
      isCurrentOperation: () => importOperation === currentImportOperation,
      ...(options.readFileText === undefined ? {} : { readFileText: options.readFileText }),
      repository: options.repository,
      store,
    }).finally(() => {
      input.value = '';
      focusByKey(root, 'toolbar-load-word-set');
    });
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

function dispatchButtonAction(button: HTMLButtonElement, root: HTMLElement, store: IStore<IUiState, UiAction>): void {
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
      openWordSetFilePicker(root);
      break;
    case undefined:
      break;
    default:
      break;
  }
}

function findWordSetFileInput(target: EventTarget | null): HTMLInputElement | null {
  return target instanceof HTMLInputElement && target.dataset['wordSetFileInput'] === 'true'
    ? target
    : null;
}

function openWordSetFilePicker(root: HTMLElement): void {
  const input = root.querySelector('[data-word-set-file-input="true"]');

  if (input instanceof HTMLInputElement) {
    input.click();
  }
}

function focusByKey(root: HTMLElement, focusKey: string): void {
  const candidates = root.querySelectorAll('[data-focus-key]');

  for (const candidate of candidates) {
    if (candidate instanceof HTMLElement && candidate.dataset['focusKey'] === focusKey) {
      candidate.focus({
        preventScroll: true,
      });

      return;
    }
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
