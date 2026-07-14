import { configureStore, isPlain } from "@reduxjs/toolkit";
import { authApi, leaveApi } from "./action";
import { authReducer } from "./reducer/auth/authSlice";

export const isSerializableCheck = (value: any) =>
    isPlain(value) || (typeof Blob !== "undefined" && value instanceof Blob);

import { isRejectedWithValue } from "@reduxjs/toolkit";
import { logOut } from "./reducer/auth/authSlice";

export const rtkQueryErrorLogger = (api: any) => (next: any) => (action: any) => {
  if (isRejectedWithValue(action)) {
    if (action.payload?.status === 401) {
      api.dispatch(logOut());
    }
  }
  return next(action);
};

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [leaveApi.reducerPath]: leaveApi.reducer,

        auth: authReducer,
    },
    middleware: (getDefaultMiddleware: any) =>
        getDefaultMiddleware({
            serializableCheck: {
                isSerializable: (value: unknown) =>
                    isPlain(value) ||
                    (typeof Blob !== "undefined" && value instanceof Blob),
            },
        }).concat(
            authApi.middleware,
            leaveApi.middleware,
            rtkQueryErrorLogger,
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
