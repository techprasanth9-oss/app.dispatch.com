import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getWorkspaceId, setWorkspaceId, clearWorkspaceId } from '../services/api'
import { getMe, logout as logoutCall, type AuthUser } from '../services/authService'
import { listMyWorkspaces, type Workspace } from '../services/workspaceService'

interface AuthState {
  user: AuthUser | null
  workspace: Workspace | null
  workspaceId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  /** Hydrate user + workspaces after tokens are stored (e.g. after OTP verify / register). */
  bootstrap: () => Promise<void>
  logout: () => Promise<void>
  switchWorkspace: (workspace: Workspace) => void
  workspaces: Workspace[]
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const meRes = await getMe()
      setUser(meRes.data)

      const wsRes = await listMyWorkspaces()
      setWorkspaces(wsRes.data)

      const savedWsId = getWorkspaceId()
      const active = wsRes.data.find((w) => w._id === savedWsId) ?? wsRes.data[0] ?? null
      if (active) {
        setWorkspace(active)
        setWorkspaceId(active._id)
      } else {
        setWorkspace(null)
      }
    } catch {
      // Not signed in — clear state
      setUser(null)
      setWorkspace(null)
      setWorkspaces([])
    }
  }, [])

  // Boot once on mount.
  useEffect(() => {
    loadSession().finally(() => setIsLoading(false))
  }, [loadSession])

  const bootstrap = useCallback(async () => {
    setIsLoading(true)
    try {
      await loadSession()
    } finally {
      setIsLoading(false)
    }
  }, [loadSession])

  const logout = useCallback(async () => {
    try {
      await logoutCall()
    } catch {
      // ignore network errors — we'll still clear local state
    }
    clearWorkspaceId()
    setUser(null)
    setWorkspace(null)
    setWorkspaces([])
  }, [])

  const switchWorkspace = useCallback((ws: Workspace) => {
    setWorkspace(ws)
    setWorkspaceId(ws._id)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const meRes = await getMe()
      setUser(meRes.data)
    } catch {
      // ignore
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        workspaceId: workspace?._id ?? null,
        isAuthenticated: !!user,
        isLoading,
        bootstrap,
        logout,
        switchWorkspace,
        workspaces,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
