import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CARDS = [
  {
    icon: '🤖',
    bg: '#EEF2FF',
    label: 'AI 추천 루트',
    desc: '취향 분석으로 최적 일정 자동 생성',
  },
  {
    icon: '✏️',
    bg: '#EFF6FF',
    label: '내가 직접 작성',
    desc: '자유롭게 나만의 여행 일정 만들기',
  },
  {
    icon: '🔥',
    bg: '#FFF1F2',
    label: '인기 일정 추천',
    desc: '다른 여행자의 검증된 루트 탐색',
  },
  {
    icon: '🍃',
    bg: '#F0FDF4',
    label: '계절별 추천',
    desc: '봄·여름·가을·겨울 맞춤 여행지 안내',
  },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(c => (c - 1 + CARDS.length) % CARDS.length)
  const next = () => setCurrent(c => (c + 1) % CARDS.length)

  // 항상 4장 표시: [current-1, current(active), current+1, current+2]
  const visibleIndices = [
    (current - 1 + CARDS.length) % CARDS.length,
    current,
    (current + 1) % CARDS.length,
    (current + 2) % CARDS.length,
  ]

  return (
    <div style={{
      flex: 1,
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
      minHeight: 0,
      height: '100%',
      padding: '0 80px',
      boxSizing: 'border-box',
      gap: '3rem',
    }}>

      {/* 좌측 텍스트 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: 520,
        marginTop: '-40px',
        paddingLeft: '72px',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 3.2vw, 52px)',
          fontWeight: 800,
          color: '#18181B',
          lineHeight: 1.18,
          letterSpacing: '-0.035em',
          marginBottom: 24,
        }}>
          여행을 함께<br />
          계획하고 기록하는<br />
          공간, <span style={{ color: '#4F46E5' }}>Routee</span>
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 1.2vw, 17px)',
          color: '#71717A',
          lineHeight: 1.8,
          marginBottom: 44,
          maxWidth: 380,
        }}>
          장소를 검색하고 일정을 드래그로 구성하세요.<br />
          여행이 끝나면 다이어리로 추억을 남겨요.
        </p>

        <button
          onClick={() => navigate('/schedule')}
          style={{
            background: '#4F46E5',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            padding: '13px 32px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4338CA')}
          onMouseLeave={e => (e.currentTarget.style.background = '#4F46E5')}
        >
          일정 시작하기
        </button>
      </div>

      {/* 우측 카드 슬라이더 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 카드 + 화살표 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 이전 버튼 */}
          <button
            onClick={prev}
            aria-label="이전"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '0.5px solid #D4D4D8', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: '#71717A',
              flexShrink: 0, transition: 'all 0.2s',
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
            ‹
          </button>

          {/* 카드 4장 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {visibleIndices.map((idx, pos) => {
              const card = CARDS[idx]
              const isActive = pos === 1
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrent(idx)
                    if (card.label === '내가 직접 작성' && isActive) {
                      navigate('/schedule')
                    }
                  }}
                  style={{
                    background: '#fff',
                    border: isActive ? '1.5px solid #4F46E5' : '0.5px solid #E4E4E7',
                    borderRadius: 12,
                    padding: '1.25rem 1rem',
                    width: isActive ? 200 : 155,
                    minHeight: isActive ? 280 : 230,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.5,
                    transform: isActive ? 'scale(1)' : 'scale(0.87)',
                    boxShadow: isActive ? '0 0 0 4px #EEF2FF' : 'none',
                    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: isActive ? 2 : 1,
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: isActive ? 64 : 52,
                    height: isActive ? 64 : 52,
                    borderRadius: '50%',
                    background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isActive ? 30 : 24,
                    transition: 'all 0.35s',
                  }}>
                    {card.icon}
                  </div>

                  <div style={{
                    fontSize: isActive ? 15 : 13,
                    fontWeight: 500,
                    color: isActive ? '#18181B' : '#71717A',
                    lineHeight: 1.4,
                  }}>
                    {card.label}
                  </div>

                  {isActive && (
                    <div style={{
                      fontSize: 13,
                      color: '#A1A1AA',
                      lineHeight: 1.5,
                    }}>
                      {card.desc}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={next}
            aria-label="다음"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '0.5px solid #D4D4D8', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: '#71717A',
              flexShrink: 0, transition: 'all 0.2s',
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
            ›
          </button>
        </div>

        {/* 도트 */}
        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          {CARDS.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: i === current ? 3 : '50%',
                background: i === current ? '#4F46E5' : '#D4D4D8',
                cursor: 'pointer',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
