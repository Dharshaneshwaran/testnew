"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type DashboardMode = "classic" | "beta";

interface DashboardContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  dashboardStocks: (string | null)[];
  setSlot: (index: number, symbol: string | null) => void;
  sidebarStocks: string[];
  addSidebarStock: (symbol: string) => void;
  removeSidebarStock: (symbol: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  marketBarVisible: boolean;
  setMarketBarVisible: (visible: boolean) => void;
}

const DEFAULT_SIDEBAR_STOCKS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "ICICIBANK",
  "INFY",
  "TATAMOTORS",
  "BHARTIARTL",
  "SBIN"
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DashboardMode>(() => {
    if (typeof window === "undefined") {
      return "beta";
    }
    const savedMode = window.localStorage.getItem("dashboard_mode") as DashboardMode | null;
    return savedMode ?? "beta";
  });
  const [dashboardStocks, setDashboardStocks] = useState<(string | null)[]>(() => {
    if (typeof window === "undefined") {
      return [null, null, null, null];
    }
    const savedStocks = window.localStorage.getItem("dashboard_stocks");
    if (!savedStocks) {
      return [null, null, null, null];
    }
    try {
      return JSON.parse(savedStocks) as (string | null)[];
    } catch {
      return [null, null, null, null];
    }
  });
  const [sidebarStocks, setSidebarStocks] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SIDEBAR_STOCKS;
    }
    const savedSidebar = window.localStorage.getItem("sidebar_stocks");
    if (!savedSidebar) {
      return DEFAULT_SIDEBAR_STOCKS;
    }
    try {
      return JSON.parse(savedSidebar) as string[];
    } catch {
      return DEFAULT_SIDEBAR_STOCKS;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("sidebar_collapsed") === "1";
  });
  const [marketBarVisible, setMarketBarVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const value = window.localStorage.getItem("market_bar_visible");
    return value !== "0";
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem("dashboard_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("dashboard_stocks", JSON.stringify(dashboardStocks));
  }, [dashboardStocks]);

  useEffect(() => {
    localStorage.setItem("sidebar_stocks", JSON.stringify(sidebarStocks));
  }, [sidebarStocks]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("market_bar_visible", marketBarVisible ? "1" : "0");
  }, [marketBarVisible]);

  const setSlot = (index: number, symbol: string | null) => {
    setDashboardStocks((prev) => {
      const next = [...prev];
      next[index] = symbol;
      return next;
    });
  };

  const addSidebarStock = (symbol: string) => {
    const upper = symbol.toUpperCase().trim();
    if (upper && !sidebarStocks.includes(upper)) {
      setSidebarStocks((prev) => [...prev, upper]);
    }
  };

  const removeSidebarStock = (symbol: string) => {
    setSidebarStocks((prev) => prev.filter((s) => s !== symbol));
    // Also remove from dashboard if present
    setDashboardStocks((prev) => prev.map((s) => (s === symbol ? null : s)));
  };

  return (
    <DashboardContext.Provider
      value={{
        mode,
        setMode,
        dashboardStocks,
        setSlot,
        sidebarStocks,
        addSidebarStock,
        removeSidebarStock,
        sidebarCollapsed,
        setSidebarCollapsed,
        marketBarVisible,
        setMarketBarVisible,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
