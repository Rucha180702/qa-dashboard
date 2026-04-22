import { apiClient } from './client';
import type { AuthUser } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login', { username, password });
  return res.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiClient.get<AuthUser>('/api/auth/me');
  return res.data;
}
