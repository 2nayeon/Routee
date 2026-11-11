import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { authApi } from '../api/index'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [form, setForm]       = useState({ username: '', password: '', email: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E4E4E7', fontSize: 14, color: '#18181B',
    outline: 'none', background: '#FAFAFA', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#52525B',
    display: 'block', marginBottom: 6,
  }

  async function handleSubmit() {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password })
        navigate('/')
      } else {
        await authApi.signup({ username: form.username, password: form.password, email: form.email })
        setMode('login')
        setError('회원가입 완료! 로그인해주세요.')
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? '오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100%', background: '#F8F8FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        width: 420, background: '#fff', borderRadius: 20,
        border: '1px solid #E8E8F0',
        boxShadow: '0 8px 40px rgba(79,70,229,0.07)',
        padding: '44px 40px',
      }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#18181B', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#4F46E5' }}>Routee</span>
          </div>
          <div style={{ fontSize: 13, color: '#A1A1AA', marginTop: 8 }}>
            {mode === 'login' ? '여행의 모든 루트를 시작해요' : '새 계정을 만들어요'}
          </div>
        </div>

        {/* 탭 */}
        <div style={{
          display: 'flex', background: '#F4F4F5', borderRadius: 10,
          padding: 4, marginBottom: 28, gap: 4,
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#4F46E5' : '#A1A1AA',
              fontSize: 13, fontWeight: mode === m ? 700 : 400,
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>아이디</label>
            <input
              style={inputStyle}
              placeholder="아이디 입력"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>이메일</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="이메일 입력"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>비밀번호</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')}
            />
          </div>
        </div>

        {/* 에러 / 성공 메시지 */}
        {error && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 12,
            background: error.includes('완료') ? '#F0FDF4' : '#FFF5F5',
            color: error.includes('완료') ? '#16A34A' : '#DC2626',
            border: `1px solid ${error.includes('완료') ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {error}
          </div>
        )}

        {/* 메인 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.username || !form.password}
          style={{
            width: '100%', marginTop: 24, padding: '12px 0', borderRadius: 10,
            border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: (loading || !form.username || !form.password) ? '#C7D2FE' : '#4F46E5',
            color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            if (!loading && form.username && form.password)
              e.currentTarget.style.background = '#4338CA'
          }}
          onMouseLeave={e => {
            if (!loading && form.username && form.password)
              e.currentTarget.style.background = '#4F46E5'
          }}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        {/* 구분선 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E4E4E7' }} />
          <span style={{ fontSize: 12, color: '#A1A1AA', whiteSpace: 'nowrap' }}>또는</span>
          <div style={{ flex: 1, height: '1px', background: '#E4E4E7' }} />
        </div>

        {/* 구글 간편 로그인 */}
        <button
          onClick={() => { window.location.href = '/oauth2/authorization/google' }}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10,
            border: '1.5px solid #E4E4E7', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#18181B',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#4F46E5'
            e.currentTarget.style.background = '#F8F8FF'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E4E4E7'
            e.currentTarget.style.background = '#fff'
          }}
        >
          {/* 구글 로고 SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56637 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8196H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8196L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>

      </div>
    </div>
  )
}
