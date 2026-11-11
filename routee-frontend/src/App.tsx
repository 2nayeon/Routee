import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import Navbar from './components/layout/Navbar'
import HeroSection from './components/layout/HeroSection'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import ExplorePage from './pages/ExplorePage'
import TripDetailPage from './pages/TripDetailPage'
import MyPage from './pages/MyPage'
import DiaryPage from './pages/DiaryPage'
import RecommendPage from './pages/RecommendPage'

// 구글 OAuth 리다이렉트 후 ?token=... 처리
function OAuthRedirectHandler() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      loginWithToken(token)                      // AuthContext에 토큰 저장
      window.history.replaceState({}, '', '/')   // URL에서 ?token= 제거
      navigate('/schedule', { replace: true })
    }
  }, [])

  return null
}

function LandingPage() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <OAuthRedirectHandler />
      <HeroSection />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', backgroundColor: '#fff', overflow: 'hidden',
    }}>
      <Navbar />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Routes>
          <Route path="/"             element={<LandingPage />} />
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/schedule"     element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
          <Route path="/schedule/:id" element={<PrivateRoute><TripDetailPage /></PrivateRoute>} />
          <Route path="/explore"      element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="/mypage"       element={<PrivateRoute><MyPage /></PrivateRoute>} />
          <Route path="/diary"        element={<PrivateRoute><DiaryPage /></PrivateRoute>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
          <Route path="/recommend" element={<PrivateRoute><RecommendPage /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
