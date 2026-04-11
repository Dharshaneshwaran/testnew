import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/context/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <div className="min-h-screen bg-transparent lg:flex">
          <Sidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </DashboardProvider>
    </ProtectedRoute>
  );
}
