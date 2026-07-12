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

export function createStore<TState, TAction>(
  initialState: TState,
  reducer: IReducer<TState, TAction>,
): IStore<TState, TAction> {
  let state = initialState;
  const listeners = new Set<IStoreListener<TState>>();

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
      listeners.forEach((listener) => {
        listener(state);
      });
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
