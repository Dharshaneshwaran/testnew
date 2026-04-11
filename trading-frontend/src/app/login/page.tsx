"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { login, register } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { login: loginToSession, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = isRegisterMode
        ? await register({ email, password, name: name || undefined })
        : await login({ email, password });

      loginToSession(response);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-zinc-950/80">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ruroxz Finance Beta</p>
          <CardTitle className="mt-1 text-2xl">
            {isRegisterMode ? "Create account" : "Welcome back"}
          </CardTitle>
          <p className="text-sm text-zinc-500">
            {isRegisterMode
              ? "Register to start using your trading dashboard."
              : "Sign in to continue to your trading dashboard."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegisterMode && (
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="Dharshan"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                placeholder="you@trader.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                placeholder="••••••••"
                required
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500/90 font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Please wait..." : isRegisterMode ? "Create Account" : "Enter Dashboard"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsRegisterMode((prev) => !prev)}
            className="w-full text-center text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            {isRegisterMode
              ? "Already have an account? Sign in"
              : "Don't have an account? Register"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
