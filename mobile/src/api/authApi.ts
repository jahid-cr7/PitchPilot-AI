/**
 * PitchPilot AI — mobile auth API client.
 *
 * Thin fetch wrappers around FastAPI auth endpoints. This file does not touch
 * AsyncStorage; the AuthContext owns token persistence so we have a single
 * source of truth for the caller identity.
 */

import { getBackendUrl } from './pitchpilotApi';
import type {
  AuthTokenResponse,
  AuthUser,
  MeResponse,
} from '../types/pitchpilot';

export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

function url(path: string): string {
  return `${getBackendUrl()}${path}`;
}

async function parseJsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (res.ok) {
    return (await res.json()) as T;
  }
  let detail = fallback;
  try {
    const body = await res.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const raw = (body as { detail: unknown }).detail;
      if (typeof raw === 'string') detail = raw;
    }
  } catch {
    // body was not JSON — keep fallback
  }
  throw new AuthApiError(detail, res.status);
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthTokenResponse> {
  const res = await fetch(url('/api/v1/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return parseJsonOrThrow<AuthTokenResponse>(res, 'Registration failed.');
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthTokenResponse> {
  const res = await fetch(url('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow<AuthTokenResponse>(res, 'Invalid email or password.');
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(url('/api/v1/auth/me'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonOrThrow<MeResponse>(res, 'Not authenticated.');
  return body.user;
}

export async function logoutUser(token: string | null): Promise<void> {
  try {
    await fetch(url('/api/v1/auth/logout'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    // Logout is client-side; a network error here should not block sign-out.
  }
}
