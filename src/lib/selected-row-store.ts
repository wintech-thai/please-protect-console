import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SelectedRowState = {
  rows: Record<string, string | null>;
  set: (tableKey: string, id: string | null) => void;
};

const _store = create<SelectedRowState>()(
  persist(
    (setState) => ({
      rows: {},
      set: (tableKey, id) =>
        setState((s) => ({ rows: { ...s.rows, [tableKey]: id } })),
    }),
    {
      name: "selected-rows",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ rows: s.rows }),
    },
  ),
);

/** Usage: const { selectedId, setSelectedId } = useSelectedRowStore("alerts") */
export function useSelectedRowStore(tableKey: string) {
  const selectedId = _store((s) => s.rows[tableKey] ?? null);
  const setSelectedId = (id: string | null) => _store.getState().set(tableKey, id);
  return { selectedId, setSelectedId };
}
