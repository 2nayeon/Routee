import { useState } from 'react'

interface CreateFolderModalProps {
  onCreate: (name: string) => void
  onClose: () => void
  /** 테마 색상 — 인디고 계열 페이지는 기본값 그대로, MyPage 같은 스카이블루 계열은 직접 넘겨주세요 */
  accent?: string
  accentDark?: string
  border?: string
  textDark?: string
  textMid?: string
  overlay?: string
}

/**
 * "새 폴더 만들기" 모달.
 * MyPage / ExplorePage 에 거의 동일하게 중복돼 있던 컴포넌트를 통합했습니다.
 */
export default function CreateFolderModal({
  onCreate,
  onClose,
  accent = '#4F46E5',
  accentDark = '#4338CA',
  border = '#E4E4E7',
  textDark = '#18181B',
  textMid = '#71717A',
  overlay = 'rgba(0,0,0,0.25)',
}: CreateFolderModalProps) {
  const [name, setName] = useState('')

  function submit() {
    if (name.trim()) onCreate(name.trim())
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: overlay,
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: '28px 32px', width: 360,
        boxShadow: '0 20px 60px rgba(79,70,229,0.15)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: textDark, margin: '0 0 16px' }}>새 폴더 만들기</h3>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="폴더 이름 입력"
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: `1.5px solid ${border}`, fontSize: 14, color: textDark,
            outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = accent)}
          onBlur={e => (e.currentTarget.style.borderColor = border)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            border: `1.5px solid ${border}`, background: '#fff',
            fontSize: 13, fontWeight: 600, color: textMid, cursor: 'pointer',
          }}>
            취소
          </button>
          <button
            disabled={!name.trim()}
            onClick={submit}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
              background: name.trim() ? accent : border,
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = accentDark }}
            onMouseLeave={e => { if (name.trim()) e.currentTarget.style.background = accent }}
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}
