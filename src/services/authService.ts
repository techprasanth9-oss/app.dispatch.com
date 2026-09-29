import { api } from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  jobTitle?: string | null
  timezone?: string | null
  status: string
  onboardedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SendOtpResponse {
  success: boolean
  data: { message: string }
}

/** verifyOtp branches on isNewUser — existing users get tokens, new users get a registrationToken. */
export interface VerifyOtpResponse {
  success: boolean
  data: {
    isNewUser: boolean
    /** Present when isNewUser === true. Pass to register() within 10 min. */
    registrationToken?: string
    /** Present when isNewUser === false. Stored by the service automatically. */
    accessToken?: string
    refreshToken?: string
    user?: AuthUser
  }
}

export interface RegisterResponse {
  success: boolean
  data: {
    user: AuthUser
    workspace: { _id: string; name: string; slug: string }
    accessToken: string
    refreshToken: string
  }
}

export interface MeResponse {
  success: boolean
  data: AuthUser
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export function sendOtp(email: string): Promise<SendOtpResponse> {
  return api.post<SendOtpResponse>('/auth/otp/send', { email })
}

/**
 * Verifies OTP. Side effect: if the user already exists, tokens are stored
 * automatically so subsequent API calls are authenticated. If the user is new,
 * caller must forward the `registrationToken` from `res.data` to register().
 */
export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResponse> {
  const res = await api.post<VerifyOtpResponse>('/auth/otp/verify', { email, code })
  if (!res.data.isNewUser && res.data.accessToken && res.data.refreshToken) {
    api.setTokens(res.data.accessToken, res.data.refreshToken)
  }
  return res
}

/** Completes registration for a new user. Stores tokens as a side effect. */
export async function register(
  registrationToken: string,
  name: string,
  email: string,
  workspaceName: string,
): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>('/auth/register', {
    registrationToken,
    name,
    email,
    workspaceName,
  })
  if (res.data.accessToken && res.data.refreshToken) {
    api.setTokens(res.data.accessToken, res.data.refreshToken)
  }
  return res
}

/** Revokes the refresh token server-side and clears local tokens either way. */
export async function logout(): Promise<void> {
  const refreshToken = api.getRefreshToken()
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken })
    }
  } catch {
    // Swallow network errors — we still want to clear local state.
  } finally {
    api.clearTokens()
  }
}

export function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>('/auth/me')
}

export function updateMe(
  data: Partial<
    Pick<AuthUser, 'name' | 'phone' | 'avatar' | 'jobTitle' | 'timezone' | 'onboardedAt'>
  >,
): Promise<MeResponse> {
  return api.patch<MeResponse>('/auth/me', data)
}
