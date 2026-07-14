import { createSlice } from "@reduxjs/toolkit";

const posServiceSlice = createSlice({
  name: "posService",
  initialState: {
    services: [],
  },
  reducers: {
    clearServices: (state) => {
      state.services = [];
    },
  },
});

export const { clearServices } = posServiceSlice.actions;
export const posServiceReducer = posServiceSlice.reducer;
