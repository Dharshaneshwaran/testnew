"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminRoute } from "@/components/auth/AdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPendingUsers, approveUser, type PendingUser } from "@/lib/api/admin";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminApprovalPage() {
  const { token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingCount = pendingUsers.length;
  const title = useMemo(
    () => (pendingCount === 1 ? "1 pending user" : `${pendingCount} pending users`),
    [pendingCount],
  );

  const refresh = useCallback(async () => {
    if (!token) {
      setPendingUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const users = await listPendingUsers(token);
      setPendingUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleApprove(userId: string) {
    if (!token) return;
    setApprovingId(userId);
    setError(null);
    try {
      await approveUser(token, userId);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve user");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <AdminRoute>
      <main className="min-h-screen px-4 py-10 lg:px-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Admin</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-100">User approvals</h1>
              <p className="mt-1 text-sm text-zinc-500">Approve new registrations before they can sign in.</p>
            </div>
            <Button onClick={refresh} disabled={loading} className="bg-white/5 hover:bg-white/10 text-zinc-100 border-white/10">
              Refresh
            </Button>
          </div>

          <Card className="border-white/10 bg-zinc-950/60">
            <CardHeader>
              <CardTitle className="text-base text-zinc-100">{loading ? "Loading…" : title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <p className="page-transition rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              {!loading && pendingUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">No users waiting for approval.</p>
              ) : null}

              <div className="space-y-2">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {user.email}
                        {user.name ? <span className="text-zinc-500"> · {user.name}</span> : null}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Requested: {new Date(user.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={approvingId === user.id}
                      className="bg-emerald-500/90 font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {approvingId === user.id ? "Approving…" : "Approve"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminRoute>
  );
}
