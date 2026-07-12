import { describe, expect, it } from 'vitest';

import { createStore } from '../src/state/store';

enum COUNTER_ACTION_TYPE {
  INCREMENT = 'increment',
  NOOP = 'noop',
}

interface ICounterState {
  count: number;
}

interface IIncrementAction {
  type: COUNTER_ACTION_TYPE.INCREMENT;
}

interface INoopAction {
  type: COUNTER_ACTION_TYPE.NOOP;
}

type CounterAction = IIncrementAction | INoopAction;

describe('createStore', () => {
  it('returns state, dispatches reducer output, and notifies subscribers deterministically', () => {
    const initialState: ICounterState = {
      count: 0,
    };
    const store = createStore(initialState, counterReducer);
    const observedCounts: number[] = [];
    const unsubscribe = store.subscribe((state) => {
      observedCounts.push(state.count);
    });

    store.dispatch({
      type: COUNTER_ACTION_TYPE.INCREMENT,
    });
    store.dispatch({
      type: COUNTER_ACTION_TYPE.NOOP,
    });
    unsubscribe();
    store.dispatch({
      type: COUNTER_ACTION_TYPE.INCREMENT,
    });

    expect(store.getState()).toEqual({
      count: 2,
    });
    expect(observedCounts).toEqual([
      1,
    ]);
  });
});

function counterReducer(state: ICounterState, action: CounterAction): ICounterState {
  switch (action.type) {
    case COUNTER_ACTION_TYPE.INCREMENT:
      return {
        count: state.count + 1,
      };
    case COUNTER_ACTION_TYPE.NOOP:
      return state;
  }
}
