import apiClient from './client';
import type { RegisterStoreOwnerDto, RegisterResponse, LoginDto, LoginResponse } from '../../types/store-owner';
import type { AdminLoginDto, AdminLoginResponse } from '../../types/admin';

export async function registerStoreOwner(data: RegisterStoreOwnerDto): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/store-owner/register', data);
  return response.data;
}

export async function loginStoreOwner(data: LoginDto): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/store-owner/login', data);
  return response.data;
}

export async function logoutStoreOwner(): Promise<void> {
  await apiClient.post('/auth/store-owner/logout');
}

export async function refreshStoreOwnerToken(): Promise<{ data: { accessToken: string } }> {
  const response = await apiClient.post<{ data: { accessToken: string } }>(
    '/auth/store-owner/refresh',
  );
  return response.data;
}

export async function loginAdmin(data: AdminLoginDto): Promise<AdminLoginResponse> {
  const response = await apiClient.post<AdminLoginResponse>('/auth/admin/login', data);
  return response.data;
}
