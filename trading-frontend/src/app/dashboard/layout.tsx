"use client";

import { ReactNode, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { DndContext, DragEndEvent } from "@dnd-kit/core";

function LayoutContent({ children }: { children: ReactNode }) {
  const { mode, setSlot } = useDashboard();

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (mode === "classic") {
      const { over, active } = event;
      if (over && active.data.current?.symbol) {
        const slotIndex = over.data.current?.index;
        if (typeof slotIndex === "number") {
          setSlot(slotIndex, active.data.current.symbol);
        }
      }
    }
  }, [mode, setSlot]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-transparent lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </DndContext>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <LayoutContent>{children}</LayoutContent>
      </DashboardProvider>
    </ProtectedRoute>
  );
}
