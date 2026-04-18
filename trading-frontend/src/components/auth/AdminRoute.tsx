"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (status === "authenticated" && !user?.isAdmin) {
      router.replace("/dashboard");
    }
  }, [pathname, router, status, user?.isAdmin]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-zinc-500">
        Validating session...
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-zinc-500">
        Admin access required.
      </div>
    );
  }

  return <>{children}</>;
}

