import { apiRequest } from "@/lib/api/client";

export interface PendingUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export function listPendingUsers(token: string) {
  return apiRequest<PendingUser[]>("/admin/users/pending", { method: "GET" }, token);
}

export function approveUser(token: string, userId: string) {
  return apiRequest<{ id: string; isApproved: boolean }>("/admin/users/" + encodeURIComponent(userId) + "/approve", { method: "PATCH" }, token);
}

