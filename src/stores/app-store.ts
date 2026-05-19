"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;

  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      unreadMessages: 0,
      setUnreadMessages: (count) => set({ unreadMessages: count }),
      incrementUnread: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
      clearUnread: () => set({ unreadMessages: 0 }),

      theme: "system",
      setTheme: (theme) => set({ theme }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "findora-app-store",
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
