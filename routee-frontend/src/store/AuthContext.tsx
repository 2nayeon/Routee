import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/index'
import type { LoginRequest } from '../api/index'

interface AuthUser {
  userId: number
  username: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoggedIn: boolean
  login: (data: LoginRequest) => Promise<void>
  loginWithToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// JWT payload 디코딩 (라이브러리 없이)
function decodeJwt(token: string): { userId: number; username: string } | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    // JwtUtil에서 설정한 claim 키에 맞게 수정
    return {
      userId:   decoded.userId   ?? decoded.id  ?? 0,
      username: decoded.username ?? decoded.sub ?? '',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  // 새로고침 시 localStorage에서 복원
  useEffect(() => {
    const token    = localStorage.getItem('token')
    const userId   = localStorage.getItem('userId')
    const username = localStorage.getItem('username')
    if (token && userId && username) {
      setUser({ userId: Number(userId), username })
    }
  }, [])

  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    const { token, userId, username } = res.data
    localStorage.setItem('token',    token)
    localStorage.setItem('userId',   String(userId))
    localStorage.setItem('username', username)
    setUser({ userId, username })
  }

  // 구글 OAuth 콜백 후 URL의 ?token= 으로 로그인 처리
  function loginWithToken(token: string) {
    const decoded = decodeJwt(token)
    if (!decoded) return

    localStorage.setItem('token',    token)
    localStorage.setItem('userId',   String(decoded.userId))
    localStorage.setItem('username', decoded.username)
    setUser({ userId: decoded.userId, username: decoded.username })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
