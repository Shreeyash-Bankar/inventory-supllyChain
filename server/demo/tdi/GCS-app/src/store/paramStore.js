// store/paramStore.js
// import { create } from "zustand";

// export const useParamStore = create((set) => ({
//   params: {},
//   meta: {},
//   loading: false,
//   loaded: false,
//   total: 0,

//   setParams: (params) =>
//     set({
//       params,
//       total: Object.keys(params).length,
//       loaded: true,
//       loading: false,
//     }),

//   // updateParam: (id, param) =>
//   //   set((state) => ({
//   //     params: {
//   //       ...state.params,
//   //       [id]: {
//   //         ...state.params[id],
//   //         ...param,
//   //       },
//   //     },
//   //   })),

//   updateParam: (id, newFieldValues) => {
//     const currentParams = get().params;
//     if (!currentParams[id]) return;

//     set({
//       params: {
//         ...currentParams,
//         [id]: {
//           ...currentParams[id],
//           ...newFieldValues,
//         },
//       },
//     });
//   },

//   setMeta: (meta) => set({ meta }),

//   setLoading: (loading) => set({ loading }),
// }));

import { create } from "zustand";

export const useParamStore = create((set) => ({
  params: {},
  meta: {},
  loading: false,
  loaded: false,
  total: 0,

  setParams: (params) =>
    set({
      params,
      total: Object.keys(params).length,
      loaded: true,
      loading: false,
    }),

  updateParam: (id, param) =>
    set((state) => ({
      params: {
        ...state.params,
        [id]: {
          ...state.params[id],
          ...param,
        },
      },
    })),

  setMeta: (meta) => set({ meta }),

  setLoading: (loading) => set({ loading }),
}));
