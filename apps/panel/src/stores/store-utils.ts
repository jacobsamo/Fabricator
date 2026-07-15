import { useSelector } from "@tanstack/react-store";

type SelectableStore<TState> = {
  get: () => TState;
  subscribe: (listener: (value: TState) => void) => {
    unsubscribe: () => void;
  };
};

type WritableStore<TState> = {
  setState: (updater: (state: TState) => TState) => void;
};

export function useStoreSelector<TState, TSelected>(
  store: SelectableStore<TState>,
  selector: (state: TState) => TSelected,
) {
  return useSelector(store, selector);
}

export function patchStore<TState extends object>(store: WritableStore<TState>, patch: Partial<TState>) {
  store.setState((state) => ({ ...state, ...patch }));
}
