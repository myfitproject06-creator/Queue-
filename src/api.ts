import { AuthorizedDevice, DeviceAuthStatusResponse } from './types';

const TOKEN_KEY = 'paint_queue_device_token';

export function getStoredDeviceToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredDeviceToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredDeviceToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredDeviceToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('x-device-token', token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookie is attached
  });
}

export async function checkDeviceAuthStatus(): Promise<DeviceAuthStatusResponse> {
  try {
    const res = await fetchWithAuth('/api/auth/status');
    if (!res.ok) {
      return {
        authorized: false,
        registeredDevices: [
          { side: 'LEFT', status: 'NOT_REGISTERED' },
          { side: 'RIGHT', status: 'NOT_REGISTERED' },
        ],
      };
    }
    return res.json();
  } catch (err) {
    console.error('Failed to check auth status:', err);
    return {
      authorized: false,
      registeredDevices: [
        { side: 'LEFT', status: 'NOT_REGISTERED' },
        { side: 'RIGHT', status: 'NOT_REGISTERED' },
      ],
    };
  }
}

export async function pairDevice(side: 'LEFT' | 'RIGHT', pairingCode: string): Promise<{
  success: boolean;
  message: string;
  device: AuthorizedDevice;
  token: string;
}> {
  const res = await fetch('/api/auth/pair-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ side, pairingCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ลงทะเบียนเครื่องไม่สำเร็จ');
  }

  if (data.token) {
    setStoredDeviceToken(data.token);
  }

  return data;
}

export async function revokeDevice(deviceId: string, pairingCode: string): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetchWithAuth('/api/auth/revoke-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, pairingCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'ถอนการอนุญาตเครื่องไม่สำเร็จ');
  }

  clearStoredDeviceToken();
  return data;
}

export async function updateThemePreset(themeId: string): Promise<{
  success: boolean;
  activeThemeId: string;
  message: string;
}> {
  const res = await fetchWithAuth('/api/theme/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ themeId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'เปลี่ยนธีมไม่สำเร็จ');
  }

  return data;
}

export async function resetQueueOnly(): Promise<{ success: boolean; message: string }> {
  const res = await fetchWithAuth('/api/queue/reset-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'รีเซ็ตคิวไม่สำเร็จ');
  return data;
}

export async function resetAllExceptTheme(): Promise<{ success: boolean; message: string }> {
  const res = await fetchWithAuth('/api/queue/reset-all-except-theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'รีเซ็ตข้อมูลทั้งหมดไม่สำเร็จ');
  return data;
}

export async function createBrandApi(name: string, code: string, color?: string) {
  const res = await fetchWithAuth('/api/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'เพิ่มแบรนด์ไม่สำเร็จ');
  return data;
}

export async function updateBrandApi(id: string, name: string, code: string, color?: string) {
  const res = await fetchWithAuth(`/api/brands/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'แก้ไขแบรนด์ไม่สำเร็จ');
  return data;
}

export async function deleteBrandApi(id: string) {
  const res = await fetchWithAuth(`/api/brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ลบแบรนด์ไม่สำเร็จ');
  return data;
}

export async function deleteEmployeeApi(id: string) {
  const res = await fetchWithAuth(`/api/employees/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ลบพนักงานไม่สำเร็จ');
  return data;
}

export async function toggleActiveEmployeeApi(id: string) {
  const res = await fetchWithAuth(`/api/employees/${encodeURIComponent(id)}/toggle-active`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'เปลี่ยนสถานะพนักงานไม่สำเร็จ');
  return data;
}

