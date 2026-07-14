"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import type { ReactNode } from "react";


interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return <Provider store={store}>{children}</Provider>;
};
