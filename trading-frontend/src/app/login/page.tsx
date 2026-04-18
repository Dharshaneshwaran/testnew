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

      console.log('Auth response:', response);
      
      if (!response || !response.accessToken || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      loginToSession(response);
      
      // Don't use setTimeout, just redirect immediately since loginToSession updates state synchronously
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : "Login failed";
      console.error('Login error:', errorMessage, submitError);
      setError(errorMessage);
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

            {error && (
              <p className="page-transition text-sm text-red-400" aria-live="polite">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500/90 font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 0 1 8-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Please wait…</span>
                </span>
              ) : isRegisterMode ? (
                "Create Account"
              ) : (
                "Enter Dashboard"
              )}
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

          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold text-white/60 mb-2">Demo Account</p>
            <p className="text-xs text-white/50 mb-1">Email: <span className="text-white/70 font-mono">demo@tradeboard.pro</span></p>
            <p className="text-xs text-white/50 mb-3">Password: <span className="text-white/70 font-mono">demo1234</span></p>
            <button
              type="button"
              onClick={() => {
                setEmail("demo@tradeboard.pro");
                setPassword("demo1234");
                setIsRegisterMode(false);
              }}
              className="mt-3 w-full text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition"
            >
              Fill Demo Credentials
            </button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
