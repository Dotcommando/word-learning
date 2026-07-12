export interface IReducer<TState, TAction> {
  (state: TState, action: TAction): TState;
}

export interface IStoreListener<TState> {
  (state: TState): void;
}

export interface IUnsubscribe {
  (): void;
}

export interface IStore<TState, TAction> {
  getState(): TState;
  dispatch(action: TAction): void;
  subscribe(listener: IStoreListener<TState>): IUnsubscribe;
}

export interface IHydratableStore<TState, TAction> extends IStore<TState, TAction> {
  replaceState(state: TState): void;
}

export function createStore<TState, TAction>(
  initialState: TState,
  reducer: IReducer<TState, TAction>,
): IHydratableStore<TState, TAction> {
  let state = initialState;
  const listeners = new Set<IStoreListener<TState>>();
  const notify = () => {
    listeners.forEach((listener) => {
      listener(state);
    });
  };

  return {
    getState() {
      return state;
    },
    dispatch(action) {
      const nextState = reducer(state, action);

      if (Object.is(nextState, state)) {
        return;
      }

      state = nextState;
      notify();
    },
    replaceState(nextState) {
      if (Object.is(nextState, state)) {
        return;
      }

      state = nextState;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
