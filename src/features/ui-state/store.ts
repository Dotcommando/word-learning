import { withPersistence } from '../../state/persistence';
import { createStore } from '../../state/store';
import {
  localStoragePersistence,
  UI_STATE_STORAGE_KEY,
  UI_STATE_VERSION,
} from './persistence';
import { INITIAL_UI_STATE, uiReducer } from './ui-state';

export const uiStore = withPersistence(
  createStore(INITIAL_UI_STATE, uiReducer),
  localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION),
);
