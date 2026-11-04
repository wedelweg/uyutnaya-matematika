import { createContext, useContext } from "react";
import type { State } from "./domain/types";
export type Screen =
  | "home"
  | "welcome"
  | "intro"
  | "activity"
  | "summary"
  | "workshop"
  | "map"
  | "parents"
  | "settings"
  | "install";
export interface Context {
  state: State;
  commit: (next: State) => Promise<boolean>;
  navigate: (s: Screen) => void;
  busy: boolean;
  today: string;
  offline: boolean;
  registration: ServiceWorkerRegistration | null;
  update: ServiceWorkerRegistration | null;
}
export const AppContext = createContext<Context | null>(null);
export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("AppContext");
  return c;
}
