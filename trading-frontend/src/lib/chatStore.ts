import type { ChatMessage, ChatThread } from "@/types/chat";

const STORAGE_KEY = "chat_threads_v1";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  // good-enough id for local UI
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<ChatThread[]>(window.localStorage.getItem(STORAGE_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("chat-threads-updated"));
}

export function createThread(): ChatThread {
  const iso = nowIso();
  return {
    id: uuid(),
    title: "New chat",
    createdAt: iso,
    updatedAt: iso,
    messages: [],
  };
}

export function upsertThread(thread: ChatThread) {
  const threads = listThreads();
  const index = threads.findIndex((t) => t.id === thread.id);
  const next = { ...thread, updatedAt: nowIso() };
  if (index >= 0) {
    threads[index] = next;
  } else {
    threads.unshift(next);
  }
  saveThreads(threads);
}

export function deleteThread(threadId: string) {
  const threads = listThreads().filter((t) => t.id !== threadId);
  saveThreads(threads);
}

export function addMessage(threadId: string, message: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  const threads = listThreads();
  const idx = threads.findIndex((t) => t.id === threadId);
  const createdAt = nowIso();
  const full: ChatMessage = { id: uuid(), createdAt, ...message };

  if (idx < 0) {
    const thread = createThread();
    thread.id = threadId;
    thread.messages = [full];
    thread.title = message.role === "user" ? message.content.slice(0, 32) || "New chat" : "New chat";
    saveThreads([thread, ...threads]);
    return full;
  }

  const thread = threads[idx];
  const nextTitle =
    thread.title === "New chat" && message.role === "user"
      ? message.content.slice(0, 32) || "New chat"
      : thread.title;

  threads[idx] = {
    ...thread,
    title: nextTitle,
    updatedAt: nowIso(),
    messages: [...thread.messages, full],
  };

  // bring to top
  const [moved] = threads.splice(idx, 1);
  saveThreads([moved, ...threads]);
  return full;
}

