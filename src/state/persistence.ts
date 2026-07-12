import type {
  IHydratableStore,
  IStore,
} from './store';

export interface IPersistenceAdapter<TState> {
  restore(defaultState: TState): TState;
  persist(state: TState): void;
}

export function withPersistence<TState, TAction>(
  store: IHydratableStore<TState, TAction>,
  persistence: IPersistenceAdapter<TState>,
): IStore<TState, TAction> {
  store.replaceState(persistence.restore(store.getState()));
  store.subscribe((state) => {
    persistence.persist(state);
  });

  return store;
}
