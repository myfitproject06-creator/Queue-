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
