"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { addMessage, createThread, deleteThread, listThreads, saveThreads, upsertThread } from "@/lib/chatStore";
import type { ChatThread } from "@/types/chat";
import { cn } from "@/lib/utils";

export function ChatShell() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function refresh() {
      const next = listThreads();
      setThreads(next);
      if (!activeId && next[0]) setActiveId(next[0].id);
      if (activeId && !next.some((t) => t.id === activeId)) {
        setActiveId(next[0]?.id ?? null);
      }
    }

    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("chat-threads-updated", onUpdate);
    return () => window.removeEventListener("chat-threads-updated", onUpdate);
  }, [activeId]);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, query]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [active?.messages.length, isReplying]);

  const handleNew = () => {
    const thread = createThread();
    saveThreads([thread, ...threads]);
    setActiveId(thread.id);
    setDraft("");
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    if (activeId === id) {
      const next = threads.filter((t) => t.id !== id)[0]?.id ?? null;
      setActiveId(next);
    }
  };

  const handleRename = (id: string, title: string) => {
    const thread = threads.find((t) => t.id === id);
    if (!thread) return;
    upsertThread({ ...thread, title: title.trim() || "New chat" });
  };

  const handleSend = async () => {
    if (!activeId) {
      const thread = createThread();
      saveThreads([thread, ...threads]);
      setActiveId(thread.id);
    }
    const threadId = activeId ?? listThreads()[0]?.id ?? null;
    if (!threadId) return;

    const content = draft.trim();
    if (!content) return;
    setDraft("");

    addMessage(threadId, { role: "user", content });
    setIsReplying(true);

    // Simple placeholder assistant reply (UI-only). Replace with backend/OpenAI later.
    const reply = `Got it. You said: "${content}"`;
    window.setTimeout(() => {
      addMessage(threadId, { role: "assistant", content: reply });
      setIsReplying(false);
    }, 450);
  };

  return (
    <div className="min-h-[calc(100vh-85px)] bg-[#0b0d12] text-white">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 px-3 py-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-6">
        {/* Left */}
        <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          </div>

          <div className="mt-3">
            <label className="flex h-10 items-center rounded-2xl border border-white/10 bg-zinc-950 px-3 text-sm text-white/80 focus-within:border-white/20">
              <Search className="h-4 w-4 text-white/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent px-3 outline-none placeholder:text-white/35"
              />
            </label>
          </div>

          <div className="mt-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
                No chats yet.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredThreads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition",
                      activeId === t.id ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <input
                        value={t.title}
                        onChange={(e) => handleRename(t.id, e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-zinc-100 outline-none"
                      />
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {new Date(t.updatedAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/45 opacity-0 transition hover:bg-white/[0.06] hover:text-white/80 group-hover:opacity-100"
                      role="button"
                      aria-label="Delete chat"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right */}
        <section className="mt-4 flex min-h-[70vh] flex-col rounded-3xl border border-white/10 bg-white/[0.02] lg:mt-0">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-zinc-100">{active?.title ?? "Chat"}</p>
            <p className="mt-0.5 text-xs text-zinc-500">A simple chat UI (local only).</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
            {active?.messages?.length ? (
              <div className="space-y-3">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7",
                      m.role === "user"
                        ? "ml-auto bg-emerald-500/15 text-emerald-50 border border-emerald-500/20"
                        : "bg-white/[0.04] text-zinc-100 border border-white/10",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {isReplying && (
                  <div className="max-w-[80%] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
                    Typing…
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Start a conversation.
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message…"
                rows={1}
                className="max-h-[160px] min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500/90 px-5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                disabled={!draft.trim() || isReplying}
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Enter to send, Shift+Enter for a new line.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

