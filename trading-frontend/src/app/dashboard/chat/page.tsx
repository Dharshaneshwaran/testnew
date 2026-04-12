"use client";

import { Header } from "@/components/layout/Header";
import { ChatShell } from "@/components/chat/ChatShell";

export default function ChatPage() {
  return (
    <main className="min-h-screen">
      <Header title="Chat" subtitle="Chat inside your dashboard" />
      <ChatShell />
    </main>
  );
}

