import { apiRequest } from '@/lib/api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isApproved: boolean;
  approvedAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface PendingApprovalResponse {
  status: 'pending_approval';
  message: string;
}

export type RegisterResponse = AuthResponse | PendingApprovalResponse;

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: { email: string; password: string; name?: string }) {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getProfile(token: string) {
  return apiRequest<AuthUser>('/auth/profile', { method: 'GET' }, token);
}
