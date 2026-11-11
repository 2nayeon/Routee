import { useEffect } from 'react'

interface ToastProps {
  msg: string
  onDone: () => void
  /** 배경색 (기본값: 인디고 계열 페이지의 CHAR, MyPage 등에서는 DEEP 색상을 넘겨주세요) */
  bg?: string
  durationMs?: number
}

/**
 * 화면 하단에 잠시 떴다 사라지는 토스트 메시지.
 * MyPage / ExplorePage 에 거의 동일하게 중복돼 있던 컴포넌트를 통합했습니다.
 */
export default function Toast({ msg, onDone, bg = '#18181B', durationMs = 2200 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs)
    return () => clearTimeout(t)
  }, [onDone, durationMs])

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', borderRadius: 12, padding: '12px 24px',
      fontSize: 13, fontWeight: 600, zIndex: 900,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  )
}
