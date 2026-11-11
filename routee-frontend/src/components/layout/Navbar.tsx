import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

const NAV_ITEMS = [
  { label: '여행 탐색',    path: '/explore' },
  { label: '내 일정',      path: '/schedule' },
  { label: '여행 다이어리', path: '/diary' },
  { label: '추천 루트',    path: '/recommend' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'ME'

  function handleLogout() {
    logout(); setShowDropdown(false); navigate('/')
  }

  const isHome = location.pathname === '/'

  return (
    <nav style={{
      height: '56px',
      background: isHome ? 'transparent' : '#fff',
      borderBottom: isHome ? 'none' : '1px solid #F0F0F0',
      display: 'flex', alignItems: 'center',
      flexShrink: 0, position: 'relative', zIndex: 100,
    }}>
      <div style={{
        width: '100%',
        padding: '0 48px',
        display: 'flex', alignItems: 'center',
        gap: '4px', boxSizing: 'border-box',
      }}>
        {/* 로고 - 인디고로 변경 */}
        <span onClick={() => navigate('/')} style={{
          fontSize: '16px', fontWeight: '700', color: '#4F46E5',
          marginRight: '36px', letterSpacing: '-0.02em', cursor: 'pointer',
        }}>
          Routee
        </span>

        {/* 네비 메뉴 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {NAV_ITEMS.map(({ label, path }) => {
            const active = location.pathname.startsWith(path)
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                padding: '6px 14px', fontSize: '13px',
                color: active ? '#18181B' : '#71717A',
                background: 'transparent',
                border: 'none', cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                borderBottom: active ? '2px solid #4F46E5' : '2px solid transparent',
                borderRadius: '0',
                transition: 'all 0.15s ease',
              }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* 우측 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isLoggedIn ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* username 표시 */}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#18181B' }}>
                {user?.username}
              </span>
              <div onClick={() => setShowDropdown(v => !v)} style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: '#4F46E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '600', color: '#fff',
                cursor: 'pointer', userSelect: 'none',
              }}>
                {initials}
              </div>

              {showDropdown && (
                <>
                  <div onClick={() => setShowDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', borderRadius: '10px',
                    border: '1px solid #F0F0F0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    minWidth: 160, zIndex: 200, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F4F4F5' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#18181B', marginBottom: 2 }}>
                        {user?.username}
                      </div>
                      <div style={{ fontSize: '11px', color: '#A1A1AA' }}>로그인됨</div>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                      <button onClick={() => { navigate('/schedule'); setShowDropdown(false) }}
                        style={{ width: '100%', padding: '8px 16px', border: 'none',
                          background: 'none', textAlign: 'left', fontSize: '13px',
                          color: '#3F3F46', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        📋 내 일정
                      </button>
                      <button onClick={() => { navigate('/mypage'); setShowDropdown(false) }}
                        style={{ width: '100%', padding: '8px 16px', border: 'none',
                          background: 'none', textAlign: 'left', fontSize: '13px',
                          color: '#3F3F46', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        ❤️ 마이페이지
                      </button>
                      <button onClick={handleLogout}
                        style={{ width: '100%', padding: '8px 16px', border: 'none',
                          background: 'none', textAlign: 'left', fontSize: '13px',
                          color: '#EF4444', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        🚪 로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* 로그인 버튼 - 테두리 추가 */}
              <button onClick={() => navigate('/login')} style={{
                padding: '7px 16px', borderRadius: '7px', background: 'none',
                border: '1px solid #D4D4D8', color: '#71717A',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#4F46E5'
                  e.currentTarget.style.color = '#4F46E5'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#D4D4D8'
                  e.currentTarget.style.color = '#71717A'
                }}
              >
                로그인
              </button>
              {/* 회원가입 버튼 */}
              <button onClick={() => navigate('/login')} style={{
                padding: '7px 16px', borderRadius: '7px',
                background: '#4F46E5', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4338CA')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4F46E5')}
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
