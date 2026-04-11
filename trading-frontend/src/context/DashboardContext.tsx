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
  const [mode, setMode] = useState<DashboardMode>("beta");
  const [dashboardStocks, setDashboardStocks] = useState<(string | null)[]>([null, null, null, null]);
  const [sidebarStocks, setSidebarStocks] = useState<string[]>(DEFAULT_SIDEBAR_STOCKS);

  // Initialize from localStorage if available
  useEffect(() => {
    const savedMode = localStorage.getItem("dashboard_mode") as DashboardMode;
    if (savedMode) setMode(savedMode);

    const savedStocks = localStorage.getItem("dashboard_stocks");
    if (savedStocks) setDashboardStocks(JSON.parse(savedStocks));

    const savedSidebar = localStorage.getItem("sidebar_stocks");
    if (savedSidebar) setSidebarStocks(JSON.parse(savedSidebar));
  }, []);

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
